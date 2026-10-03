/**
 * Google Maps URL Parsing & Normalization Helpers
 * Extracts latitude, longitude, and unique Google Feature ID (!1s0x...:0x...)
 */

export interface ParsedGoogleMapsUrl {
  latitude: number | null;
  longitude: number | null;
  featureId: string | null;
  normalizedUrl: string | null;
}

/**
 * Extracts coordinates and feature ID from Google Maps URLs
 * Supports both:
 * - @lat,lng (e.g., https://www.google.com/maps/place/.../@28.307248,70.131522,17z/...)
 * - !3dLAT!4dLNG (e.g., ...!3d28.307248!4d70.131522!...)
 * - Feature ID in !1s0x...:0x...
 */
export function parseGoogleMapsUrl(url: string | null | undefined): ParsedGoogleMapsUrl {
  if (!url || typeof url !== 'string') {
    return { latitude: null, longitude: null, featureId: null, normalizedUrl: null };
  }

  const cleanUrl = url.trim();
  let latitude: number | null = null;
  let longitude: number | null = null;
  let featureId: string | null = null;

  // 1. Extract Feature ID (!1s0x...:0x...)
  // Example: !1s0x39375bd4a535805f:0x39a0375971ea0e1b
  const featureIdMatch = cleanUrl.match(/!1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
  if (featureIdMatch) {
    featureId = featureIdMatch[1];
  }

  // 2. Extract Coordinates Pattern A: !3dLAT!4dLNG
  const latLngExMatch = cleanUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  if (latLngExMatch) {
    const parsedLat = parseFloat(latLngExMatch[1]);
    const parsedLng = parseFloat(latLngExMatch[2]);
    if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
      latitude = parsedLat;
      longitude = parsedLng;
    }
  }

  // 3. Extract Coordinates Pattern B: @lat,lng
  if (latitude === null || longitude === null) {
    const atMatch = cleanUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      const parsedLat = parseFloat(atMatch[1]);
      const parsedLng = parseFloat(atMatch[2]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        latitude = parsedLat;
        longitude = parsedLng;
      }
    }
  }

  // 4. Extract Coordinates Pattern C: ?q=lat,lng or ?ll=lat,lng
  if (latitude === null || longitude === null) {
    const qMatch = cleanUrl.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) {
      const parsedLat = parseFloat(qMatch[1]);
      const parsedLng = parseFloat(qMatch[2]);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        latitude = parsedLat;
        longitude = parsedLng;
      }
    }
  }

  // 5. Normalized canonical URL
  let normalizedUrl = cleanUrl.split('?')[0].replace(/\/+$/, '');
  if (cleanUrl.includes('google.com/maps')) {
    normalizedUrl = cleanUrl;
  }

  return {
    latitude,
    longitude,
    featureId,
    normalizedUrl,
  };
}
