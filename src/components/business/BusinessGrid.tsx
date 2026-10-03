import { Business } from '@/src/types';
import { BusinessCard } from './BusinessCard';
import { BusinessCardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import { useLanguage } from '@/src/lib/i18n';

interface BusinessGridProps {
  businesses: Business[];
  isLoading?: boolean;
  onSelectBusiness?: (business: Business) => void;
  onNavigate?: (path: string) => void;
  onResetFilters?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function BusinessGrid({
  businesses,
  isLoading = false,
  onSelectBusiness,
  onNavigate,
  onResetFilters,
  emptyTitle,
  emptyDescription,
}: BusinessGridProps) {
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <BusinessCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <EmptyState
        title={emptyTitle || t.noResultsTitle}
        description={emptyDescription || t.noResultsDesc}
        actionText={onResetFilters ? t.resetFilters : undefined}
        onAction={onResetFilters}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {businesses.map((business) => (
        <BusinessCard
          key={business.id}
          business={business}
          onSelect={onSelectBusiness}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}
