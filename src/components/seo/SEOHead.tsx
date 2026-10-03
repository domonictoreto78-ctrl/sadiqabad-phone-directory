import { Helmet } from 'react-helmet-async';
import { Business } from '@/src/types';

interface BreadcrumbItem {
  name: string;
  url: string;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonicalPath?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'business.business';
  business?: Business;
  breadcrumbs?: BreadcrumbItem[];
}

export function SEOHead({
  title = 'Sadiqabad City Phone Directory | صادق آباد بزنس ڈائریکٹری',
  description = 'Verified phone directory and local business guide for Sadiqabad city, Pakistan. Find doctors, emergency contacts, shops, and services with 1-tap call and WhatsApp.',
  canonicalPath = '/',
  ogImage = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
  ogType = 'website',
  business,
  breadcrumbs,
}: SEOHeadProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://sadiqabad.city';
  const fullCanonicalUrl = `${origin}${canonicalPath.startsWith('/') ? canonicalPath : `/${canonicalPath}`}`;

  // Structured Data (JSON-LD): LocalBusiness Schema
  let localBusinessSchema: any = null;
  if (business) {
    localBusinessSchema = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: business.name,
      alternateName: business.name_ur || undefined,
      description: business.description || `Verified listing in Sadiqabad, Pakistan`,
      image: business.image_url || ogImage,
      url: fullCanonicalUrl,
      ...(business.phone ? { telephone: business.phone } : {}),
      ...(business.address
        ? {
            address: {
              '@type': 'PostalAddress',
              streetAddress: business.address,
              addressLocality: 'Sadiqabad',
              addressRegion: 'Punjab',
              addressCountry: 'PK',
            },
          }
        : {}),
      geo: {
        '@type': 'GeoCoordinates',
        latitude: business.latitude,
        longitude: business.longitude,
      },
      ...(business.rating
        ? {
            aggregateRating: {
              '@type': 'AggregateRating',
              ratingValue: business.rating,
              reviewCount: Math.max(business.reviews_count || 1, 1),
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
      priceRange: business.price_range || undefined,
    };
  }

  // Structured Data (JSON-LD): BreadcrumbList Schema
  let breadcrumbSchema: any = null;
  if (breadcrumbs && breadcrumbs.length > 0) {
    breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: breadcrumbs.map((crumb, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        name: crumb.name,
        item: crumb.url.startsWith('http') ? crumb.url : `${origin}${crumb.url}`,
      })),
    };
  }

  return (
    <Helmet>
      {/* Basic metadata */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={fullCanonicalUrl} />

      {/* Open Graph */}
      <meta property="og:site_name" content="Sadiqabad City Directory" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={fullCanonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:image" content={ogImage} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* JSON-LD Structured Data */}
      {localBusinessSchema && (
        <script type="application/ld+json">
          {JSON.stringify(localBusinessSchema)}
        </script>
      )}

      {breadcrumbSchema && (
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
      )}
    </Helmet>
  );
}
