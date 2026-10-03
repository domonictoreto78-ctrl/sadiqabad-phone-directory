import React, { useState, useEffect } from 'react';
import { Business, Category, Area, OpeningHours, WeekDays } from '@/src/types';
import {
  createBusiness,
  updateBusiness,
  uploadBusinessImage,
  callAIGenerateDescription,
} from '@/src/lib/supabase';
import { showToast } from '../ui/Toast';
import {
  formatDisplayPhone,
  normalizeWhatsAppNumber,
  cleanPhoneNumber,
} from '@/src/lib/phone';
import {
  Save,
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle2,
  Trash2,
  Plus,
  Compass,
} from 'lucide-react';
import { MapEmbed } from '../map/MapEmbed';

interface BusinessFormProps {
  initialData?: Business | null;
  categories: Category[];
  areas: Area[];
  onSuccess: () => void;
  onCancel: () => void;
}

const DEFAULT_HOURS: OpeningHours = {
  monday: { open: '09:00', close: '22:00', is_closed: false },
  tuesday: { open: '09:00', close: '22:00', is_closed: false },
  wednesday: { open: '09:00', close: '22:00', is_closed: false },
  thursday: { open: '09:00', close: '22:00', is_closed: false },
  friday: { open: '09:00', close: '22:00', is_closed: false },
  saturday: { open: '09:00', close: '22:00', is_closed: false },
  sunday: { open: '10:00', close: '20:00', is_closed: false },
};

// Common Sadiqabad landmarks coordinates for quick pick
const SADIQABAD_PRESETS = [
  { label: 'THQ Hospital / Hospital Road', lat: 28.3072, lng: 70.1315 },
  { label: 'Rail Bazaar / Ghanta Ghar', lat: 28.3054, lng: 70.134 },
  { label: 'Club Road / TMA', lat: 28.312, lng: 70.129 },
  { label: 'Model Town / Civic Center', lat: 28.314, lng: 70.125 },
  { label: 'Allama Iqbal Road', lat: 28.309, lng: 70.1285 },
  { label: 'Bypass / KLP Highway', lat: 28.318, lng: 70.138 },
];

export function BusinessForm({
  initialData,
  categories,
  areas,
  onSuccess,
  onCancel,
}: BusinessFormProps) {
  const isEditing = Boolean(initialData?.id);

  const [name, setName] = useState(initialData?.name || '');
  const [nameUr, setNameUr] = useState(initialData?.name_ur || '');
  const [categoryId, setCategoryId] = useState<number>(
    initialData?.category_id || categories[0]?.id || 1
  );
  const [areaId, setAreaId] = useState<number>(
    initialData?.area_id || areas[0]?.id || 1
  );
  const [description, setDescription] = useState(initialData?.description || '');
  const [address, setAddress] = useState(initialData?.address || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [whatsapp, setWhatsapp] = useState(initialData?.whatsapp || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [facebook, setFacebook] = useState(initialData?.facebook || '');
  const [instagram, setInstagram] = useState(initialData?.instagram || '');
  const [latitude, setLatitude] = useState<number>(
    initialData?.latitude || 28.3072
  );
  const [longitude, setLongitude] = useState<number>(
    initialData?.longitude || 70.1315
  );
  const [googleMapsUrl, setGoogleMapsUrl] = useState(
    initialData?.google_maps_url || ''
  );
  const [placeId, setPlaceId] = useState(initialData?.place_id || '');
  const [rating, setRating] = useState<number>(initialData?.rating || 4.8);
  const [reviewsCount, setReviewsCount] = useState<number>(
    initialData?.reviews_count || 50
  );
  const [imageUrl, setImageUrl] = useState(
    initialData?.image_url ||
      'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80'
  );
  const [gallery, setGallery] = useState<string[]>(initialData?.gallery || []);
  const [newGalleryUrl, setNewGalleryUrl] = useState('');
  const [isVerified, setIsVerified] = useState(initialData?.is_verified ?? false);
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured ?? false);
  const [isActive, setIsActive] = useState(initialData?.is_active ?? true);
  const [openingHours, setOpeningHours] = useState<OpeningHours>(
    initialData?.opening_hours && Object.keys(initialData.opening_hours).length > 0
      ? initialData.opening_hours
      : DEFAULT_HOURS
  );

  const [priceRange, setPriceRange] = useState(initialData?.price_range || '');
  const [timingText, setTimingText] = useState(initialData?.timing_text || '');
  const [googleCategory, setGoogleCategory] = useState(initialData?.google_category || '');
  const [plusCode, setPlusCode] = useState(initialData?.plus_code || '');
  const [googleFeatureId, setGoogleFeatureId] = useState(initialData?.google_feature_id || '');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // AI Description Generator
  const handleGenerateWithAI = async () => {
    if (!name.trim()) {
      showToast('Name Required', 'Please enter a business name before generating description', 'error');
      return;
    }

    setIsGeneratingAI(true);
    const cat = categories.find((c) => c.id === categoryId);
    const ar = areas.find((a) => a.id === areaId);

    try {
      const res = await callAIGenerateDescription({
        name: name.trim(),
        category: cat?.name_en,
        area: ar?.name_en,
        address: address.trim(),
        price_range: priceRange.trim(),
        google_category: googleCategory.trim(),
      });

      if (res.success && res.data) {
        setDescription(res.data.description_en);
        if (!nameUr.trim() && res.data.description_ur) {
          // Keep Urdu translated description if needed
        }
        if (res.data.suggested_category_slug) {
          const matched = categories.find((c) => c.slug === res.data!.suggested_category_slug);
          if (matched) setCategoryId(matched.id);
        }
        showToast('AI Description Generated', 'Generated 2-3 sentence overview. You can edit before saving.', 'success');
      } else {
        showToast('Notice', res.error || 'AI feature is active once deployed on Netlify.', 'info');
      }
    } catch (err: any) {
      showToast('AI Generation Notice', 'AI service reachable upon deployment to Netlify.', 'info');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // Auto-fill WhatsApp from phone
  const handleAutoFillWhatsapp = () => {
    if (!phone) return;
    const normalized = normalizeWhatsAppNumber(phone);
    if (normalized) {
      setWhatsapp(`+${normalized}`);
      showToast('WhatsApp Formatted', `Generated +${normalized}`);
    }
  };

  // Image file upload handler
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const res = await uploadBusinessImage(file);
      if (res.success && res.url) {
        setImageUrl(res.url);
        showToast('Image Uploaded', 'Main photo uploaded to Supabase Storage');
      } else {
        showToast('Upload Failed', res.error, 'error');
      }
    } catch (err: any) {
      showToast('Upload Exception', err.message, 'error');
    } finally {
      setUploadingImage(false);
    }
  };

  // Gallery add
  const handleAddGalleryItem = () => {
    if (!newGalleryUrl.trim()) return;
    setGallery([...gallery, newGalleryUrl.trim()]);
    setNewGalleryUrl('');
  };

  const handleRemoveGalleryItem = (idx: number) => {
    setGallery(gallery.filter((_, i) => i !== idx));
  };

  // Hours helpers
  const handleDayChange = (
    day: WeekDays,
    field: 'open' | 'close' | 'is_closed',
    val: any
  ) => {
    setOpeningHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: val,
      },
    }));
  };

  const setAllDays24_7 = () => {
    const hours24: OpeningHours = {} as any;
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(
      (d) => {
        hours24[d] = { open: '00:00', close: '23:59', is_closed: false };
      }
    );
    setOpeningHours(hours24);
    showToast('Hours Updated', 'Set to Open 24/7');
  };

  const setAllDaysStandard = () => {
    setOpeningHours(DEFAULT_HOURS);
    showToast('Hours Updated', 'Set to standard 9:00 AM - 10:00 PM');
  };

  // Form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Validation Error', 'Business name is required', 'error');
      return;
    }

    if (!address.trim()) {
      showToast('Validation Error', 'Address in Sadiqabad is required', 'error');
      return;
    }

    // Phone validation (optional, format if provided)
    let formattedPhone: string | null = null;
    if (phone.trim()) {
      const digits = cleanPhoneNumber(phone);
      if (digits.length < 7) {
        setPhoneError('If provided, please enter a valid phone number (e.g. 0300-1234567 or 068-5741234)');
        showToast('Invalid Phone', 'Please correct the phone number or leave blank', 'error');
        return;
      }
      formattedPhone = formatDisplayPhone(phone);
    }
    setPhoneError(null);

    setSaving(true);

    const payload: Partial<Business> = {
      name: name.trim(),
      name_ur: nameUr.trim() || null,
      category_id: Number(categoryId),
      area_id: Number(areaId),
      description: description.trim(),
      address: address.trim(),
      phone: formattedPhone,
      whatsapp: whatsapp.trim() || null,
      website: website.trim() || null,
      email: email.trim() || null,
      facebook: facebook.trim() || null,
      instagram: instagram.trim() || null,
      latitude: Number(latitude),
      longitude: Number(longitude),
      google_maps_url: googleMapsUrl.trim() || `https://maps.google.com/?q=${latitude},${longitude}`,
      place_id: placeId.trim() || null,
      price_range: priceRange.trim() || null,
      timing_text: timingText.trim() || null,
      google_category: googleCategory.trim() || null,
      plus_code: plusCode.trim() || null,
      google_feature_id: googleFeatureId.trim() || null,
      rating: Number(rating),
      reviews_count: Number(reviewsCount),
      opening_hours: openingHours,
      image_url: imageUrl.trim(),
      gallery,
      is_verified: isVerified,
      is_featured: isFeatured,
      is_active: isActive,
    };

    try {
      if (isEditing && initialData?.id) {
        const res = await updateBusiness(initialData.id, payload);
        if (res.success) {
          showToast('Updated Successfully', `${payload.name} has been updated`);
          onSuccess();
        } else {
          showToast('Update Failed', res.error, 'error');
        }
      } else {
        const res = await createBusiness(payload);
        if (res.success) {
          showToast('Created Successfully', `${payload.name} has been added to Sadiqabad directory`);
          onSuccess();
        } else {
          showToast('Create Failed', res.error, 'error');
        }
      }
    } catch (err: any) {
      showToast('Error', err.message || 'Operation failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const daysList: { key: WeekDays; label: string }[] = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
              {isEditing ? `Edit: ${initialData?.name}` : 'Add New Business Listing'}
            </h2>
            <p className="text-xs text-slate-400">
              Sadiqabad Directory • Complete Business Profile Form
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-teal-500/25 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Listing'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Primary Details (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Basic Information */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              1. Basic Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Business Name (English) *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. THQ Hospital Sadiqabad"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Business Name (Urdu)
                </label>
                <input
                  type="text"
                  value={nameUr}
                  onChange={(e) => setNameUr(e.target.value)}
                  placeholder="تحصیل ہیڈ کوارٹر ہسپتال صادق آباد"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-urdu font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(Number(e.target.value))}
                  aria-label="Category"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_en} ({c.name_ur})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  City Area *
                </label>
                <select
                  value={areaId}
                  onChange={(e) => setAreaId(Number(e.target.value))}
                  aria-label="City Area"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name_en} ({a.name_ur})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                Full Physical Address *
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Shop # 12, Main Rail Bazaar, Sadiqabad"
                required
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Price Range
                </label>
                <input
                  type="text"
                  value={priceRange}
                  onChange={(e) => setPriceRange(e.target.value)}
                  placeholder="e.g. ₨₨ or PKR 500-1500"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Timing Text
                </label>
                <input
                  type="text"
                  value={timingText}
                  onChange={(e) => setTimingText(e.target.value)}
                  placeholder="e.g. Open 24 hours or 9:00 AM - 10:00 PM"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Google Business Type
                </label>
                <input
                  type="text"
                  value={googleCategory}
                  onChange={(e) => setGoogleCategory(e.target.value)}
                  placeholder="e.g. Family restaurant"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Google Plus Code
                </label>
                <input
                  type="text"
                  value={plusCode}
                  onChange={(e) => setPlusCode(e.target.value)}
                  placeholder="e.g. 842M+MWH"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Google Feature ID
                </label>
                <input
                  type="text"
                  value={googleFeatureId}
                  onChange={(e) => setGoogleFeatureId(e.target.value)}
                  placeholder="0x39375bd4a535805f:..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Detailed Description & Services
                </label>
                <button
                  type="button"
                  onClick={handleGenerateWithAI}
                  disabled={isGeneratingAI}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-600 dark:text-teal-400 font-bold text-xs transition-colors border border-teal-500/20 disabled:opacity-50"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAI ? 'animate-spin' : ''}`} />
                  <span>{isGeneratingAI ? 'Generating AI...' : 'Generate with AI'}</span>
                </button>
              </div>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe facilities, emergency services, specialities, or product lines..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          {/* Card: Contact Details */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              2. Phone & Online Contacts
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Phone Number (Optional - leave blank if unknown)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneError(null);
                  }}
                  placeholder="0300-1234567 or 068-5741234"
                  className={`w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-sm font-mono focus:outline-none focus:ring-2 ${
                    phoneError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 dark:border-slate-700 focus:ring-teal-500'
                  }`}
                />
                {phoneError && (
                  <p className="text-[11px] text-rose-500 mt-1 font-semibold">{phoneError}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    WhatsApp Number
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoFillWhatsapp}
                    className="text-[11px] font-bold text-teal-600 hover:text-teal-700"
                  >
                    Auto-fill from Phone
                  </button>
                </div>
                <input
                  type="text"
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="+923001234567"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Website URL
                </label>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="info@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Facebook Page
                </label>
                <input
                  type="url"
                  value={facebook}
                  onChange={(e) => setFacebook(e.target.value)}
                  placeholder="https://facebook.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Instagram Handle
                </label>
                <input
                  type="url"
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="https://instagram.com/..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Card: Weekly Opening Hours Editor */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>3. Weekly Opening Hours (PKT)</span>
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={setAllDays24_7}
                  className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/60 dark:text-teal-300 font-bold"
                >
                  Set 24/7
                </button>
                <button
                  type="button"
                  onClick={setAllDaysStandard}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold"
                >
                  Set Standard (9am-10pm)
                </button>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {daysList.map((day) => {
                const sched = openingHours[day.key] || {
                  open: '09:00',
                  close: '22:00',
                  is_closed: false,
                };
                return (
                  <div
                    key={day.key}
                    className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="w-28 font-bold text-slate-800 dark:text-slate-200">
                      {day.label}
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={sched.is_closed}
                          onChange={(e) =>
                            handleDayChange(day.key, 'is_closed', e.target.checked)
                          }
                          className="rounded text-rose-600"
                        />
                        <span className={sched.is_closed ? 'font-bold text-rose-500' : 'text-slate-500'}>
                          Closed
                        </span>
                      </label>

                      {!sched.is_closed && (
                        <div className="flex items-center gap-1.5 font-mono">
                          <input
                            type="time"
                            value={sched.open}
                            onChange={(e) =>
                              handleDayChange(day.key, 'open', e.target.value)
                            }
                            aria-label={`${day.label} open time`}
                            className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          />
                          <span>to</span>
                          <input
                            type="time"
                            value={sched.close}
                            onChange={(e) =>
                              handleDayChange(day.key, 'close', e.target.value)
                            }
                            aria-label={`${day.label} close time`}
                            className="px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Photos, Coordinates & Status Flags (1 col) */}
        <div className="space-y-6">
          {/* Card: Status Flags */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
              Listing Status Flags
            </h3>

            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Active Listing</div>
                  <div className="text-[11px] text-slate-400">Publicly visible in search and maps</div>
                </div>
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-500" />
                    <span>Verified Badge</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Displays official verified checkmark</div>
                </div>
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Featured Placement</span>
                  </div>
                  <div className="text-[11px] text-slate-400">Pinned to homepage top recommendations</div>
                </div>
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 rounded text-teal-600 focus:ring-teal-500"
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Rating (1.0 - 5.0)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Reviews Count
                </label>
                <input
                  type="number"
                  min="0"
                  value={reviewsCount}
                  onChange={(e) => setReviewsCount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>
            </div>
          </div>

          {/* Card: Images & Upload */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" />
              <span>Images & Supabase Storage</span>
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Main Cover Photo
              </label>
              <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3 border border-slate-200 dark:border-slate-700">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center gap-2 mb-2">
                <label className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 font-bold text-xs cursor-pointer hover:bg-teal-100 transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload File'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>
              </div>

              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Or paste direct image URL..."
                aria-label="Direct Image URL"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>

            {/* Gallery Section */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                Additional Gallery Photos ({gallery.length})
              </label>
              <div className="flex gap-1.5 mb-2">
                <input
                  type="text"
                  value={newGalleryUrl}
                  onChange={(e) => setNewGalleryUrl(e.target.value)}
                  placeholder="Paste photo URL..."
                  aria-label="New gallery photo URL"
                  className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddGalleryItem}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-white font-bold text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {gallery.length > 0 && (
                <div className="grid grid-cols-3 gap-2 max-h-36 overflow-y-auto">
                  {gallery.map((g, i) => (
                    <div key={i} className="relative group rounded-lg overflow-hidden h-16 bg-slate-100">
                      <img src={g} alt="" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveGalleryItem(i)}
                        className="absolute inset-0 bg-rose-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Card: Geographic Coordinates & Map */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-500" />
              <span>Location Coordinates</span>
            </h3>

            {/* Quick Sadiqabad Presets */}
            <div>
              <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
                Quick Landmark Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {SADIQABAD_PRESETS.map((p, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setLatitude(p.lat);
                      setLongitude(p.lng);
                    }}
                    className="text-[10px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-700 hover:text-teal-700 dark:bg-slate-800 dark:text-slate-300 font-semibold"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 mb-1">
                Google Place ID (Optional)
              </label>
              <input
                type="text"
                value={placeId}
                onChange={(e) => setPlaceId(e.target.value)}
                placeholder="ChIJ... (for deduplication)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
              />
            </div>

            {/* Map Preview */}
            <div className="pt-2">
              <MapEmbed
                latitude={latitude}
                longitude={longitude}
                title={name || 'Business Location'}
                height="180px"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
