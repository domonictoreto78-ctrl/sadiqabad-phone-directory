import { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from '@/src/lib/i18n';
import { Navbar } from '@/src/components/layout/Navbar';
import { Footer } from '@/src/components/layout/Footer';
import { MobileBottomNav } from '@/src/components/layout/MobileBottomNav';
import { Hero } from '@/src/components/home/Hero';
import { EmergencyStrip } from '@/src/components/home/EmergencyStrip';
import { StatsStrip } from '@/src/components/home/StatsStrip';
import { CategoryGrid } from '@/src/components/home/CategoryGrid';
import { FeaturedBusinesses } from '@/src/components/home/FeaturedBusinesses';
import { BusinessGrid } from '@/src/components/business/BusinessGrid';
import { BusinessHeader } from '@/src/components/business/BusinessHeader';
import { ContactButtons } from '@/src/components/business/ContactButtons';
import { TimingsTable } from '@/src/components/business/TimingsTable';
import { MapEmbed } from '@/src/components/map/MapEmbed';
import { BusinessMap } from '@/src/components/map/BusinessMap';
import { SearchBar } from '@/src/components/search/SearchBar';
import { FilterPanel } from '@/src/components/search/FilterPanel';
import { SortDropdown } from '@/src/components/search/SortDropdown';
import { Container } from '@/src/components/ui/Container';
import { ToastContainer, showToast } from '@/src/components/ui/Toast';
import { ChatWidget } from '@/src/components/ai/ChatWidget';
import { ReviewsSection } from '@/src/components/business/ReviewsSection';
import { CorrectionModal } from '@/src/components/business/CorrectionModal';
import { EmergencyPage } from '@/src/components/emergency/EmergencyPage';
import { SubmitBusinessPage } from '@/src/components/home/SubmitBusinessPage';
import { StaticPageView } from '@/src/components/home/StaticPageView';
import { SubmissionType } from '@/src/types';
import { Edit3, PhoneCall as PhoneCallIcon } from 'lucide-react';

// Admin Components
import { AdminLayout } from '@/src/components/admin/AdminLayout';
import { AdminLogin } from '@/src/components/admin/AdminLogin';
import { AdminDashboard } from '@/src/components/admin/AdminDashboard';
import { BusinessTable } from '@/src/components/admin/BusinessTable';
import { BusinessForm } from '@/src/components/admin/BusinessForm';
import { CategoryManager } from '@/src/components/admin/CategoryManager';
import { AreaManager } from '@/src/components/admin/AreaManager';
import { BulkImport } from '@/src/components/admin/BulkImport';
import { AdminLogsView } from '@/src/components/admin/AdminLogsView';
import { AdminUsersView } from '@/src/components/admin/AdminUsersView';

import {
  getBusinesses,
  getCategories,
  getAreas,
  getBusinessById,
  getAllBusinessesAdmin,
  incrementBusinessViews,
  getAdminSession,
  AdminSession,
} from '@/src/lib/supabase';
import { Business, Category, Area, FilterOptions, SortOption } from '@/src/types';
import { STATIC_CATEGORIES, STATIC_AREAS } from '@/src/lib/categories';
import { useGeolocation } from '@/src/hooks/useGeolocation';
import { useFavorites } from '@/src/hooks/useFavorites';
import {
  ArrowLeft,
  Heart,
  SlidersHorizontal,
  Info,
  Clock,
  MapPin,
  Image as ImageIcon,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';

export default function App() {
  const [currentPath, setCurrentPath] = useState('/');
  const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>(STATIC_CATEGORIES);
  const [areas, setAreas] = useState<Area[]>(STATIC_AREAS);
  const [loading, setLoading] = useState(true);

  // Admin Session
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  // Public Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFilters, setSearchFilters] = useState<FilterOptions>({
    sort: 'relevance',
  });
  const [searchResults, setSearchResults] = useState<Business[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  // Detail page state
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);
  const [detailBusiness, setDetailBusiness] = useState<Business | null>(null);
  const [detailTab, setDetailTab] = useState<'about' | 'timings' | 'location' | 'photos'>('about');

  // Category detail state
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);

  // Part 4 Correction / Suggestion modal
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
  const [correctionInitialType, setCorrectionInitialType] = useState<SubmissionType>('correction');

  // Geolocation
  const { coords, requestLocation } = useGeolocation();
  // Favorites
  const { favorites } = useFavorites();

  // Load directory data
  const refreshAllData = async () => {
    try {
      const [bData, cData, aData] = await Promise.all([
        getAllBusinessesAdmin(),
        getCategories(),
        getAreas(),
      ]);
      setAllBusinesses(bData);
      setSearchResults(bData.filter((b) => b.is_active));
      setCategories(cData);
      setAreas(aData);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const [bData, cData, aData, session] = await Promise.all([
          getAllBusinessesAdmin(),
          getCategories(),
          getAreas(),
          getAdminSession(),
        ]);
        setAllBusinesses(bData);
        setSearchResults(bData.filter((b) => b.is_active));
        setCategories(cData);
        setAreas(aData);
        setAdminSession(session);
      } catch (err) {
        console.error('Error initializing app:', err);
      } finally {
        setLoading(false);
        setCheckingSession(false);
      }
    }
    init();
  }, []);

  // Sync hash routing
  useEffect(() => {
    const handleLocationChange = () => {
      const hash = window.location.hash.replace('#', '') || '/';
      const [path, queryString] = hash.split('?');
      setCurrentPath(path || '/');

      const params = new URLSearchParams(queryString || '');
      const q = params.get('q');
      const category = params.get('category');
      const area = params.get('area');
      const nearMe = params.get('nearMe') === 'true';

      if (q !== null) setSearchQuery(q);
      if (category || area || nearMe) {
        setSearchFilters((prev) => ({
          ...prev,
          categorySlug: category || undefined,
          areaSlug: area || undefined,
          sort: nearMe ? 'nearest' : prev.sort,
        }));
      }

      if (path.startsWith('/business/')) {
        const id = path.replace('/business/', '');
        setSelectedBusinessId(id);
      } else if (path.startsWith('/categories/')) {
        const slug = path.replace('/categories/', '');
        setSelectedCategorySlug(slug);
      }
    };

    window.addEventListener('hashchange', handleLocationChange);
    handleLocationChange();

    return () => window.removeEventListener('hashchange', handleLocationChange);
  }, []);

  const navigateTo = (path: string) => {
    window.location.hash = path;
    setCurrentPath(path.split('?')[0]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Re-fetch search results when query/filters change
  useEffect(() => {
    if (currentPath === '/search' || currentPath === '/') {
      async function runSearch() {
        setIsSearching(true);
        try {
          const res = await getBusinesses({
            ...searchFilters,
            query: searchQuery,
            userLat: coords?.latitude,
            userLng: coords?.longitude,
          });
          setSearchResults(res);
        } catch (err) {
          console.error('Search error:', err);
        } finally {
          setIsSearching(false);
        }
      }
      runSearch();
    }
  }, [searchQuery, searchFilters, currentPath, coords]);

  // Load detail business
  useEffect(() => {
    if (selectedBusinessId) {
      async function loadSingle() {
        const b = await getBusinessById(selectedBusinessId!);
        if (b) {
          setDetailBusiness(b);
          incrementBusinessViews(b.id);
        }
      }
      loadSingle();
    }
  }, [selectedBusinessId]);

  // Check session updates on admin routes
  useEffect(() => {
    if (currentPath.startsWith('/admin')) {
      getAdminSession().then((s) => setAdminSession(s));
    }
  }, [currentPath]);

  // --------------------------------------------------------------------------
  // ADMIN ROUTES (GUARDED)
  // --------------------------------------------------------------------------
  if (currentPath.startsWith('/admin')) {
    if (currentPath === '/admin/login') {
      return (
        <LanguageProvider>
          <AdminLogin
            onSuccess={async () => {
              const s = await getAdminSession();
              setAdminSession(s);
              navigateTo('/admin');
            }}
            onNavigateHome={() => navigateTo('/')}
          />
          <ToastContainer />
        </LanguageProvider>
      );
    }

    // Route Guard: verify session
    if (!adminSession) {
      return (
        <LanguageProvider>
          <AdminLogin
            onSuccess={async () => {
              const s = await getAdminSession();
              setAdminSession(s);
              navigateTo(currentPath || '/admin');
            }}
            onNavigateHome={() => navigateTo('/')}
          />
          <ToastContainer />
        </LanguageProvider>
      );
    }

    // Render inside Admin Layout
    return (
      <LanguageProvider>
        <AdminLayout
          session={adminSession}
          currentPath={currentPath}
          onNavigate={navigateTo}
        >
          {/* Dashboard */}
          {currentPath === '/admin' && (
            <AdminDashboard session={adminSession} onNavigate={navigateTo} />
          )}

          {/* Businesses List Table */}
          {currentPath === '/admin/businesses' && (
            <BusinessTable
              businesses={allBusinesses}
              categories={categories}
              areas={areas}
              onRefresh={refreshAllData}
              onNavigate={navigateTo}
            />
          )}

          {/* New Business Form */}
          {currentPath === '/admin/businesses/new' && (
            <BusinessForm
              categories={categories}
              areas={areas}
              onSuccess={() => {
                refreshAllData();
                navigateTo('/admin/businesses');
              }}
              onCancel={() => navigateTo('/admin/businesses')}
            />
          )}

          {/* Edit Business Form */}
          {currentPath.startsWith('/admin/businesses/') && currentPath.endsWith('/edit') && (
            (() => {
              const editId = currentPath.replace('/admin/businesses/', '').replace('/edit', '');
              const target = allBusinesses.find((b) => b.id === editId);
              return (
                <BusinessForm
                  initialData={target}
                  categories={categories}
                  areas={areas}
                  onSuccess={() => {
                    refreshAllData();
                    navigateTo('/admin/businesses');
                  }}
                  onCancel={() => navigateTo('/admin/businesses')}
                />
              );
            })()
          )}

          {/* Categories Manager */}
          {currentPath === '/admin/categories' && (
            <CategoryManager
              categories={categories}
              businesses={allBusinesses}
              onRefresh={refreshAllData}
            />
          )}

          {/* Areas Manager */}
          {currentPath === '/admin/areas' && (
            <AreaManager
              areas={areas}
              businesses={allBusinesses}
              onRefresh={refreshAllData}
            />
          )}

          {/* Bulk Excel/CSV Import */}
          {currentPath === '/admin/import' && (
            <BulkImport
              categories={categories}
              areas={areas}
              onSuccess={refreshAllData}
              onNavigate={navigateTo}
            />
          )}

          {/* Activity Logs */}
          {currentPath === '/admin/logs' && <AdminLogsView />}

          {/* Super Admin Users Management */}
          {currentPath === '/admin/users' && (
            adminSession.role === 'super_admin' ? (
              <AdminUsersView session={adminSession} />
            ) : (
              <div className="p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-center space-y-3">
                <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  Access Restricted
                </h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Only Super Admins can manage team members and permissions. Your account has 'Editor' role.
                </p>
              </div>
            )
          )}
        </AdminLayout>
        <ToastContainer />
      </LanguageProvider>
    );
  }

  // --------------------------------------------------------------------------
  // PUBLIC USER ROUTES (PART 1 REMAINS 100% INTACT)
  // --------------------------------------------------------------------------
  return (
    <LanguageProvider>
      <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-teal-500 selection:text-white transition-colors duration-200 pb-16 md:pb-0">
        <Navbar onNavigate={navigateTo} currentPath={currentPath} />
        <main className="flex-1">
          {/* 1. BUSINESS DETAIL VIEW */}
          {currentPath.startsWith('/business/') && detailBusiness && (
            <div className="py-8 sm:py-12 bg-slate-50 dark:bg-slate-950 min-h-screen pb-24 md:pb-12">
              <Container size="xl">
                <div className="mb-6">
                  <button
                    onClick={() => navigateTo('/search')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Directory</span>
                  </button>
                </div>

                <BusinessHeader business={detailBusiness} />

                <div className="my-8 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
                  <ContactButtons business={detailBusiness} />
                </div>

                {/* Missing Phone Alert & CTA */}
                {(!detailBusiness.phone || detailBusiness.phone.trim().length < 5) && (
                  <div className="my-6 p-4 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-soft-sm">
                    <div className="flex items-center gap-2.5 text-xs text-amber-900 dark:text-amber-200">
                      <PhoneCallIcon className="w-5 h-5 text-amber-600 shrink-0" />
                      <span>
                        <strong>Phone number missing:</strong> Do you know the phone or mobile number for {detailBusiness.name}?
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setCorrectionInitialType('phone_suggestion');
                        setCorrectionModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm shrink-0 transition-transform active:scale-95"
                    >
                      Know this number? Add it
                    </button>
                  </div>
                )}

                <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto no-scrollbar">
                  {[
                    { id: 'about', label: 'About', icon: Info },
                    { id: 'timings', label: 'Opening Hours', icon: Clock },
                    { id: 'location', label: 'Location & Map', icon: MapPin },
                    {
                      id: 'photos',
                      label: `Photos (${detailBusiness.gallery?.length || 1})`,
                      icon: ImageIcon,
                    },
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = detailTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setDetailTab(tab.id as any)}
                        className={`flex items-center gap-2 py-3 px-4 font-bold text-sm border-b-2 whitespace-nowrap transition-all ${
                          isActive
                            ? 'border-teal-500 text-teal-700 dark:text-teal-300'
                            : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
                  <div className="lg:col-span-2 space-y-8">
                    {detailTab === 'about' && (
                      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-6">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">
                            About Business
                          </h3>
                          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                            {detailBusiness.description}
                          </p>
                        </div>

                        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400">
                            Verification & Contacts
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                              <ShieldCheck className="w-4 h-4 text-emerald-500" />
                              <span>Verified Sadiqabad Business</span>
                            </div>
                            <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                              <CheckCircle2 className="w-4 h-4 text-teal-500" />
                              <span>Instant 1-Tap Call & WhatsApp</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {detailTab === 'timings' && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          Opening Hours
                        </h3>
                        <TimingsTable openingHours={detailBusiness.opening_hours} />
                      </div>
                    )}

                    {detailTab === 'location' && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          Location
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {detailBusiness.address}
                        </p>
                        <MapEmbed
                          latitude={detailBusiness.latitude}
                          longitude={detailBusiness.longitude}
                          title={detailBusiness.name}
                          height="400px"
                        />
                      </div>
                    )}

                    {detailTab === 'photos' && (
                      <div className="space-y-4">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                          Photos
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="h-60 rounded-2xl overflow-hidden bg-slate-200">
                            <img
                              src={detailBusiness.image_url}
                              alt="Main"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {detailBusiness.gallery?.map((img, i) => (
                            <div
                              key={i}
                              className="h-60 rounded-2xl overflow-hidden bg-slate-200"
                            >
                              <img
                                src={img}
                                alt={`Gallery ${i}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Part 4: Community Reviews */}
                    <div className="pt-6">
                      <ReviewsSection business={detailBusiness} />
                    </div>

                    {/* Suggest Correction & Claim triggers */}
                    <div className="pt-4 flex items-center justify-between flex-wrap gap-3 text-xs border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            setCorrectionInitialType('correction');
                            setCorrectionModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-teal-600 font-semibold transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Suggest Correction</span>
                        </button>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <button
                          onClick={() => {
                            setCorrectionInitialType('claim_business');
                            setCorrectionModalOpen(true);
                          }}
                          className="inline-flex items-center gap-1.5 text-slate-500 hover:text-teal-600 font-semibold transition-colors"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Claim this Business</span>
                        </button>
                      </div>

                      <button
                        onClick={() => {
                          setCorrectionInitialType('phone_suggestion');
                          setCorrectionModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-teal-600 hover:text-teal-700 font-bold"
                      >
                        <PhoneCallIcon className="w-3.5 h-3.5" />
                        <span>Update Contact Information</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
                      <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                        <Clock className="w-4 h-4 text-teal-600" />
                        <span>Hours Today</span>
                      </h4>
                      <TimingsTable
                        openingHours={detailBusiness.opening_hours}
                        timingText={detailBusiness.timing_text}
                      />
                    </div>

                    <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
                      <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-amber-500" />
                        <span>Location Map</span>
                      </h4>
                      <MapEmbed
                        latitude={detailBusiness.latitude}
                        longitude={detailBusiness.longitude}
                        title={detailBusiness.name}
                        height="220px"
                      />
                    </div>
                  </div>
                </div>

                <ContactButtons business={detailBusiness} isStickyMobile={true} />

                {/* Correction, Claim & Phone Modal */}
                <CorrectionModal
                  business={detailBusiness}
                  isOpen={correctionModalOpen}
                  initialType={correctionInitialType}
                  onClose={() => setCorrectionModalOpen(false)}
                />
              </Container>
            </div>
          )}

          {/* 2. CATEGORY DETAIL LISTING VIEW */}
          {currentPath.startsWith('/categories/') && selectedCategorySlug && (
            <div className="py-10 bg-slate-50 dark:bg-slate-950 min-h-screen">
              <Container size="xl">
                <div className="mb-6">
                  <button
                    onClick={() => navigateTo('/categories')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to All Categories</span>
                  </button>
                </div>

                {(() => {
                  const category = categories.find((c) => c.slug === selectedCategorySlug);
                  const catBusinesses = allBusinesses.filter(
                    (b) => b.category?.slug === selectedCategorySlug && b.is_active
                  );
                  return (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft-sm mb-8">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: category?.color || '#0F766E' }}
                            />
                            <span className="text-xs font-bold uppercase tracking-wider text-teal-600">
                              Sadiqabad Category
                            </span>
                          </div>
                          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">
                            {category ? category.name_en : selectedCategorySlug}
                          </h1>
                          {category && (
                            <p className="text-lg sm:text-xl font-urdu text-slate-500 mt-1">
                              {category.name_ur}
                            </p>
                          )}
                        </div>

                        <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {catBusinesses.length} Verified Places
                        </span>
                      </div>

                      <BusinessGrid
                        businesses={catBusinesses}
                        onSelectBusiness={(b) => navigateTo(`/business/${b.id}`)}
                      />
                    </>
                  );
                })()}
              </Container>
            </div>
          )}

          {/* 3. ALL CATEGORIES VIEW */}
          {currentPath === '/categories' && (
            <div className="py-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
              <Container size="xl">
                <div className="mb-10 text-center max-w-2xl mx-auto">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    All Business Categories
                  </h1>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Browse 12 verified sectors across healthcare, emergency, education, food, and shopping in Sadiqabad.
                  </p>
                </div>
                <CategoryGrid
                  categories={categories}
                  onSelectCategory={(slug) => navigateTo(`/categories/${slug}`)}
                />
              </Container>
            </div>
          )}

          {/* 4. MAP VIEW */}
          {currentPath === '/map' && (
            <div className="w-full">
              <BusinessMap
                businesses={allBusinesses.filter((b) => b.is_active)}
                onSelectBusiness={(b) => navigateTo(`/business/${b.id}`)}
                onNavigate={navigateTo}
              />
            </div>
          )}

          {/* 5. SAVED / FAVORITES VIEW */}
          {currentPath === '/favorites' && (
            <div className="py-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
              <Container size="xl">
                {(() => {
                  const favoriteBusinesses = allBusinesses.filter((b) =>
                    favorites.includes(b.id)
                  );
                  return (
                    <>
                      <div className="mb-8">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
                          <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
                          <span>Saved ({favoriteBusinesses.length})</span>
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          Your bookmarked emergency, healthcare, and retail contacts in Sadiqabad for quick 1-tap dialling.
                        </p>
                      </div>

                      <BusinessGrid
                        businesses={favoriteBusinesses}
                        emptyTitle="No Saved Businesses"
                        emptyDescription="You haven't added any businesses to your favorites yet. Click the heart icon on any card to save it."
                        onSelectBusiness={(b) => navigateTo(`/business/${b.id}`)}
                      />
                    </>
                  );
                })()}
              </Container>
            </div>
          )}

          {/* 6. SEARCH VIEW */}
          {currentPath === '/search' && (
            <div className="py-8 sm:py-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
              <Container size="xl">
                <div className="mb-8 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                        Search Sadiqabad Directory
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {searchResults.length} verified listings found in Sadiqabad
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setMobileFilterOpen(true)}
                        className="lg:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold shadow-soft-sm"
                      >
                        <SlidersHorizontal className="w-4 h-4 text-teal-600" />
                        <span>Filters</span>
                      </button>

                      <SortDropdown
                        value={searchFilters.sort || 'relevance'}
                        onChange={(sort: SortOption) =>
                          setSearchFilters((prev) => ({ ...prev, sort }))
                        }
                      />
                    </div>
                  </div>

                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSubmit={() => {}}
                    selectedCategory={searchFilters.categorySlug}
                    onSelectCategory={(categorySlug) =>
                      setSearchFilters((prev) => ({
                        ...prev,
                        categorySlug: categorySlug || undefined,
                      }))
                    }
                    onNearMe={requestLocation}
                    onToggleFilters={() => setMobileFilterOpen(true)}
                    suggestions={allBusinesses.filter((b) => b.is_active)}
                    onSelectSuggestion={(b) => navigateTo(`/business/${b.id}`)}
                    onAiResults={(aiResults, understood) => {
                      setSearchResults(aiResults);
                      setSearchFilters((prev) => ({
                        ...prev,
                        categorySlug: understood.category_slug || undefined,
                        areaSlug: understood.area_slug || undefined,
                        openNow: understood.open_now || undefined,
                        minRating: understood.min_rating || undefined,
                        sort: understood.sort || prev.sort,
                      }));
                    }}
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
                  <div className="hidden lg:block lg:col-span-1 sticky top-24">
                    <FilterPanel
                      filters={searchFilters}
                      onChange={(upd) => setSearchFilters((p) => ({ ...p, ...upd }))}
                      onReset={() => {
                        setSearchQuery('');
                        setSearchFilters({ sort: 'relevance' });
                      }}
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <BusinessGrid
                      businesses={searchResults}
                      isLoading={isSearching}
                      onSelectBusiness={(b) => navigateTo(`/business/${b.id}`)}
                      onResetFilters={() => {
                        setSearchQuery('');
                        setSearchFilters({ sort: 'relevance' });
                      }}
                    />
                  </div>
                </div>

                {mobileFilterOpen && (
                  <div className="fixed inset-0 z-50 flex bg-black/50 backdrop-blur-sm lg:hidden">
                    <div className="w-full max-w-sm ml-auto h-full bg-white dark:bg-slate-900 overflow-y-auto p-4 animate-in slide-in-from-right">
                      <FilterPanel
                        filters={searchFilters}
                        onChange={(upd) => setSearchFilters((p) => ({ ...p, ...upd }))}
                        onReset={() => {
                          setSearchQuery('');
                          setSearchFilters({ sort: 'relevance' });
                        }}
                        isMobileDrawer={true}
                        onCloseMobileDrawer={() => setMobileFilterOpen(false)}
                      />
                    </div>
                  </div>
                )}
              </Container>
            </div>
          )}

          {/* 8. EMERGENCY DIRECTORY PAGE */}
          {currentPath === '/emergency' && (
            <EmergencyPage onNavigate={navigateTo} />
          )}

          {/* 9. SUBMIT NEW BUSINESS PAGE */}
          {currentPath === '/submit' && (
            <SubmitBusinessPage
              categories={categories}
              areas={areas}
              onNavigate={navigateTo}
            />
          )}

          {/* 10. STATIC LEGAL & INFORMATIONAL PAGES */}
          {['/about', '/contact', '/privacy', '/terms', '/disclaimer'].includes(currentPath) && (
            <StaticPageView
              pageType={currentPath.slice(1) as any}
              onNavigate={navigateTo}
            />
          )}

          {/* 7. HOME VIEW (DEFAULT) */}
          {currentPath === '/' && (
            <div className="flex flex-col min-h-screen">
              <Hero
                onSearch={(q, cat, near) => {
                  setSearchQuery(q);
                  setSearchFilters((p) => ({
                    ...p,
                    categorySlug: cat,
                    sort: near ? 'nearest' : p.sort,
                  }));
                  navigateTo('/search');
                }}
                onNavigate={navigateTo}
              />
              <EmergencyStrip onNavigate={navigateTo} />
              <CategoryGrid
                categories={categories}
                onSelectCategory={(slug) => navigateTo(`/categories/${slug}`)}
                onNavigate={navigateTo}
              />
              <StatsStrip
                totalBusinesses={allBusinesses.filter((b) => b.is_active).length || 25}
                totalCategories={categories.length || 12}
                totalAreas={8}
              />
              <FeaturedBusinesses
                businesses={allBusinesses.filter((b) => b.is_active)}
                onNavigate={navigateTo}
                onSelectBusiness={(b) => navigateTo(`/business/${b.id}`)}
              />
            </div>
          )}
        </main>
        {!currentPath.startsWith('/admin') && (
          <ChatWidget onNavigate={navigateTo} allBusinesses={allBusinesses} />
        )}
        <Footer onNavigate={navigateTo} />
        <MobileBottomNav onNavigate={navigateTo} currentPath={currentPath} />
        <ToastContainer />
      </div>
    </LanguageProvider>
  );
}
