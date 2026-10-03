import { useState } from 'react';
import { Business, Category } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import { Rating } from '../ui/Rating';
import { VerifiedBadge, OpenNowBadge } from '../ui/Badge';
import { isOpenNow, formatDistance } from '@/src/lib/utils';
import { generateCallUrl, generateWhatsAppUrl, formatDisplayPhone } from '@/src/lib/phone';
import {
  MapPin,
  Phone,
  MessageCircle,
  Navigation,
  Compass,
  ArrowRight,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { STATIC_CATEGORIES } from '@/src/lib/categories';
import { useGeolocation } from '@/src/hooks/useGeolocation';

interface BusinessMapProps {
  businesses: Business[];
  onSelectBusiness?: (business: Business) => void;
  onNavigate?: (path: string) => void;
}

export function BusinessMap({
  businesses,
  onSelectBusiness,
  onNavigate,
}: BusinessMapProps) {
  const { t, isUrdu } = useLanguage();
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    businesses[0] || null
  );
  const [activeCategory, setActiveCategory] = useState<string>('');
  const { coords, loading: geoLoading, requestLocation } = useGeolocation();

  const filteredBusinesses = activeCategory
    ? businesses.filter((b) => b.category?.slug === activeCategory)
    : businesses;

  const currentBusiness = selectedBusiness || filteredBusinesses[0] || null;

  // Center point: Sadiqabad coordinates
  const centerLat = currentBusiness ? currentBusiness.latitude : 28.3072;
  const centerLng = currentBusiness ? currentBusiness.longitude : 70.1315;

  const mapEmbedUrl = `https://maps.google.com/maps?q=${centerLat},${centerLng}&hl=en&z=15&output=embed`;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-80px)] min-h-[600px] w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
      {/* Side List Panel */}
      <div className="w-full lg:w-96 xl:w-[420px] h-full flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 z-20 shadow-md">
        {/* Panel Header & Category Filter */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Compass className="w-5 h-5 text-teal-600" />
                <span>{t.navMap}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {filteredBusinesses.length} places pinned in Sadiqabad
              </p>
            </div>

            <button
              onClick={requestLocation}
              className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center gap-1.5 hover:bg-teal-100 transition-colors"
              title="Show my current location"
            >
              <Navigation className={`w-4 h-4 ${geoLoading ? 'animate-spin' : ''}`} />
              <span>{t.nearMe}</span>
            </button>
          </div>

          {/* Category Chips Scroll */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveCategory('')}
              className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                !activeCategory
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              All ({businesses.length})
            </button>
            {STATIC_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.slug)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  activeCategory === cat.slug
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                {isUrdu ? cat.name_ur : cat.name_en}
              </button>
            ))}
          </div>
        </div>

        {/* Scrollable Businesses List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-3 space-y-2">
          {filteredBusinesses.map((b) => {
            const isSelected = currentBusiness?.id === b.id;
            const status = isOpenNow(b.opening_hours);

            return (
              <div
                key={b.id}
                onClick={() => {
                  setSelectedBusiness(b);
                  if (onSelectBusiness) onSelectBusiness(b);
                }}
                className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-500/40 shadow-soft-sm'
                    : 'bg-white dark:bg-slate-900 border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start gap-3">
                  <img
                    src={b.image_url}
                    alt={b.name}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 bg-slate-200"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-bold uppercase text-teal-700 dark:text-teal-300 truncate">
                        {isUrdu ? b.category?.name_ur : b.category?.name_en}
                      </span>
                      <Rating rating={b.rating} size="sm" showCount={false} />
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                      {b.name}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                      <span>{b.address}</span>
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                          status.isOpen
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {status.isOpen ? 'Open Now' : 'Closed'}
                      </span>

                      {b.distance_km !== undefined && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {formatDistance(b.distance_km)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Map Viewer Area */}
      <div className="flex-1 relative h-full bg-slate-200 dark:bg-slate-900">
        <iframe
          title="Sadiqabad City Interactive Map"
          width="100%"
          height="100%"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
          src={mapEmbedUrl}
          className="w-full h-full"
        />

        {/* Selected Business Floating Card Overlay (Desktop & Mobile) */}
        {currentBusiness && (
          <div className="absolute bottom-6 left-4 right-4 sm:left-6 sm:w-96 z-30">
            <div className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 shadow-2xl animate-in fade-in slide-in-from-bottom-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  {currentBusiness.is_verified && <VerifiedBadge />}
                  <OpenNowBadge
                    isOpen={isOpenNow(currentBusiness.opening_hours).isOpen}
                  />
                </div>
                <Rating
                  rating={currentBusiness.rating}
                  reviewsCount={currentBusiness.reviews_count}
                  size="sm"
                />
              </div>

              <h3 className="font-extrabold text-base text-slate-900 dark:text-white line-clamp-1">
                {currentBusiness.name}
              </h3>
              {currentBusiness.name_ur && (
                <p className="text-xs font-urdu text-slate-500 line-clamp-1">
                  {currentBusiness.name_ur}
                </p>
              )}
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1">
                {currentBusiness.address}
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-3 gap-2 mt-4">
                <a
                  href={generateCallUrl(currentBusiness.phone || '')}
                  className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-xs hover:bg-teal-100 transition-colors border border-teal-200/40"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call</span>
                </a>

                <a
                  href={generateWhatsAppUrl(
                    currentBusiness.whatsapp || currentBusiness.phone || '',
                    currentBusiness.name
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    if (onNavigate) {
                      onNavigate(`/business/${currentBusiness.id}`);
                    }
                  }}
                  className="flex items-center justify-center gap-1 py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs transition-colors"
                >
                  <span>Details</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
