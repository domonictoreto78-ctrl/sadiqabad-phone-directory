import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://placeholder.supabase.co';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

export const serverSupabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { persistSession: false },
});

export interface AdminAuthResult {
  isAdmin: boolean;
  role: 'super_admin' | 'editor';
  user: {
    id: string;
    email?: string;
  };
}

/**
 * Validates Supabase JWT from Authorization header and verifies user is in admin_users
 */
export async function verifyAdminToken(req: Request): Promise<AdminAuthResult | null> {
  const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) return null;

  try {
    const { data: { user }, error: userError } = await serverSupabase.auth.getUser(token);
    if (userError || !user) {
      return null;
    }

    const { data: adminRecord, error: adminError } = await serverSupabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (adminError || !adminRecord) {
      return null;
    }

    return {
      isAdmin: true,
      role: adminRecord.role as 'super_admin' | 'editor',
      user: {
        id: user.id,
        email: user.email,
      },
    };
  } catch (err) {
    console.error('Admin token verification error:', err);
    return null;
  }
}

/**
 * Retrieves valid category slugs and area slugs for validation
 */
export async function getValidTaxonomy(): Promise<{
  categorySlugs: string[];
  areaSlugs: string[];
}> {
  const fallbackCategories = [
    'doctors',
    'hospitals',
    'pharmacies',
    'schools',
    'restaurants',
    'mobiles',
    'electricians',
    'plumbers',
    'banks',
    'mechanics',
    'lawyers',
    'real-estate',
  ];

  const fallbackAreas = [
    'rail-bazaar',
    'hospital-road',
    'club-road',
    'model-town',
    'allama-iqbal-road',
    'klp-bypass',
    'chowk-bahadurpur',
    'millat-colony',
  ];

  try {
    const [catRes, areaRes] = await Promise.all([
      serverSupabase.from('categories').select('slug'),
      serverSupabase.from('areas').select('slug'),
    ]);

    const categorySlugs = catRes.data?.length
      ? catRes.data.map((c) => c.slug)
      : fallbackCategories;

    const areaSlugs = areaRes.data?.length
      ? areaRes.data.map((a) => a.slug)
      : fallbackAreas;

    return { categorySlugs, areaSlugs };
  } catch {
    return {
      categorySlugs: fallbackCategories,
      areaSlugs: fallbackAreas,
    };
  }
}
