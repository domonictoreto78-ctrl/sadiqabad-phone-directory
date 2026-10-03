import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'ur';

export interface Translations {
  appName: string;
  appTagline: string;
  heroHeadline: string;
  heroSubheadline: string;
  searchPlaceholder: string;
  allCategories: string;
  allAreas: string;
  nearMe: string;
  popularSearches: string;
  featuredBusinesses: string;
  exploreCategories: string;
  emergencyTitle: string;
  emergencySubtitle: string;
  statsBusinesses: string;
  statsCategories: string;
  statsAreas: string;
  statsVerified: string;
  callNow: string;
  chatWhatsApp: string;
  getDirections: string;
  share: string;
  favorite: string;
  favorited: string;
  openNow: string;
  closed: string;
  verified: string;
  rating: string;
  reviews: string;
  views: string;
  filters: string;
  resetFilters: string;
  sortBy: string;
  relevance: string;
  highestRated: string;
  mostPopular: string;
  alphabetical: string;
  nearest: string;
  minRating: string;
  verifiedOnly: string;
  noResultsTitle: string;
  noResultsDesc: string;
  timings: string;
  about: string;
  location: string;
  photos: string;
  relatedBusinesses: string;
  navHome: string;
  navSearch: string;
  navCategories: string;
  navMap: string;
  navFavorites: string;
  footerRights: string;
  footerTagline: string;
  emergencyServices: string;
  viewAll: string;
  loading: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'Sadiqabad Directory',
    appTagline: 'City-wide Phone & Business Directory',
    heroHeadline: 'Sadiqabad ka Sab Kuch, Aik Jagah',
    heroSubheadline: 'Explore 500+ verified doctors, hospitals, restaurants, shops, and emergency services in Sadiqabad with instant Call and WhatsApp.',
    searchPlaceholder: 'Search by doctor, restaurant, shop, or service...',
    allCategories: 'All Categories',
    allAreas: 'All Sadiqabad Areas',
    nearMe: 'Near Me',
    popularSearches: 'Popular Searches',
    featuredBusinesses: 'Featured & Verified Listings',
    exploreCategories: 'Browse by Category',
    emergencyTitle: '24/7 Emergency Helplines Sadiqabad',
    emergencySubtitle: 'Immediate one-tap access to emergency rescue, police, hospital, and fire services',
    statsBusinesses: 'Verified Businesses',
    statsCategories: 'Key Categories',
    statsAreas: 'City Sectors',
    statsVerified: 'Direct Contacts',
    callNow: 'Call Now',
    chatWhatsApp: 'WhatsApp',
    getDirections: 'Directions',
    share: 'Share',
    favorite: 'Save',
    favorited: 'Saved',
    openNow: 'Open Now',
    closed: 'Closed',
    verified: 'Verified',
    rating: 'Rating',
    reviews: 'reviews',
    views: 'views',
    filters: 'Filter Results',
    resetFilters: 'Reset All',
    sortBy: 'Sort By',
    relevance: 'Most Relevant',
    highestRated: 'Highest Rated',
    mostPopular: 'Most Popular',
    alphabetical: 'Alphabetical (A-Z)',
    nearest: 'Nearest First',
    minRating: 'Minimum Rating',
    verifiedOnly: 'Verified Only',
    noResultsTitle: 'No Businesses Found',
    noResultsDesc: 'We couldn’t find any matching businesses in Sadiqabad. Try adjusting your search query or removing filters.',
    timings: 'Opening Hours',
    about: 'About Business',
    location: 'Location & Map',
    photos: 'Photos Gallery',
    relatedBusinesses: 'Similar Places Nearby',
    navHome: 'Home',
    navSearch: 'Search',
    navCategories: 'Categories',
    navMap: 'Live Map',
    navFavorites: 'Saved',
    footerRights: 'All rights reserved.',
    footerTagline: 'Empowering local commerce and healthcare connectivity in Sadiqabad, District Rahim Yar Khan, Punjab, Pakistan.',
    emergencyServices: 'Emergency Contacts',
    viewAll: 'View All',
    loading: 'Loading directory data...',
  },
  ur: {
    appName: 'صادق آباد ڈائریکٹری',
    appTagline: 'شہر کی مستند بزنس و فون ڈائریکٹری',
    heroHeadline: 'صادق آباد کا سب کچھ، ایک جگہ',
    heroSubheadline: 'صادق آباد کے تصدیق شدہ ڈاکٹرز، ہسپتال، ریسٹورنٹس، دکانیں اور ایمرجنسی نمبرز باآسانی تلاش کریں — ایک کلک پر کال اور واٹس ایپ۔',
    searchPlaceholder: 'ڈاکٹر، ریسٹورنٹ، دکان یا سروس تلاش کریں...',
    allCategories: 'تمام کیٹیگریز',
    allAreas: 'تمام علاقے',
    nearMe: 'میرے قریب',
    popularSearches: 'مشہور سرچز',
    featuredBusinesses: 'نمایاں اور تصدیق شدہ ادارے',
    exploreCategories: 'کیٹیگری کے لحاظ سے تلاش کریں',
    emergencyTitle: 'صادق آباد ایمرجنسی ہیلپ لائنز',
    emergencySubtitle: 'ریسکیو، پولیس، ہسپتال اور فائر بریگیڈ پر فوری رابطہ کریں',
    statsBusinesses: 'تصدیق شدہ ادارے',
    statsCategories: 'اہم کیٹیگریز',
    statsAreas: 'شہر کے علاقے',
    statsVerified: 'مستند رابطے',
    callNow: 'کال کریں',
    chatWhatsApp: 'واٹس ایپ',
    getDirections: 'راستہ دیکھیں',
    share: 'شیئر',
    favorite: 'محفوظ کریں',
    favorited: 'محفوظ شدہ',
    openNow: 'ابھی کھلا ہے',
    closed: 'بند ہے',
    verified: 'تصدیق شدہ',
    rating: 'ریٹنگ',
    reviews: 'رائے',
    views: 'دیکھا گیا',
    filters: 'فلٹرز',
    resetFilters: 'فلٹر ختم کریں',
    sortBy: 'ترتیب دیں',
    relevance: 'سب سے اہم',
    highestRated: 'بہترین ریٹنگ',
    mostPopular: 'سب سے مقبول',
    alphabetical: 'حروف تہجی',
    nearest: 'قریب ترین',
    minRating: 'کم از کم ریٹنگ',
    verifiedOnly: 'صرف تصدیق شدہ',
    noResultsTitle: 'کوئی ادارہ نہیں ملا',
    noResultsDesc: 'آپ کی تلاش کے مطابق صادق آباد میں کوئی نتیجہ نہیں ملا۔ برائے مہربانی دیگر الفاظ یا فلٹرز استعمال کریں۔',
    timings: 'اوقاتِ کار',
    about: 'تفصیلات',
    location: 'پتہ اور نقشہ',
    photos: 'تصاویر',
    relatedBusinesses: 'قریبی ملتے جلتے ادارے',
    navHome: 'ہوم',
    navSearch: 'سرچ',
    navCategories: 'کیٹیگریز',
    navMap: 'نقشہ',
    navFavorites: 'محفوظ',
    footerRights: 'جملہ حقوق محفوظ ہیں۔',
    footerTagline: 'صادق آباد، ضلع رحیم یار خان میں مقامی کاروبار اور سہولیات کی ڈیجیٹل ڈائریکٹری۔',
    emergencyServices: 'ایمرجنسی سروسز',
    viewAll: 'سب دیکھیں',
    loading: 'لوڈ ہو رہا ہے...',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translations;
  isUrdu: boolean;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sadiqabad_directory_lang') as Language;
      if (saved === 'en' || saved === 'ur') {
        setLanguageState(saved);
      }
    } catch {
      // ignore
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('sadiqabad_directory_lang', lang);
      document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
      document.documentElement.lang = lang;
    } catch {
      // ignore
    }
  };

  const isUrdu = language === 'ur';
  const dir = isUrdu ? 'rtl' : 'ltr';
  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isUrdu, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside of provider
    return {
      language: 'en' as Language,
      setLanguage: () => {},
      t: translations.en,
      isUrdu: false,
      dir: 'ltr' as const,
    };
  }
  return context;
}
