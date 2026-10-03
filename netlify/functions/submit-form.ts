import {
  checkInMemoryRateLimit,
  getClientIp,
  jsonResponse,
  errorResponse,
  CORS_HEADERS,
} from './_shared/helpers';
import { serverSupabase } from './_shared/supabase';

export const config = {
  path: '/api/submit-form',
};

const VALID_TYPES = ['new_business', 'claim_business', 'correction', 'phone_suggestion'];

export default async function handler(req: Request) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  // Rate Limiting: 10 form submissions per hour per client IP
  const clientIp = getClientIp(req);
  const rateLimit = checkInMemoryRateLimit(`form:${clientIp}`, 10, 3600000);
  if (!rateLimit.allowed) {
    return errorResponse(
      'Rate limit reached. You can only submit up to 10 requests per hour.',
      429,
      { retryAfterSec: rateLimit.resetInSec }
    );
  }

  try {
    const body = await req.json();
    const {
      type,
      business_id,
      payload,
      contact_name,
      contact_phone,
      hp_field,
      form_opened_at,
    } = body;

    // 1. Honeypot check
    if (hp_field && String(hp_field).trim().length > 0) {
      return jsonResponse({
        success: true,
        message: 'Thank you! Your submission has been received and will be reviewed by our team.',
      });
    }

    // 2. Minimum time check (must spend at least 2 seconds)
    if (form_opened_at) {
      const elapsed = Date.now() - Number(form_opened_at);
      if (elapsed < 2000) {
        return errorResponse('Submission was too rapid. Please take a moment to review your information.', 400);
      }
    }

    // 3. Type check
    if (!type || !VALID_TYPES.includes(type)) {
      return errorResponse(`Invalid submission type. Must be one of: ${VALID_TYPES.join(', ')}`, 400);
    }

    // 4. Payload check
    if (!payload || typeof payload !== 'object') {
      return errorResponse('Missing or invalid submission payload.', 400);
    }

    // For new business, check name
    if (type === 'new_business') {
      const name = payload.name ? String(payload.name).trim() : '';
      if (!name || name.length < 2) {
        return errorResponse('Business name is required.', 400);
      }
    }

    // For corrections/claims/phone, check business_id
    if (['claim_business', 'correction', 'phone_suggestion'].includes(type) && !business_id) {
      return errorResponse('A target business_id is required for this request.', 400);
    }

    // 5. Insert into submissions table
    const { data, error } = await serverSupabase
      .from('submissions')
      .insert([
        {
          type,
          business_id: business_id || null,
          payload,
          contact_name: contact_name ? String(contact_name).trim().slice(0, 100) : null,
          contact_phone: contact_phone ? String(contact_phone).trim().slice(0, 30) : null,
          status: 'pending',
        },
      ])
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Error inserting submission:', error);
      return errorResponse('Failed to submit request. Please try again later.', 500, error.message);
    }

    let successMsg = 'Thank you! Your submission has been received and will be reviewed by our administration team.';
    if (type === 'phone_suggestion') {
      successMsg = 'Thank you! The updated phone number has been submitted for review.';
    } else if (type === 'claim_business') {
      successMsg = 'Claim request received! Our team will verify your contact details.';
    } else if (type === 'correction') {
      successMsg = 'Correction received! Thank you for helping keep Sadiqabad directory accurate.';
    }

    return jsonResponse({
      success: true,
      submissionId: data?.id,
      message: successMsg,
    });
  } catch (err: any) {
    console.error('submit-form error:', err);
    return errorResponse('Invalid request body.', 400);
  }
}
