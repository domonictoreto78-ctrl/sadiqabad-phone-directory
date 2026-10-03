'use client';

import { useEffect, useState } from 'react';
import { BusinessMap } from '@/src/components/map/BusinessMap';
import { getBusinesses } from '@/src/lib/supabase';
import { Business } from '@/src/types';

export default function MapPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await getBusinesses();
        setBusinesses(data);
      } catch (err) {
        console.error('Failed to load businesses for map:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-full">
      <BusinessMap businesses={businesses} />
    </div>
  );
}
