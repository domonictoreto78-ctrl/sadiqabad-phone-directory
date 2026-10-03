import { Star } from 'lucide-react';
import { cn } from '@/src/lib/utils';

interface RatingProps {
  rating: number;
  reviewsCount?: number;
  size?: 'sm' | 'md' | 'lg';
  showCount?: boolean;
  className?: string;
}

export function Rating({
  rating,
  reviewsCount,
  size = 'md',
  showCount = true,
  className,
}: RatingProps) {
  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base font-semibold',
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.4;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center text-amber-400">
        {[1, 2, 3, 4, 5].map((index) => {
          const isFilled = index <= fullStars;
          const isHalf = index === fullStars + 1 && hasHalfStar;

          return (
            <Star
              key={index}
              className={cn(
                iconSizes[size],
                isFilled
                  ? 'fill-amber-400 text-amber-400'
                  : isHalf
                  ? 'fill-amber-400/50 text-amber-400'
                  : 'text-slate-300 dark:text-slate-600'
              )}
            />
          );
        })}
      </div>

      <span className={cn('font-bold text-slate-800 dark:text-slate-100', textSizes[size])}>
        {rating.toFixed(1)}
      </span>

      {showCount && reviewsCount !== undefined && (
        <span className={cn('text-slate-500 dark:text-slate-400', textSizes[size])}>
          ({reviewsCount})
        </span>
      )}
    </div>
  );
}
