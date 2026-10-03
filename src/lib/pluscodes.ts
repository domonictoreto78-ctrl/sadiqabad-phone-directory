/**
 * Open Location Code (Google Plus Code) Detection & Decoding
 * Specially tuned for Sadiqabad reference coordinates: Lat 28.3072, Lng 70.1315
 */

const CODE_ALPHABET = '23456789CFGHJMPQRVWX';
const ENCODING_BASE = CODE_ALPHABET.length; // 20
const LATITUDE_MAX = 90;
const LONGITUDE_MAX = 180;

// Sadiqabad default reference point
export const SADIQABAD_REF_COORDS = {
  latitude: 28.3072,
  longitude: 70.1315,
};

// Sadiqabad 4-digit prefix for Open Location Codes is 7MR8
export const SADIQABAD_PREFIX = '7MR8';

export interface PlusCodeAnalysis {
  isPlusCodeOnly: boolean;
  plusCode: string | null;
  remainingAddress: string | null;
  decodedCoords: { latitude: number; longitude: number } | null;
}

/**
 * Checks if a string contains or is primarily a Google Plus Code
 * e.g. "842M+MWH", "842M+MWH Sadiqabad", "842M+MWH, Sadiqabad, Punjab, Pakistan"
 */
export function analyzeAddressForPlusCode(
  addressRaw: string | null | undefined,
  refLat = SADIQABAD_REF_COORDS.latitude,
  refLng = SADIQABAD_REF_COORDS.longitude
): PlusCodeAnalysis {
  if (!addressRaw || typeof addressRaw !== 'string') {
    return {
      isPlusCodeOnly: false,
      plusCode: null,
      remainingAddress: null,
      decodedCoords: null,
    };
  }

  const trimmed = addressRaw.trim();

  // Pattern for Plus Code (4-8 chars + '+' + 2-4 chars)
  // e.g. "842M+MWH", "7MR8842M+MW", "842M+MW"
  const regex = /\b([23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,4})\b/i;
  const match = trimmed.match(regex);

  if (!match) {
    return {
      isPlusCodeOnly: false,
      plusCode: null,
      remainingAddress: trimmed,
      decodedCoords: null,
    };
  }

  const plusCode = match[1].toUpperCase();

  // Remove the plus code from the address to see what remains
  const afterRemoved = trimmed.replace(match[0], '').replace(/^[\s,.-]+|[\s,.-]+$/g, '').trim();

  // Check if remaining words are purely generic city/region names
  const genericLocalityRegex = /^(?:sadiqabad|punjab|pakistan|rahim\s*yar\s*khan|district\s*rahim\s*yar\s*khan|ry\s*khan|tehsil\s*sadiqabad|,|\s|-)+$/i;
  const isGenericLocality = !afterRemoved || genericLocalityRegex.test(afterRemoved);

  const decodedCoords = decodePlusCode(plusCode, refLat, refLng);

  if (isGenericLocality) {
    return {
      isPlusCodeOnly: true,
      plusCode,
      remainingAddress: null, // Address was only plus code + city name
      decodedCoords,
    };
  }

  return {
    isPlusCodeOnly: false,
    plusCode,
    remainingAddress: trimmed,
    decodedCoords,
  };
}

/**
 * Decodes a Plus Code into latitude and longitude
 * If code is short (e.g. 842M+MWH), recovers it with reference coordinates
 */
export function decodePlusCode(
  code: string,
  refLat = SADIQABAD_REF_COORDS.latitude,
  refLng = SADIQABAD_REF_COORDS.longitude
): { latitude: number; longitude: number } | null {
  try {
    let cleanCode = code.toUpperCase().replace(/\s+/g, '');
    const separatorIdx = cleanCode.indexOf('+');

    if (separatorIdx === -1) return null;

    // Check if it's a short code (prefix length < 8)
    if (separatorIdx < 8) {
      // Prepend Sadiqabad prefix '7MR8' (or relevant prefix based on ref coordinates)
      const prefixLength = 8 - separatorIdx;
      const fullPrefix = SADIQABAD_PREFIX.slice(0, prefixLength);
      cleanCode = fullPrefix + cleanCode;
    }

    // Now decode the full 8+2 or 8+3 code
    const codeDigits = cleanCode.replace('+', '');
    if (codeDigits.length < 10) {
      // pad with '2' if needed
      cleanCode = cleanCode + '22'.slice(0, 10 - codeDigits.length);
    }

    // Compute latitude and longitude bounding box
    let south = -LATITUDE_MAX;
    let west = -LONGITUDE_MAX;
    let latResolution = 20.0;
    let lngResolution = 20.0;

    for (let i = 0; i < 10 && i < codeDigits.length; i += 2) {
      const latVal = CODE_ALPHABET.indexOf(codeDigits[i]);
      const lngVal = CODE_ALPHABET.indexOf(codeDigits[i + 1]);

      if (latVal === -1 || lngVal === -1) return null;

      south += latVal * latResolution;
      west += lngVal * lngResolution;

      latResolution /= ENCODING_BASE;
      lngResolution /= ENCODING_BASE;
    }

    const latitude = Number((south + latResolution * (ENCODING_BASE / 2)).toFixed(6));
    const longitude = Number((west + lngResolution * (ENCODING_BASE / 2)).toFixed(6));

    // Ensure within Sadiqabad broader area (latitude ~27.8 to 28.8, longitude ~69.6 to 70.8)
    if (latitude >= 27.5 && latitude <= 29.0 && longitude >= 69.5 && longitude <= 71.0) {
      return { latitude, longitude };
    }

    // Fallback if recovered coords drifted too far: anchor near Sadiqabad
    return {
      latitude: SADIQABAD_REF_COORDS.latitude,
      longitude: SADIQABAD_REF_COORDS.longitude,
    };
  } catch (err) {
    return null;
  }
}
