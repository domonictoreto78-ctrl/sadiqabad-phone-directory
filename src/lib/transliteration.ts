/**
 * Roman Urdu, Urdu & English Synonym Dictionary & Transliteration Search Parser
 * Provides fallback intelligence when AI Gateway is not reachable or in offline mode.
 */

import { ParsedSearchFilters } from '@/src/types';

export const GOOGLE_CATEGORY_DEFAULTS: Record<string, string> = {
  // Food & Dining -> 'restaurants' (Restaurants & Cafes)
  'restaurant': 'restaurants',
  'family restaurant': 'restaurants',
  'fast food': 'restaurants',
  'fast food restaurant': 'restaurants',
  'pizza': 'restaurants',
  'pizza restaurant': 'restaurants',
  'cafe': 'restaurants',
  'coffee shop': 'restaurants',
  'barbecue': 'restaurants',
  'barbecue restaurant': 'restaurants',
  'bbq': 'restaurants',
  'bakery': 'restaurants',
  'food market': 'restaurants',
  'tea house': 'restaurants',
  'ice cream shop': 'restaurants',
  'sweet shop': 'restaurants',
  'dhaba': 'restaurants',

  // Medical & Health
  'hospital': 'hospitals',
  'general hospital': 'hospitals',
  'clinic': 'doctors',
  'medical clinic': 'doctors',
  'doctor': 'doctors',
  'specialist': 'doctors',
  'dental clinic': 'doctors',
  'dentist': 'doctors',
  'eye care center': 'doctors',
  'pediatrician': 'doctors',
  'pharmacy': 'pharmacies',
  'chemist': 'pharmacies',
  'drug store': 'pharmacies',
  'medical store': 'pharmacies',

  // Services
  'electrician': 'electricians',
  'electrical supply store': 'electricians',
  'electronics repair shop': 'electricians',
  'plumber': 'plumbers',
  'plumbing supply store': 'plumbers',
  'sanitary store': 'plumbers',

  // Education
  'school': 'schools',
  'high school': 'schools',
  'college': 'schools',
  'academy': 'schools',
  'educational institution': 'schools',
  'coaching center': 'schools',

  // Tech & Shopping
  'mobile phone shop': 'mobiles',
  'cell phone store': 'mobiles',
  'electronics store': 'mobiles',
  'computer store': 'mobiles',

  // Financial & Legal
  'bank': 'banks',
  'atm': 'banks',
  'lawyer': 'lawyers',
  'law firm': 'lawyers',
  'advocate': 'lawyers',

  // Automotive
  'auto repair shop': 'mechanics',
  'car repair': 'mechanics',
  'motorcycle repair shop': 'mechanics',
  'auto parts store': 'mechanics',

  // Real estate
  'real estate agency': 'real-estate',
  'property dealer': 'real-estate',
};

// Common Sadiqabad Areas keywords & aliases
export const SADIQABAD_AREA_ALIASES: Record<string, string> = {
  'hospital road': 'hospital-road',
  'hospital': 'hospital-road',
  'thq': 'hospital-road',
  'rail bazaar': 'rail-bazaar',
  'rail bazar': 'rail-bazaar',
  'ghanta ghar': 'rail-bazaar',
  'clock tower': 'rail-bazaar',
  'bazaar': 'rail-bazaar',
  'club road': 'club-road',
  'club': 'club-road',
  'officers club': 'club-road',
  'model town': 'model-town',
  'model': 'model-town',
  'allama iqbal road': 'allama-iqbal-road',
  'iqbal road': 'allama-iqbal-road',
  'allama iqbal': 'allama-iqbal-road',
  'bypass': 'klp-bypass',
  'klp': 'klp-bypass',
  'highway': 'klp-bypass',
  'national highway': 'klp-bypass',
  'chowk': 'chowk-bahadurpur',
  'bahadurpur': 'chowk-bahadurpur',
  'millat colony': 'millat-colony',
  'millat': 'millat-colony',
};

// Category Synonyms in English, Urdu, and Roman Urdu
export const CATEGORY_SYNONYMS: Record<string, string[]> = {
  'doctors': [
    'doctor', 'dr', 'dactar', 'dactor', 'docter', 'specialist', 'physician',
    'surgeon', 'dentist', 'dandan', 'elaj', 'tibbi', 'tabeeb', 'hakeem',
    'child specialist', 'gynecologist', 'cardiologist', 'skin', 'eyes',
    'ڈاکٹر', 'معالج', 'طبیب', 'ڈینٹسٹ'
  ],
  'hospitals': [
    'hospital', 'haspatal', 'hspital', 'shifakhana', 'clinic', 'emergency',
    'thq', 'icu', 'trauma', 'ward', 'complex',
    'ہسپتال', 'شفا خانہ', 'کلینک'
  ],
  'pharmacies': [
    'pharmacy', 'medical store', 'medical', 'store', 'chemist', 'dawa',
    'dawakhana', 'medicine', 'goli', 'panadol', 'injection', 'syrup', 'bandage',
    'میڈیکل سٹور', 'فارمیسی', 'دواخانہ', 'ادویات'
  ],
  'restaurants': [
    'restaurant', 'resturant', 'hotel', 'cafe', 'coffee', 'chai', 'tea',
    'khana', 'food', 'pizza', 'burger', 'fast food', 'biryani', 'karahi',
    'barbecue', 'bbq', 'sajji', 'roti', 'naan', 'tikka', 'boti', 'kabab',
    'bakery', 'sweets', 'mithai', 'halwa', 'samosa', 'roll',
    'ریسٹورنٹ', 'ہوٹل', 'کھانا', 'پیزا', 'برگر', 'بریانی', 'باربی کیو', 'بیکری'
  ],
  'electricians': [
    'electrician', 'bijli', 'bijli wala', 'light', 'fan', 'mistri', 'wiring',
    'ups', 'solar', 'ac repair', 'ac', 'inverter', 'motor', 'switch',
    'الیکٹریشن', 'بجلی', 'بجلی والا', 'سولر'
  ],
  'plumbers': [
    'plumber', 'nal', 'nal wala', 'pipe', 'leakage', 'sanitary', 'water motor',
    'tanki', 'fitting', 'tap', 'washroom fitting',
    'پلمبر', 'نلکا', 'پائپ'
  ],
  'schools': [
    'school', 'college', 'academy', 'education', 'taleem', 'tuition', 'class',
    'matric', 'fsc', 'university', 'kindergarten',
    'سکول', 'کالج', 'اکیڈمی', 'تعلیم'
  ],
  'mobiles': [
    'mobile', 'cell', 'phone', 'smartphone', 'repair', 'sim', 'cover',
    'screen', 'charger', 'android', 'iphone',
    'موبائل', 'فون', 'سم'
  ],
  'banks': [
    'bank', 'atm', 'paisa', 'account', 'cash', 'money', 'branch',
    'بینک', 'اے ٹی ایم'
  ],
  'lawyers': [
    'lawyer', 'advocate', 'wakeel', 'court', 'kachari', 'qanoon', 'legal',
    'وکالت', 'وکیل', 'عدالت'
  ],
  'mechanics': [
    'mechanic', 'auto', 'car', 'motorcycle', 'bike', 'workshop', 'puncture',
    'oil change', 'tuning', 'brakes',
    'میکینک', 'ورکشاپ', 'گاڑی'
  ],
  'real-estate': [
    'property', 'plot', 'makan', 'house', 'rent', 'kiraya', 'real estate',
    'zameen', 'colony', 'dealer',
    'پراپرٹی', 'پلاٹ', 'مکان', 'کرایہ'
  ],
};

/**
 * Fallback parser that converts Roman Urdu/Urdu/English query into structured filters
 */
export function parseQueryWithSynonyms(query: string): ParsedSearchFilters {
  const clean = (query || '').toLowerCase().trim();
  const filters: ParsedSearchFilters = {
    keywords: [],
  };

  if (!clean) return filters;

  // 1. Check for Timing / Open Now intent
  const openNowWords = ['khula', 'open', 'raat', '24 ghante', '24/7', 'open now', 'is waqt', 'abhi', 'رات', 'کھلا'];
  if (openNowWords.some((w) => clean.includes(w))) {
    filters.open_now = true;
  }

  // 2. Check for Rating / Quality intent
  const topRatedWords = ['best', 'top', 'behtareen', 'acha', 'famous', 'mashhoor', 'مقصود', 'بہترین'];
  if (topRatedWords.some((w) => clean.includes(w))) {
    filters.min_rating = 4.5;
    filters.sort = 'rating';
  }

  // 3. Check for Proximity intent
  const nearWords = ['near', 'qareeb', 'paas', 'nazdeek', 'قریب', 'پاس'];
  if (nearWords.some((w) => clean.includes(w))) {
    filters.sort = 'nearest';
  }

  // 4. Match Area
  for (const [alias, areaSlug] of Object.entries(SADIQABAD_AREA_ALIASES)) {
    if (clean.includes(alias)) {
      filters.area_slug = areaSlug;
      break;
    }
  }

  // 5. Match Category
  for (const [categorySlug, synonyms] of Object.entries(CATEGORY_SYNONYMS)) {
    if (synonyms.some((syn) => clean.includes(syn))) {
      filters.category_slug = categorySlug;
      break;
    }
  }

  // 6. Keywords
  const tokens = clean.split(/\s+/).filter((t) => t.length > 2);
  filters.keywords = tokens.filter((t) => !['the', 'and', 'near', 'wali', 'wala', 'mein', 'par'].includes(t));

  return filters;
}
