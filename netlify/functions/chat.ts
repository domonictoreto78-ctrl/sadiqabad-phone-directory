import OpenAI from 'openai';
import {
  AI_MODEL,
  checkInMemoryRateLimit,
  getClientIp,
  jsonResponse,
  errorResponse,
  CORS_HEADERS,
} from './_shared/helpers';
import { serverSupabase, getValidTaxonomy } from './_shared/supabase';
import { parseQueryWithSynonyms } from '../../src/lib/transliteration';

export const config = {
  path: '/api/chat',
  rateLimit: {
    windowLimit: 20,
    windowSize: 60,
    aggregateBy: ['ip', 'domain'],
  },
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  const clientIp = getClientIp(req);
  const rateLimitStatus = checkInMemoryRateLimit(clientIp, 20, 60000);
  if (!rateLimitStatus.allowed) {
    return jsonResponse(
      {
        error: 'Too many messages sent. Please wait a few moments before messaging again.',
        retryAfter: rateLimitStatus.resetInSec,
      },
      429
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  // Treat user text strictly as data (prompt-injection safe) & cap at 300 chars
  const message = typeof body.message === 'string' ? body.message.trim().slice(0, 300) : '';
  const lang = body.lang === 'ur' ? 'ur' : 'en';
  const rawHistory = Array.isArray(body.history) ? body.history.slice(-6) : [];

  if (!message) {
    return errorResponse('Message is required', 400);
  }

  const { categorySlugs, areaSlugs } = await getValidTaxonomy();

  // (a) Extract search filters from user message
  let parsedFilters: any = parseQueryWithSynonyms(message);

  try {
    const openai = new OpenAI();
    const filterExtractPrompt = `You are a query filter extractor for Sadiqabad City Directory.
Allowed categories: ${JSON.stringify(categorySlugs)}
Allowed areas: ${JSON.stringify(areaSlugs)}

User query: "${message.replace(/"/g, '\\"')}"

Respond in JSON only:
{
  "category_slug": string or null,
  "area_slug": string or null,
  "keywords": string[],
  "open_now": boolean or null
}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: filterExtractPrompt }],
      response_format: { type: 'json_object' },
      max_tokens: 150,
      temperature: 0.1,
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
    if (categorySlugs.includes(parsed.category_slug)) {
      parsedFilters.category_slug = parsed.category_slug;
    }
    if (areaSlugs.includes(parsed.area_slug)) {
      parsedFilters.area_slug = parsed.area_slug;
    }
  } catch (e) {
    // Keep local synonym parsing
  }

  // (b) Fetch up to 8 candidate businesses from Supabase
  let dbQuery = serverSupabase
    .from('businesses')
    .select('id, name, name_ur, address, phone, rating, reviews_count, is_verified, categories(name_en, name_ur), areas(name_en, name_ur)')
    .eq('is_active', true);

  if (parsedFilters.category_slug) {
    const { data: cat } = await serverSupabase
      .from('categories')
      .select('id')
      .eq('slug', parsedFilters.category_slug)
      .maybeSingle();

    if (cat) {
      dbQuery = dbQuery.eq('category_id', cat.id);
    }
  }

  if (parsedFilters.area_slug) {
    const { data: area } = await serverSupabase
      .from('areas')
      .select('id')
      .eq('slug', parsedFilters.area_slug)
      .maybeSingle();

    if (area) {
      dbQuery = dbQuery.eq('area_id', area.id);
    }
  }

  const { data: candidatesData } = await dbQuery
    .order('is_featured', { ascending: false })
    .order('rating', { ascending: false })
    .limit(8);

  const candidates = candidatesData || [];
  const validCandidateIds = new Set(candidates.map((c) => c.id));

  // (c) Ask the model to answer ONLY using candidates in user's language, short and friendly
  let answer = '';
  let business_ids: string[] = [];

  try {
    const openai = new OpenAI();

    const systemPrompt = `You are "Sadiqabad Guide", a knowledgeable, polite local directory assistant for Sadiqabad city, Pakistan.
CRITICAL RULES:
1. Answer ONLY using the candidate businesses listed below. NEVER invent business names, phone numbers, addresses, or hours.
2. If there are no candidates, honestly tell the user that no matching businesses were found in Sadiqabad directory yet, and recommend browsing general categories like Doctors, Hospitals, or Restaurants.
3. Keep your response concise, polite, and practical (2 to 4 sentences).
4. Language rule: If lang='ur' or user wrote in Urdu/Roman Urdu, respond in polite, natural Urdu (or Roman Urdu if requested). If lang='en', respond in clear English.
5. In addition to your text answer, you must return the list of business IDs from the candidates that you referenced.

CANDIDATES AVAILABLE:
${JSON.stringify(candidates, null, 2)}

Respond ONLY as a JSON object:
{
  "answer": "your answer here",
  "business_ids": ["uuid-1", "uuid-2"]
}`;

    const conversationMessages: any[] = [
      { role: 'system', content: systemPrompt },
    ];

    // Add safe prior history turns (max 6)
    for (const h of rawHistory) {
      if (h.role === 'user' || h.role === 'assistant') {
        conversationMessages.push({
          role: h.role,
          content: String(h.content || '').slice(0, 300),
        });
      }
    }

    conversationMessages.push({
      role: 'user',
      content: message,
    });

    const chatResponse = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: conversationMessages,
      response_format: { type: 'json_object' },
      max_tokens: 400,
      temperature: 0.3,
    });

    const parsedChat = JSON.parse(chatResponse.choices[0]?.message?.content || '{}');
    answer = parsedChat.answer || (lang === 'ur' ? 'معذرت، میں آپ کی رہنمائی نہیں کر سکا۔' : 'I could not find matching businesses.');

    // Validate that every returned id exists in candidates
    const rawIds: string[] = Array.isArray(parsedChat.business_ids) ? parsedChat.business_ids : [];
    business_ids = rawIds.filter((id) => validCandidateIds.has(id));
  } catch (err: any) {
    if (candidates.length > 0) {
      business_ids = candidates.slice(0, 3).map((c) => c.id);
      answer = lang === 'ur'
        ? `صادق آباد میں آپ کی تلاش کے مطابق یہ ادارے دستیاب ہیں:`
        : `Here are the top places found in Sadiqabad directory for your query:`;
    } else {
      answer = lang === 'ur'
        ? 'معذرت، اس وقت آپ کی تلاش کے مطابق کوئی بزنس نہیں ملا۔ آپ دیگر کیٹیگریز دیکھ سکتے ہیں۔'
        : 'Sorry, no matching business was found for your query. Try browsing our popular categories.';
    }
  }

  // (d) Log to chat_logs
  try {
    await serverSupabase.from('chat_logs').insert([
      {
        user_message: message,
        answer,
        business_ids,
      },
    ]);
  } catch (err) {
    // Non-blocking
  }

  return jsonResponse({
    answer,
    business_ids,
  });
}
