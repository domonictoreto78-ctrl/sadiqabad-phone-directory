import { Business } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import { VerifiedBadge, OpenNowBadge } from '../ui/Badge';
import { Rating } from '../ui/Rating';
import { ShareButton } from './ShareButton';
import { FavoriteButton } from './FavoriteButton';
import { isOpenNow, formatDistance } from '@/src/lib/utils';
import { MapPin, Eye, Clock, Sparkles } from 'lucide-react';

interface BusinessHeaderProps {
  business: Business;
}

export function BusinessHeader({ business }: BusinessHeaderProps) {
  const { t, isUrdu } = useLanguage();
  const hasOpeningHours = business.opening_hours && Object.keys(business.opening_hours).length > 0;
  const status = hasOpeningHours ? isOpenNow(business.opening_hours) : null;

  return (
    <div className="w-full relative">
      {/* Cover Banner */}
      <div className="relative h-64 sm:h-80 md:h-96 w-full rounded-3xl overflow-hidden bg-slate-900 shadow-soft-lg">
        <img
          src={business.image_url}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-black/30" />

        {/* Top Actions: Category Badge, Share, Favorite */}
        <div className="absolute top-4 sm:top-6 left-4 sm:left-6 right-4 sm:right-6 flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-xs sm:text-sm font-bold uppercase tracking-wider px-3 py-1.5 rounded-xl bg-white/90 dark:bg-slate-900/90 text-teal-800 dark:text-teal-300 backdrop-blur-md shadow-md"
            >
              {isUrdu ? business.category?.name_ur : business.category?.name_en}
            </span>

            {/* Price Range Chip */}
            {business.price_range && (
              <span className="text-xs sm:text-sm font-bold px-3 py-1.5 rounded-xl bg-amber-500/90 text-slate-950 backdrop-blur-md font-mono shadow-md">
                {business.price_range}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <ShareButton title={business.name} text={business.description} className="bg-white/90 dark:bg-slate-900/90" />
            <FavoriteButton businessId={business.id} className="bg-white/90 dark:bg-slate-900/90" />
          </div>
        </div>

        {/* Bottom Banner Content Over Cover */}
        <div className="absolute bottom-6 left-4 sm:left-8 right-4 sm:right-8 text-white">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            {business.is_verified && <VerifiedBadge />}

            {/* If opening_hours is null but timing_text exists, show timing_text */}
            {!hasOpeningHours && business.timing_text ? (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-900/80 text-amber-300 backdrop-blur-md border border-white/10 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>{business.timing_text}</span>
              </span>
            ) : status ? (
              <OpenNowBadge
                isOpen={status.isOpen}
                statusText={isUrdu ? status.statusTextUr : status.statusTextEn}
              />
            ) : null}

            {business.is_featured && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-500/90 text-slate-950">
                <Sparkles className="w-3.5 h-3.5" />
                Featured Place
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight drop-shadow-md">
            {business.name}
          </h1>

          {business.name_ur && (
            <p className="text-lg sm:text-2xl font-urdu font-bold text-amber-200 mt-1 drop-shadow">
              {business.name_ur}
            </p>
          )}

          {/* Location & Meta info */}
          <div className="flex flex-wrap items-center gap-4 mt-3 text-xs sm:text-sm text-slate-200">
            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg">
              <MapPin className="w-4 h-4 text-amber-400" />
              <span>
                {isUrdu ? business.area?.name_ur : business.area?.name_en} • Sadiqabad
              </span>
            </span>

            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg">
              <Rating rating={business.rating} reviewsCount={business.reviews_count} size="sm" />
            </span>

            <span className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-3 py-1 rounded-lg text-slate-300">
              <Eye className="w-3.5 h-3.5 text-teal-300" />
              <span>{business.views_count} {t.views}</span>
            </span>

            {business.distance_km !== undefined && (
              <span className="bg-teal-600/90 px-2.5 py-1 rounded-lg font-mono">
                {formatDistance(business.distance_km)} away
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
