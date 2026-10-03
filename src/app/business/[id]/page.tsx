'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/src/components/ui/Container';
import { BusinessHeader } from '@/src/components/business/BusinessHeader';
import { ContactButtons } from '@/src/components/business/ContactButtons';
import { TimingsTable } from '@/src/components/business/TimingsTable';
import { MapEmbed } from '@/src/components/map/MapEmbed';
import { BusinessGrid } from '@/src/components/business/BusinessGrid';
import { getBusinessById, getBusinesses, incrementBusinessViews } from '@/src/lib/supabase';
import { Business } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import {
  Info,
  Clock,
  MapPin,
  Image as ImageIcon,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';

interface BusinessDetailPageProps {
  params: Promise<{ id: string }> | { id: string };
}

export default function BusinessDetailPage({ params }: BusinessDetailPageProps) {
  const { t, isUrdu } = useLanguage();
  const [businessId, setBusinessId] = useState<string>('');
  const [business, setBusiness] = useState<Business | null>(null);
  const [related, setRelated] = useState<Business[]>([]);
  const [activeTab, setActiveTab] = useState<'about' | 'timings' | 'location' | 'photos'>('about');
  const [isLoading, setIsLoading] = useState(true);

  // Unwrap params
  useEffect(() => {
    Promise.resolve(params).then((resolved) => {
      setBusinessId(resolved.id);
    });
  }, [params]);

  // Load business & related
  useEffect(() => {
    if (!businessId) return;

    async function load() {
      setIsLoading(true);
      try {
        const data = await getBusinessById(businessId);
        if (data) {
          setBusiness(data);
          // Increment view safely
          incrementBusinessViews(businessId);

          // Fetch related in same category
          const allInCategory = await getBusinesses({
            categorySlug: data.category?.slug,
          });
          setRelated(allInCategory.filter((b) => b.id !== businessId).slice(0, 3));
        }
      } catch (err) {
        console.error('Error loading business:', err);
      } finally {
        setIsLoading(false);
      }
    }

    load();
  }, [businessId]);

  if (isLoading) {
    return (
      <div className="py-20 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full mx-auto mb-4" />
        <p className="text-slate-500 text-sm">{t.loading}</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
          Business Not Found
        </h2>
        <p className="text-sm text-slate-500 mt-2 mb-6">
          The requested business profile does not exist or has been removed.
        </p>
        <a
          href="/search"
          className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-sm"
        >
          Explore All Businesses
        </a>
      </div>
    );
  }

  // Schema.org LocalBusiness JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: business.name,
    image: business.image_url,
    telephone: business.phone,
    email: business.email || undefined,
    url: business.website || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: business.address,
      addressLocality: 'Sadiqabad',
      addressRegion: 'Punjab',
      addressCountry: 'PK',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: business.latitude,
      longitude: business.longitude,
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: business.rating,
      reviewCount: business.reviews_count || 1,
    },
  };

  return (
    <div className="py-8 sm:py-12 bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 md:pb-12">
      {/* Schema.org Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Container size="xl">
        {/* Back Link */}
        <div className="mb-6">
          <a
            href="/search"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Search Directory</span>
          </a>
        </div>

        {/* 1. Hero Header */}
        <BusinessHeader business={business} />

        {/* 2. Main Action Buttons Strip */}
        <div className="my-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
          <ContactButtons business={business} />
        </div>

        {/* 3. Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto no-scrollbar">
          {[
            { id: 'about', label: t.about, icon: Info },
            { id: 'timings', label: t.timings, icon: Clock },
            { id: 'location', label: t.location, icon: MapPin },
            { id: 'photos', label: `${t.photos} (${business.gallery?.length || 1})`, icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 whitespace-nowrap transition-all ${
                  isActive
                    ? 'border-teal-500 text-teal-700 dark:text-teal-300'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. Tab Content Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Main Left Content (2 cols) */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'about' && (
              <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft-sm space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                    {t.about}
                  </h3>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {business.description}
                  </p>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                    Verification & Features
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Verified Sadiqabad Business</span>
                    </div>
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                      <CheckCircle2 className="w-4 h-4 text-teal-500" />
                      <span>Direct Phone Line & WhatsApp</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'timings' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t.timings}
                </h3>
                <TimingsTable openingHours={business.opening_hours} />
              </div>
            )}

            {activeTab === 'location' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t.location}
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {business.address}
                </p>
                <MapEmbed
                  latitude={business.latitude}
                  longitude={business.longitude}
                  title={business.name}
                  height="400px"
                />
              </div>
            )}

            {activeTab === 'photos' && (
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                  {t.photos}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="h-60 rounded-2xl overflow-hidden bg-slate-200">
                    <img
                      src={business.image_url}
                      alt="Cover"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {business.gallery?.map((img, i) => (
                    <div
                      key={i}
                      className="h-60 rounded-2xl overflow-hidden bg-slate-200"
                    >
                      <img
                        src={img}
                        alt={`Gallery ${i}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar Quick Location & Timings Widget */}
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft-sm space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-600" />
                <span>Quick Hours</span>
              </h4>
              <TimingsTable openingHours={business.opening_hours} />
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft-sm space-y-4">
              <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>Map Overview</span>
              </h4>
              <MapEmbed
                latitude={business.latitude}
                longitude={business.longitude}
                title={business.name}
                height="220px"
              />
            </div>
          </div>
        </div>

        {/* 5. Related Businesses Section */}
        {related.length > 0 && (
          <div className="pt-12 border-t border-slate-200 dark:border-slate-800">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">
              {t.relatedBusinesses}
            </h3>
            <BusinessGrid businesses={related} />
          </div>
        )}

        {/* Sticky Action Bar for Mobile */}
        <ContactButtons business={business} isStickyMobile={true} />
      </Container>
    </div>
  );
}
