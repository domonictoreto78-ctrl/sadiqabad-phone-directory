import { serverSupabase } from './_shared/supabase';

export const config = {
  path: '/sitemap.xml',
};

export default async function handler(req: Request) {
  const host =
    req.headers.get('x-forwarded-host') ||
    req.headers.get('host') ||
    'sadiqabad.city';
  const proto = req.headers.get('x-forwarded-proto') || 'https';
  const baseUrl = `${proto}://${host}`;

  const today = new Date().toISOString().slice(0, 10);

  // Static URLs
  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    { loc: `${baseUrl}/`, lastmod: today, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/categories`, lastmod: today, changefreq: 'weekly', priority: '0.8' },
    { loc: `${baseUrl}/emergency`, lastmod: today, changefreq: 'weekly', priority: '0.9' },
    { loc: `${baseUrl}/submit`, lastmod: today, changefreq: 'monthly', priority: '0.7' },
    { loc: `${baseUrl}/about`, lastmod: today, changefreq: 'monthly', priority: '0.5' },
    { loc: `${baseUrl}/contact`, lastmod: today, changefreq: 'monthly', priority: '0.5' },
    { loc: `${baseUrl}/privacy`, lastmod: today, changefreq: 'yearly', priority: '0.3' },
    { loc: `${baseUrl}/terms`, lastmod: today, changefreq: 'yearly', priority: '0.3' },
  ];

  try {
    const [bizRes, catRes] = await Promise.all([
      serverSupabase
        .from('businesses')
        .select('id, slug, updated_at')
        .eq('is_active', true),
      serverSupabase.from('categories').select('slug'),
    ]);

    if (catRes.data) {
      for (const cat of catRes.data) {
        urls.push({
          loc: `${baseUrl}/categories/${cat.slug}`,
          lastmod: today,
          changefreq: 'weekly',
          priority: '0.8',
        });
      }
    }

    if (bizRes.data) {
      for (const biz of bizRes.data) {
        const path = biz.slug ? `/business/${biz.slug}` : `/business/${biz.id}`;
        urls.push({
          loc: `${baseUrl}${path}`,
          lastmod: biz.updated_at ? biz.updated_at.slice(0, 10) : today,
          changefreq: 'weekly',
          priority: '0.7',
        });
      }
    }
  } catch (err) {
    console.error('Error generating dynamic sitemap from database:', err);
  }

  const xmlEntries = urls
    .map(
      (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`
    )
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=86400',
    },
  });
}
