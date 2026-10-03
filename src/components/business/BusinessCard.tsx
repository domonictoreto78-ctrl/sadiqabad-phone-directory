import React from 'react';
import { Business } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import { VerifiedBadge, OpenNowBadge } from '../ui/Badge';
import { Rating } from '../ui/Rating';
import { isOpenNow, formatDistance } from '@/src/lib/utils';
import { generateCallUrl, generateWhatsAppUrl, formatDisplayPhone } from '@/src/lib/phone';
import { useFavorites } from '@/src/hooks/useFavorites';
import { Phone, MessageCircle, Heart, MapPin, Eye, Clock, Navigation } from 'lucide-react';

interface BusinessCardProps {
  business: Business;
  onSelect?: (business: Business) => void;
  onNavigate?: (path: string) => void;
}

export function BusinessCard({
  business,
  onSelect,
  onNavigate,
}: BusinessCardProps) {
  const { t, isUrdu } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(business.id);

  const hasPhone = Boolean(business.phone && business.phone.trim().length >= 5);
  const hasOpeningHours = business.opening_hours && Object.keys(business.opening_hours).length > 0;
  const status = hasOpeningHours ? isOpenNow(business.opening_hours) : null;

  const directionsUrl =
    business.google_maps_url ||
    `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;

  const handleCardClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button')) {
      return;
    }

    if (onSelect) {
      onSelect(business);
    } else if (onNavigate) {
      onNavigate(`/business/${business.id}`);
    }
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(business.id);
  };

  return (
    <div
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm hover:shadow-soft-xl hover:-translate-y-1 transition-all duration-300 overflow-hidden cursor-pointer"
    >
      <div>
        {/* Card Image Cover & Floating Overlays */}
        <div className="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
          <img
            src={business.image_url}
            alt={business.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/20 to-transparent" />

          {/* Top Floating Badges */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-1.5 flex-wrap">
              {business.is_verified && <VerifiedBadge />}

              {/* If opening_hours is null but timing_text exists, show timing_text */}
              {!hasOpeningHours && business.timing_text ? (
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-900/80 text-amber-300 backdrop-blur-md border border-white/10 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span className="max-w-[140px] truncate">{business.timing_text}</span>
                </span>
              ) : status ? (
                <OpenNowBadge isOpen={status.isOpen} statusText={isUrdu ? status.statusTextUr : status.statusTextEn} />
              ) : null}
            </div>

            {/* Favorite Button */}
            <button
              onClick={handleFavoriteClick}
              type="button"
              aria-label="Save to favorites"
              className="pointer-events-auto w-9 h-9 rounded-full bg-white/80 dark:bg-slate-900/80 backdrop-blur-md flex items-center justify-center text-slate-700 dark:text-slate-200 hover:scale-110 active:scale-95 transition-all shadow-md focus:outline-none"
            >
              <Heart
                className={`w-4 h-4 transition-colors ${
                  favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-300'
                }`}
              />
            </button>
          </div>

          {/* Bottom Area Tag */}
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-semibold">
            <span className="flex items-center gap-1 bg-slate-900/60 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {isUrdu ? business.area?.name_ur || 'صادق آباد' : business.area?.name_en || 'Sadiqabad'}
              </span>
            </span>

            {business.distance_km !== undefined && (
              <span className="bg-teal-600/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[11px] font-mono">
                {formatDistance(business.distance_km)}
              </span>
            )}
          </div>
        </div>

        {/* Card Body */}
        <div className="p-5">
          {/* Category Chip, Price Range & Rating */}
          <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 border border-teal-200/50 dark:border-teal-800/40">
                {isUrdu
                  ? business.category?.name_ur || 'سروس'
                  : business.category?.name_en || 'Service'}
              </span>

              {/* Price Range Chip */}
              {business.price_range && (
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-md text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border border-amber-200/50 dark:border-amber-800/40 font-mono">
                  {business.price_range}
                </span>
              )}
            </div>

            <Rating rating={business.rating} reviewsCount={business.reviews_count} size="sm" />
          </div>

          {/* Business Title */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors line-clamp-1">
            {business.name}
          </h3>

          {/* Urdu Title if available */}
          {business.name_ur && (
            <p className="text-xs font-urdu text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
              {business.name_ur}
            </p>
          )}

          {/* Address & Plus Code */}
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed flex items-start gap-1.5">
            <span className="shrink-0 text-slate-400 mt-0.5">•</span>
            <span>
              {business.address || (business.plus_code ? `Plus Code: ${business.plus_code}, Sadiqabad` : 'Sadiqabad, Pakistan')}
            </span>
          </p>

          {/* Stats Bar */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Eye className="w-3.5 h-3.5" />
              <span>{business.views_count} {t.views}</span>
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            {hasPhone ? (
              <span className="font-mono text-slate-600 dark:text-slate-300 font-medium">
                {formatDisplayPhone(business.phone!)}
              </span>
            ) : (
              <span className="text-slate-400 italic">No phone</span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons: If no phone, hide Call & WhatsApp and show only Get Directions + note */}
      <div className="p-4 pt-0">
        {hasPhone ? (
          <div className="grid grid-cols-2 gap-2">
            <a
              href={generateCallUrl(business.phone!)}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/50 dark:hover:bg-teal-900/60 text-teal-700 dark:text-teal-300 font-bold text-xs transition-colors border border-teal-200/50 dark:border-teal-800/40"
            >
              <Phone className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>{t.callNow}</span>
            </a>

            <a
              href={generateWhatsAppUrl(business.whatsapp || business.phone!, business.name)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors shadow-sm shadow-emerald-500/20"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{t.chatWhatsApp}</span>
            </a>
          </div>
        ) : (
          <div className="space-y-1.5">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs transition-colors border border-slate-200 dark:border-slate-700"
            >
              <Navigation className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.getDirections}</span>
            </a>
            <p className="text-[11px] text-center text-slate-400 italic">
              Phone number not available yet
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
