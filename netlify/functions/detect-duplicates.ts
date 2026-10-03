import OpenAI from 'openai';
import {
  AI_MODEL,
  jsonResponse,
  errorResponse,
  CORS_HEADERS,
} from './_shared/helpers';
import { verifyAdminToken } from './_shared/supabase';
import { Business, DuplicateGroup } from '../../src/types';

export const config = {
  path: '/api/detect-duplicates',
};

// Distance helper (Haversine formula in meters)
function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Trigram / Bigram similarity helper
function stringSimilarity(s1: string, s2: string): number {
  const clean1 = (s1 || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  const clean2 = (s2 || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  if (!clean1 || !clean2) return 0;
  if (clean1 === clean2) return 1;

  const pairs1 = new Set<string>();
  for (let i = 0; i < clean1.length - 1; i++) {
    pairs1.add(clean1.slice(i, i + 2));
  }
  const pairs2 = new Set<string>();
  for (let i = 0; i < clean2.length - 1; i++) {
    pairs2.add(clean2.slice(i, i + 2));
  }

  let intersection = 0;
  for (const p of pairs1) {
    if (pairs2.has(p)) intersection++;
  }

  return (2 * intersection) / (pairs1.size + pairs2.size || 1);
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return errorResponse('Method Not Allowed', 405);
  }

  const adminAuth = await verifyAdminToken(req);
  if (!adminAuth || !adminAuth.isAdmin) {
    return errorResponse('Unauthorized: Admin access required', 401);
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return errorResponse('Invalid JSON body');
  }

  const businesses: Business[] = Array.isArray(body.businesses) ? body.businesses : [];
  if (businesses.length === 0) {
    return jsonResponse({
      duplicateGroups: [],
      suspiciousItems: [],
      totalEvaluated: 0,
    });
  }

  const suspiciousItems: { id: string; name: string; reasons: string[] }[] = [];
  const duplicateGroups: DuplicateGroup[] = [];
  const processedPairKeys = new Set<string>();

  // 1. Flag suspicious data
  for (const b of businesses) {
    const reasons: string[] = [];

    // Empty or suspiciously short name
    if (!b.name || b.name.trim().length < 3) {
      reasons.push('Business name is missing or extremely short');
    }

    // Invalid phone format if phone is provided
    if (b.phone) {
      const cleanDigits = b.phone.replace(/\D/g, '');
      if (cleanDigits.length < 7 || cleanDigits.length > 13) {
        reasons.push(`Suspicious phone format: "${b.phone}"`);
      }
    }

    // Coordinates outside Sadiqabad broader municipal region
    if (b.latitude && b.longitude) {
      // Sadiqabad roughly Lat: 28.15 - 28.45, Lng: 70.0 - 70.25
      if (b.latitude < 28.0 || b.latitude > 28.6 || b.longitude < 69.8 || b.longitude > 70.4) {
        reasons.push(`Coordinates (${b.latitude}, ${b.longitude}) appear outside Sadiqabad region`);
      }
    }

    if (reasons.length > 0) {
      suspiciousItems.push({
        id: b.id,
        name: b.name || 'Unnamed',
        reasons,
      });
    }
  }

  // 2. Deterministic Matching
  const borderlinePairs: [Business, Business, number, string][] = [];

  for (let i = 0; i < businesses.length; i++) {
    for (let j = i + 1; j < businesses.length; j++) {
      const b1 = businesses[i];
      const b2 = businesses[j];

      const pairKey = [b1.id, b2.id].sort().join('_');
      if (processedPairKeys.has(pairKey)) continue;

      let confidence = 0;
      const reasons: string[] = [];

      // Google Feature ID Match
      if (b1.google_feature_id && b2.google_feature_id && b1.google_feature_id === b2.google_feature_id) {
        confidence = 0.99;
        reasons.push('Identical Google Feature ID');
      }

      // Place ID Match
      if (b1.place_id && b2.place_id && b1.place_id === b2.place_id) {
        confidence = Math.max(confidence, 0.98);
        reasons.push('Identical Google Place ID');
      }

      // Exact Phone Match
      const p1 = (b1.phone || '').replace(/\D/g, '');
      const p2 = (b2.phone || '').replace(/\D/g, '');
      const phoneMatch = p1 && p2 && p1.length >= 7 && p1 === p2;

      // Coordinate Proximity Match (<= 50 meters)
      let closeDistance = false;
      let distMeters = 99999;
      if (b1.latitude && b1.longitude && b2.latitude && b2.longitude) {
        distMeters = distanceMeters(b1.latitude, b1.longitude, b2.latitude, b2.longitude);
        if (distMeters <= 50) {
          closeDistance = true;
          reasons.push(`Coordinates are within ${Math.round(distMeters)} meters`);
        }
      }

      // Name Similarity
      const sim = stringSimilarity(b1.name, b2.name);

      if (sim >= 0.88) {
        confidence = Math.max(confidence, sim);
        reasons.push(`Names are highly similar (${Math.round(sim * 100)}% match)`);
      } else if (sim >= 0.65 && (phoneMatch || closeDistance)) {
        confidence = Math.max(confidence, 0.85);
        reasons.push(`Similar name (${Math.round(sim * 100)}%) with matching ${phoneMatch ? 'phone' : 'coordinates'}`);
      } else if (phoneMatch && closeDistance) {
        confidence = Math.max(confidence, 0.9);
        reasons.push('Identical phone number and exact same geographic location');
      } else if (sim >= 0.65 && sim < 0.88) {
        borderlinePairs.push([b1, b2, sim, `Borderline name similarity (${Math.round(sim * 100)}%)`]);
      }

      if (confidence >= 0.8) {
        processedPairKeys.add(pairKey);
        duplicateGroups.push({
          id: `dup-${pairKey}`,
          confidence: Math.round(confidence * 100) / 100,
          reason: reasons.join(' • '),
          businesses: [b1, b2],
        });
      }
    }
  }

  // 3. Use AI Gateway to evaluate borderline cases (limited to top 5 pairs)
  if (borderlinePairs.length > 0) {
    try {
      const openai = new OpenAI();
      const pairsToCheck = borderlinePairs.slice(0, 5);

      const prompt = `You are a deduplication judge for local business listings in Sadiqabad, Pakistan.
Judge whether these pairs of businesses are likely the same physical business (due to Urdu/English transliteration, spelling variations, or branch confusion).
Pairs to evaluate:
${pairsToCheck.map((p, idx) => `Pair ${idx + 1}:
Business A: "${p[0].name}", Address: "${p[0].address}", Phone: "${p[0].phone || 'none'}"
Business B: "${p[1].name}", Address: "${p[1].address}", Phone: "${p[1].phone || 'none'}"
`).join('\n')}

Respond in JSON only:
{
  "decisions": [
    { "pairIndex": 1, "isDuplicate": boolean, "confidence": number (0.0 to 1.0), "reason": "brief explanation" }
  ]
}`;

      const aiRes = await openai.chat.completions.create({
        model: AI_MODEL,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 300,
        temperature: 0.1,
      });

      const parsed = JSON.parse(aiRes.choices[0]?.message?.content || '{}');
      if (Array.isArray(parsed.decisions)) {
        for (const dec of parsed.decisions) {
          const idx = (dec.pairIndex || 1) - 1;
          const pair = pairsToCheck[idx];
          if (pair && dec.isDuplicate && dec.confidence >= 0.75) {
            const pairKey = [pair[0].id, pair[1].id].sort().join('_');
            if (!processedPairKeys.has(pairKey)) {
              processedPairKeys.add(pairKey);
              duplicateGroups.push({
                id: `ai-dup-${pairKey}`,
                confidence: dec.confidence,
                reason: `AI Match: ${dec.reason}`,
                businesses: [pair[0], pair[1]],
              });
            }
          }
        }
      }
    } catch (e) {
      // Keep deterministic results
    }
  }

  return jsonResponse({
    duplicateGroups,
    suspiciousItems,
    totalEvaluated: businesses.length,
  });
}
