import {
  checkInMemoryRateLimit,
  getClientIp,
  jsonResponse,
  errorResponse,
  CORS_HEADERS,
} from './_shared/helpers';
import { serverSupabase } from './_shared/supabase';

export const config = {
  path: '/api/submit-review',
};

const SPAM_KEYWORDS = [
  'casino',
  'viagra',
  'crypto',
  'whatsapp loan',
  'earn money online',
  'free bit coin',
  'seo ranking',
  'dating site',
  'porn',
  'xxx',
];

function containsSpam(text: string): boolean {
  const lower = text.toLowerCase();
  // Check URLs
  const urlCount = (lower.match(/https?:\/\//g) || []).length;
  if (urlCount > 1) return true;
  return SPAM_KEYWORDS.some((kw) => lower.includes(kw));
}

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  // Rate Limiting: 5 reviews per hour per client IP
  const clientIp = getClientIp(req);
  const rateLimit = checkInMemoryRateLimit(`review:${clientIp}`, 5, 3600000);
  if (!rateLimit.allowed) {
    return errorResponse(
      'Rate limit reached. You can only submit up to 5 reviews per hour.',
      429,
      { retryAfterSec: rateLimit.resetInSec }
    );
  }

  try {
    const body = await req.json();
    const {
      business_id,
      author_name,
      rating,
      comment,
      hp_field, // Honeypot field (hidden from real users)
      form_opened_at, // Timestamp when form was loaded (minimum time on form check)
    } = body;

    // 1. Honeypot check
    if (hp_field && String(hp_field).trim().length > 0) {
      // Quietly reject bots without giving clues
      return jsonResponse({
        success: true,
        message: 'Thanks, your review has been submitted and will appear after moderation.',
      });
    }

    // 2. Minimum time-on-form check (bots submit in < 2 seconds)
    if (form_opened_at) {
      const elapsed = Date.now() - Number(form_opened_at);
      if (elapsed < 2000) {
        return errorResponse('Form submission was too fast. Please take a moment to write your review.', 400);
      }
    }

    // 3. Validation
    if (!business_id) {
      return errorResponse('Missing business_id.', 400);
    }

    const cleanAuthor = String(author_name || '').trim();
    if (!cleanAuthor || cleanAuthor.length < 2 || cleanAuthor.length > 100) {
      return errorResponse('Please enter your name (2 to 100 characters).', 400);
    }

    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return errorResponse('Rating must be an integer between 1 and 5 stars.', 400);
    }

    const cleanComment = comment ? String(comment).trim() : '';
    if (cleanComment.length > 500) {
      return errorResponse('Comment cannot exceed 500 characters.', 400);
    }

    // 4. Spam filter
    if (cleanComment && containsSpam(cleanComment)) {
      return errorResponse('Review content was flagged by our automated spam filter.', 400);
    }

    // 5. Insert into Supabase
    const { data, error } = await serverSupabase
      .from('reviews')
      .insert([
        {
          business_id,
          author_name: cleanAuthor,
          rating: numRating,
          comment: cleanComment || null,
          status: 'pending',
        },
      ])
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Error inserting review:', error);
      return errorResponse('Failed to record review. Please try again.', 500, error.message);
    }

    return jsonResponse({
      success: true,
      reviewId: data?.id,
      message: 'Thanks! Your review has been submitted and will appear after moderation.',
    });
  } catch (err: any) {
    console.error('submit-review error:', err);
    return errorResponse('Invalid request body.', 400);
  }
}
