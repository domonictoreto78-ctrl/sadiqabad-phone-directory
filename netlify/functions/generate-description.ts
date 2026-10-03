import OpenAI from 'openai';
import {
  AI_MODEL,
  jsonResponse,
  errorResponse,
  CORS_HEADERS,
} from './_shared/helpers';
import { verifyAdminToken, getValidTaxonomy } from './_shared/supabase';

export const config = {
  path: '/api/generate-description',
};

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  // 1. ADMIN AUTHENTICATION GUARD
  const adminAuth = await verifyAdminToken(req);
  if (!adminAuth || !adminAuth.isAdmin) {
    return errorResponse('Unauthorized: Admin access required', 401);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON payload');
  }

  const {
    name,
    category,
    area,
    address,
    price_range,
    google_category,
  } = body;

  if (!name) {
    return errorResponse('Business name is required');
  }

  const { categorySlugs } = await getValidTaxonomy();

  try {
    const openai = new OpenAI();

    const systemPrompt = `You are a professional business copywriter for Sadiqabad City Directory (Pakistan).
Given factual details about a business, generate:
1. "description_en": 2-3 sentences in clear, professional English summarizing the business based ONLY on provided facts. Do NOT invent awards, certifications, or unmentioned services.
2. "description_ur": An accurate, natural Urdu translation of the description (in Urdu script).
3. "suggested_category_slug": The best matching category slug chosen ONLY from: ${JSON.stringify(categorySlugs)}.
4. "tags": 3 to 5 relevant search tags in lowercase.

Respond strictly in JSON format:
{
  "description_en": "string",
  "description_ur": "string",
  "suggested_category_slug": "string",
  "tags": ["tag1", "tag2"]
}`;

    const userPrompt = `Business Facts:
Name: ${name}
Current Category: ${category || 'Unknown'}
Area / Location: ${area || 'Sadiqabad'}
Address: ${address || 'Sadiqabad, Pakistan'}
Price Range: ${price_range || 'Not specified'}
Google Business Type: ${google_category || 'General business'}`;

    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 350,
      temperature: 0.2,
    });

    const parsed = JSON.parse(completion.choices[0]?.message?.content || '{}');

    return jsonResponse({
      description_en: parsed.description_en || '',
      description_ur: parsed.description_ur || '',
      suggested_category_slug: categorySlugs.includes(parsed.suggested_category_slug)
        ? parsed.suggested_category_slug
        : undefined,
      tags: Array.isArray(parsed.tags) ? parsed.tags : [],
    });
  } catch (err: any) {
    console.error('Generate description error:', err);
    return errorResponse('Failed to generate description with AI', 500, err.message);
  }
}
