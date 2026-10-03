export interface Category {
  id: number;
  name_en: string;
  name_ur: string;
  slug: string;
  icon: string;
  color: string;
  parent_id?: number | null;
  sort_order: number;
  businesses_count?: number;
}

export interface Area {
  id: number;
  name_en: string;
  name_ur: string;
  slug: string;
  businesses_count?: number;
}

export interface DaySchedule {
  open: string;
  close: string;
  is_closed: boolean;
}

export type WeekDays = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export type OpeningHours = Record<WeekDays | string, DaySchedule>;

export interface Business {
  id: string;
  name: string;
  name_ur?: string | null;
  category_id: number;
  category?: Category;
  area_id: number;
  area?: Area;
  description: string;
  address: string;
  phone?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  email?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  latitude: number;
  longitude: number;
  google_maps_url?: string | null;
  place_id?: string | null;
  rating: number;
  reviews_count: number;
  opening_hours: OpeningHours;
  image_url: string;
  gallery: string[];
  is_verified: boolean;
  is_featured: boolean;
  is_active: boolean;
  views_count: number;
  slug?: string;
  site_rating?: number;
  site_reviews_count?: number;
  created_at?: string;
  updated_at?: string;
  distance_km?: number;

  // Part 3 additions for Google Maps / Real Excel Importer & AI
  price_range?: string | null;
  timing_text?: string | null;
  google_category?: string | null;
  plus_code?: string | null;
  google_feature_id?: string | null;
}

export type SortOption = 'relevance' | 'rating' | 'views' | 'name' | 'nearest';

export interface FilterOptions {
  query?: string;
  categorySlug?: string;
  areaSlug?: string;
  openNow?: boolean;
  verifiedOnly?: boolean;
  minRating?: number;
  sort?: SortOption;
  userLat?: number;
  userLng?: number;
}

export interface EmergencyContact {
  id: string;
  name_en: string;
  name_ur: string;
  phone: string;
  category: string;
  sort_order: number;
  is_active: boolean;
  number?: string;
  description_en?: string;
  description_ur?: string;
  icon?: string;
  color?: string;
  badge?: string;
  created_at?: string;
}

export interface DirectoryStats {
  totalBusinesses: number;
  totalCategories: number;
  totalAreas: number;
  verifiedCount: number;
}

export type AdminRole = 'super_admin' | 'editor';

export interface AdminUser {
  user_id: string;
  email?: string;
  role: AdminRole;
  created_at: string;
}

export interface AdminLog {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity: string;
  entity_id?: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface ImportBatch {
  id: string;
  user_id?: string;
  user_email?: string;
  file_name: string;
  total_rows: number;
  inserted: number;
  updated: number;
  skipped: number;
  status: string;
  details?: Record<string, any>;
  created_at: string;
}

export interface ImportColumnMapping {
  name: string;
  name_ur?: string;
  category: string;
  area?: string;
  address: string;
  phone?: string;
  whatsapp?: string;
  website?: string;
  email?: string;
  facebook?: string;
  instagram?: string;
  latitude?: string;
  longitude?: string;
  google_maps_url?: string;
  place_id?: string;
  rating?: string;
  reviews_count?: string;
  opening_hours?: string;
  image_url?: string;
  description?: string;
  price_range?: string;
  google_category?: string;
  timing_text?: string;
  plus_code?: string;
}

export type ImportRowStatus = 'new' | 'duplicate' | 'invalid' | 'missing_phone';

export interface ImportPreparedItem {
  index: number;
  raw: Record<string, any>;
  business: Partial<Business>;
  status: ImportRowStatus;
  statusReason?: string;
  matchedCategory?: Category;
  matchedArea?: Area;
  duplicateOf?: Business;
}

// Part 3 AI & Search Interfaces
export interface SearchLog {
  id: string;
  query: string;
  parsed_filters: Record<string, any>;
  results_count: number;
  language: string;
  created_at: string;
}

export interface ChatLog {
  id: string;
  user_message: string;
  answer: string;
  business_ids: string[];
  created_at: string;
}

export interface ParsedSearchFilters {
  category_slug?: string | null;
  area_slug?: string | null;
  keywords?: string[];
  open_now?: boolean;
  min_rating?: number;
  sort?: SortOption;
}

export interface AISearchResponse {
  filters: ParsedSearchFilters;
  results: Business[];
  isAiPowered?: boolean;
  message?: string;
}

export interface AIChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  business_ids?: string[];
  timestamp: number;
}

export interface DuplicateGroup {
  id: string;
  confidence: number;
  reason: string;
  businesses: Business[];
}

// ----------------------------------------------------------------------------
// PART 4: COMMUNITY, REVIEWS, SUBMISSIONS, EMERGENCY & ANALYTICS
// ----------------------------------------------------------------------------
export type ReviewStatus = 'pending' | 'approved' | 'rejected';

export interface Review {
  id: string;
  business_id: string;
  author_name: string;
  rating: number; // 1 to 5
  comment?: string | null;
  status: ReviewStatus;
  created_at: string;
  business?: Business;
}

export type SubmissionType = 'new_business' | 'claim_business' | 'correction' | 'phone_suggestion';
export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface Submission {
  id: string;
  type: SubmissionType;
  business_id?: string | null;
  payload: Record<string, any>;
  contact_name?: string | null;
  contact_phone?: string | null;
  status: SubmissionStatus;
  admin_note?: string | null;
  created_at: string;
  business?: Business;
}

export type BusinessEventType = 'view' | 'call' | 'whatsapp' | 'directions' | 'share' | 'favorite';

export interface BusinessEvent {
  id?: string;
  business_id: string;
  event_type: BusinessEventType;
  session_id?: string;
  created_at?: string;
}

export interface AnalyticsSummary {
  periodDays: number;
  totalViews: number;
  totalCalls: number;
  totalWhatsApp: number;
  totalDirections: number;
  dailyViews: { date: string; views: number; calls: number }[];
  topBusinessesByViews: { id: string; name: string; views: number; phone?: string | null }[];
  topBusinessesByCalls: { id: string; name: string; calls: number }[];
  topCategories: { name: string; count: number }[];
  missingPhoneHighViews: { id: string; name: string; views: number; address: string }[];
}
