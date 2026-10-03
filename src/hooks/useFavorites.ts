import { useState, useEffect } from 'react';

const FAVORITES_STORAGE_KEY = 'sadiqabad_directory_favorites_v1';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      // Storage unavailable or parsing error
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const toggleFavorite = (businessId: string): boolean => {
    try {
      const isFav = favorites.includes(businessId);
      const updated = isFav
        ? favorites.filter((id) => id !== businessId)
        : [...favorites, businessId];

      setFavorites(updated);
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(updated));
      return !isFav;
    } catch {
      return false;
    }
  };

  const isFavorite = (businessId: string): boolean => {
    return favorites.includes(businessId);
  };

  return {
    favorites,
    isFavorite,
    toggleFavorite,
    favoriteCount: favorites.length,
    isLoaded,
  };
}
