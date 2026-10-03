import { Heart } from 'lucide-react';
import { useFavorites } from '@/src/hooks/useFavorites';
import { Button } from '../ui/Button';

interface FavoriteButtonProps {
  businessId: string;
  className?: string;
  showText?: boolean;
}

export function FavoriteButton({
  businessId,
  className,
  showText = true,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(businessId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(businessId);
  };

  return (
    <Button
      variant={favorited ? 'secondary' : 'outline'}
      size="sm"
      onClick={handleClick}
      className={className}
      aria-label={favorited ? 'Remove from favorites' : 'Save to favorites'}
    >
      <Heart
        className={`w-4 h-4 transition-colors ${
          favorited ? 'fill-rose-500 text-rose-500' : 'text-slate-600 dark:text-slate-300'
        }`}
      />
      {showText && <span>{favorited ? 'Saved' : 'Save'}</span>}
    </Button>
  );
}
