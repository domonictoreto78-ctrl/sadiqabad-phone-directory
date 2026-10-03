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
  path: '/api/search',
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

  // Secondary In-Memory IP rate limiter
  const clientIp = getClientIp(req);
  const rateLimitStatus = checkInMemoryRateLimit(clientIp, 20, 60000);
  if (!rateLimitStatus.allowed) {
    return jsonResponse(
      {
        error: 'Too many search requests. Please slow down and try again in a few seconds.',
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

  const query = typeof body.query === 'string' ? body.query.trim().slice(0, 300) : '';
  const lang = body.lang === 'ur' ? 'ur' : 'en';

  if (!query) {
    return jsonResponse({
      filters: {},
      results: [],
      source: 'empty',
    });
  }

  const { categorySlugs, areaSlugs } = await getValidTaxonomy();
  let parsedFilters: any = null;
  let source: 'ai' | 'fallback' = 'ai';

  // 1. Try AI parsing using Netlify AI Gateway
  try {
    const openai = new OpenAI();
    const prompt = `You are a city directory search engine analyzer for Sadiqabad city, Pakistan.
Analyze the user's free-text search query which can be in English, Urdu, or Roman Urdu (e.g. "dactar", "bijli wala mistri", "sasta pizza", "khula hua medical store raat ko", "hospital road").
Extract structured JSON filters matching only these allowed slugs:
Allowed Category Slugs: ${JSON.stringify(categorySlugs)}
Allowed Area Slugs: ${JSON.stringify(areaSlugs)}

Return ONLY valid JSON with no markdown wrapping, no extra keys, following this exact schema:
{
  "category_slug": string or null (must be one of the Allowed Category Slugs, or null if uncertain),
  "area_slug": string or null (must be one of the Allowed Area Slugs, or null if uncertain),
  "keywords": string[] (array of normalized search keywords),
  "open_now": boolean or null (true if user asked for open/night/24h/khula),
  "min_rating": number or null (e.g. 4.0 or 4.5 if user asked for best/top/behtareen),
  "sort": "rating" | "nearest" | "relevance"
}

User Query: "${query.replace(/"/g, '\\"')}"`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      max_tokens: 300,
      temperature: 0.1,
    });

    const content = completion.choices[0]?.message?.content || '{}';
    const rawParsed = JSON.parse(content);

    // Validate taxonomy strictly against real database slugs
    parsedFilters = {
      category_slug: categorySlugs.includes(rawParsed.category_slug) ? rawParsed.category_slug : null,
      area_slug: areaSlugs.includes(rawParsed.area_slug) ? rawParsed.area_slug : null,
      keywords: Array.isArray(rawParsed.keywords) ? rawParsed.keywords.map(String) : [],
      open_now: rawParsed.open_now === true,
      min_rating: typeof rawParsed.min_rating === 'number' ? rawParsed.min_rating : undefined,
      sort: ['rating', 'nearest', 'relevance'].includes(rawParsed.sort) ? rawParsed.sort : 'relevance',
    };
  } catch (err: any) {
    // Graceful fallback to local Roman Urdu synonym dictionary
    source = 'fallback';
    parsedFilters = parseQueryWithSynonyms(query);
  }

  // 2. Query Supabase businesses using the parsed filters
  let dbQuery = serverSupabase
    .from('businesses')
    .select('*, categories(*), areas(*)')
    .eq('is_active', true);

  if (parsedFilters.category_slug) {
    // Find category ID
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

  if (parsedFilters.min_rating) {
    dbQuery = dbQuery.gte('rating', parsedFilters.min_rating);
  }

  if (parsedFilters.sort === 'rating') {
    dbQuery = dbQuery.order('rating', { ascending: false });
  } else {
    dbQuery = dbQuery.order('is_featured', { ascending: false }).order('views_count', { ascending: false });
  }

  // Fetch candidate businesses
  const { data: rawResults, error: dbError } = await dbQuery.limit(30);
  let results = rawResults || [];

  // Keyword text filtering if keywords provided and results still large
  if (parsedFilters.keywords && parsedFilters.keywords.length > 0 && results.length > 0) {
    const kw = parsedFilters.keywords.map((k: string) => k.toLowerCase());
    const filtered = results.filter((b) => {
      const text = `${b.name} ${b.name_ur || ''} ${b.description || ''} ${b.address || ''} ${b.google_category || ''}`.toLowerCase();
      return kw.some((word: string) => text.includes(word));
    });
    if (filtered.length > 0) {
      results = filtered;
    }
  }

  // Format category and area sub-objects
  const formattedResults = results.map((b) => ({
    ...b,
    category: b.categories,
    area: b.areas,
  }));

  // 3. Log search query asynchronously to search_logs
  try {
    await serverSupabase.from('search_logs').insert([
      {
        query,
        parsed_filters: parsedFilters,
        results_count: formattedResults.length,
        language: lang,
      },
    ]);
  } catch (logErr) {
    // Non-blocking
  }

  return jsonResponse({
    filters: parsedFilters,
    results: formattedResults,
    source,
  });
}
