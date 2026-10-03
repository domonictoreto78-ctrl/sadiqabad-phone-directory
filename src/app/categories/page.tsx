'use client';

import { useEffect, useState } from 'react';
import { Container } from '@/src/components/ui/Container';
import { CategoryGrid } from '@/src/components/home/CategoryGrid';
import { getCategories } from '@/src/lib/supabase';
import { Category } from '@/src/types';
import { STATIC_CATEGORIES } from '@/src/lib/categories';
import { useLanguage } from '@/src/lib/i18n';
import { Layers } from 'lucide-react';

export default function CategoriesPage() {
  const { t, isUrdu } = useLanguage();
  const [categories, setCategories] = useState<Category[]>(STATIC_CATEGORIES);

  useEffect(() => {
    async function load() {
      const data = await getCategories();
      setCategories(data);
    }
    load();
  }, []);

  return (
    <div className="py-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Container size="xl">
        <div className="mb-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Layers className="w-3.5 h-3.5" />
            <span>Sadiqabad Classified Sectors</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            {isUrdu ? 'صادق آباد کی تمام کیٹیگریز' : 'All Business Categories'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
            {isUrdu
              ? 'شہر کے تمام شعبوں کے تصدیق شدہ فون نمبرز اور پتے'
              : 'Browse specialized healthcare, education, dining, shopping, and commercial establishments.'}
          </p>
        </div>

        <CategoryGrid categories={categories} />
      </Container>
    </div>
  );
}
