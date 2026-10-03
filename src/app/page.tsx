'use client';

import { useEffect, useState } from 'react';
import { Hero } from '@/src/components/home/Hero';
import { EmergencyStrip } from '@/src/components/home/EmergencyStrip';
import { StatsStrip } from '@/src/components/home/StatsStrip';
import { CategoryGrid } from '@/src/components/home/CategoryGrid';
import { FeaturedBusinesses } from '@/src/components/home/FeaturedBusinesses';
import { getBusinesses, getCategories } from '@/src/lib/supabase';
import { Business, Category } from '@/src/types';
import { STATIC_CATEGORIES } from '@/src/lib/categories';

export default function HomePage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>(STATIC_CATEGORIES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [bData, cData] = await Promise.all([
          getBusinesses(),
          getCategories(),
        ]);
        setBusinesses(bData);
        setCategories(cData);
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero with integrated search */}
      <Hero />

      {/* 2. Emergency 24/7 Helpline Strip */}
      <EmergencyStrip />

      {/* 3. Browse by Category Grid */}
      <CategoryGrid categories={categories} />

      {/* 4. Stats Counter Strip */}
      <StatsStrip
        totalBusinesses={businesses.length || 25}
        totalCategories={categories.length || 12}
        totalAreas={8}
      />

      {/* 5. Featured & Verified Businesses */}
      <FeaturedBusinesses businesses={businesses} />
    </div>
  );
}
