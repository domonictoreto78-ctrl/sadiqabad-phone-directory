import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  Category,
  Area,
  Business,
  ImportColumnMapping,
  ImportPreparedItem,
} from '@/src/types';
import {
  getAllBusinessesAdmin,
  recordImportBatch,
  bulkUpsertBusinessesBatch,
  createCategory,
} from '@/src/lib/supabase';
import { showToast } from '../ui/Toast';
import {
  formatDisplayPhone,
  normalizeWhatsAppNumber,
  cleanPhoneNumber,
} from '@/src/lib/phone';
import { parseGoogleMapsUrl } from '@/src/lib/maps';
import { analyzeAddressForPlusCode, SADIQABAD_REF_COORDS } from '@/src/lib/pluscodes';
import { GOOGLE_CATEGORY_DEFAULTS } from '@/src/lib/transliteration';
import { slugify } from '@/src/lib/utils';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Layers,
  MapPin,
  Check,
  AlertCircle,
  FileDown,
  Sparkles,
  Info,
  FolderPlus,
  PhoneOff,
} from 'lucide-react';

interface BulkImportProps {
  categories: Category[];
  areas: Area[];
  onSuccess: () => void;
  onNavigate: (path: string) => void;
}

export function BulkImport({
  categories,
  areas,
  onSuccess,
  onNavigate,
}: BulkImportProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // File & Sheet state
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [rawRows, setRawRows] = useState<any[]>([]);
  const [fileHeaders, setFileHeaders] = useState<string[]>([]);

  // Step 2: Mapping
  const [columnMapping, setColumnMapping] = useState<ImportColumnMapping>({
    name: '',
    category: '',
    address: '',
    phone: '',
    google_maps_url: '',
    rating: '',
    reviews_count: '',
    price_range: '',
    timing_text: '',
    description: '',
  });

  const [descriptionHeaderFound, setDescriptionHeaderFound] = useState<string>('');
  const [descriptionOverride, setDescriptionOverride] = useState<boolean>(false);

  // Step 3: Category Reconciliation (Mapping, New Category, Sub-Category)
  const [distinctFileCategories, setDistinctFileCategories] = useState<string[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<string, number>>({});
  const [creatingCategoryFor, setCreatingCategoryFor] = useState<string | null>(null);
  const [newCatData, setNewCatData] = useState<{
    name_en: string;
    name_ur: string;
    parent_id?: number | null;
    icon: string;
    color: string;
  }>({
    name_en: '',
    name_ur: '',
    parent_id: null,
    icon: 'Building2',
    color: '#0F766E',
  });

  // Area Reconciliation
  const [distinctFileAreas, setDistinctFileAreas] = useState<string[]>([]);
  const [areaMap, setAreaMap] = useState<Record<string, number>>({});
  const [defaultAreaId, setDefaultAreaId] = useState<number>(areas[0]?.id || 1);

  // Step 4: Validated & Prepared Rows
  const [preparedItems, setPreparedItems] = useState<ImportPreparedItem[]>([]);
  const [duplicateStrategy, setDuplicateStrategy] = useState<'skip' | 'update' | 'import_anyway'>('skip');

  // Step 5: Ingestion progress & Summary
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importSummary, setImportSummary] = useState<{
    total: number;
    inserted: number;
    updated: number;
    skipped: number;
    missingPhone: number;
    errors: string[];
  } | null>(null);

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --------------------------------------------------------------------------
  // STEP 1: FILE PARSING & TEMPLATE DOWNLOAD
  // --------------------------------------------------------------------------

  const handleDownloadBlankTemplate = () => {
    const templateData = [
      {
        'Google Maps URL': 'https://maps.google.com/?cid=1234567890123456789',
        'Business Name': 'Al-Madina Sweet & Bakers',
        'Rating': 4.7,
        'Reviews': '(1,370)',
        'Price Range': '₨₨',
        'Business Type': 'Bakery',
        'Description': '"Best fresh halwa in Sadiqabad!" - customer',
        'Address': 'Rail Bazaar, Sadiqabad',
        'Timing': 'Open 8:00 AM - 11:00 PM',
      },
      {
        'Google Maps URL': 'https://www.google.com/maps/place/THQ+Hospital/@28.307248,70.131522,17z/data=!4m6!3m5!1s0x39375bd4a535805f:0x39a0375971ea0e1b',
        'Business Name': 'THQ General Hospital Sadiqabad',
        'Rating': 4.8,
        'Reviews': '540',
        'Price Range': '',
        'Business Type': 'General Hospital',
        'Description': '24/7 emergency medical trauma center.',
        'Address': '842M+MWH, Hospital Road, Sadiqabad',
        'Timing': 'Open 24 hours',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'Sadiqabad_GoogleMaps_Import_Template.xlsx');
  };

  const handleProcessFile = (file: File) => {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      showToast('Unsupported File', 'Please upload an Excel (.xlsx, .xls) or CSV file', 'error');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: 'array' });
        setWorkbook(wb);
        setSheetNames(wb.SheetNames);
        const firstSheet = wb.SheetNames[0] || '';
        setSelectedSheet(firstSheet);
        loadSheetData(wb, firstSheet);
      } catch (err: any) {
        showToast('Parse Error', `Could not read spreadsheet: ${err.message}`, 'error');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const loadSheetData = (wb: XLSX.WorkBook, sheetName: string) => {
    const sheet = wb.Sheets[sheetName];
    if (!sheet) return;

    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (rows.length === 0) {
      showToast('Empty Sheet', 'Selected sheet has no data rows', 'error');
      return;
    }

    setRawRows(rows);
    const headers = Object.keys(rows[0] || {});
    setFileHeaders(headers);

    // Smart Column Auto-Detection prioritizing real Excel columns
    autoMapHeaders(headers);
    setStep(2);
    showToast('File Loaded', `Found ${rows.length} rows in sheet "${sheetName}"`);
  };

  const autoMapHeaders = (headers: string[]) => {
    const findHeader = (patterns: string[]): string => {
      const match = headers.find((h) => {
        const clean = h.toLowerCase().trim().replace(/[_\s.-]/g, '');
        return patterns.some((p) => {
          const target = p.toLowerCase().replace(/[_\s.-]/g, '');
          return clean === target || clean.includes(target);
        });
      });
      return match || '';
    };

    // Description header check
    const descHeader = findHeader(['description', 'review', 'snippet', 'snippetquoted', 'about']);
    setDescriptionHeaderFound(descHeader);

    const mapping: ImportColumnMapping = {
      // 1. Exact matches for user's real Excel file:
      google_maps_url: findHeader(['googlemapsurl', 'mapsurl', 'googleurl', 'url', 'link']),
      name: findHeader(['businessname', 'name', 'title', 'storename', 'placename']) || headers[0] || '',
      rating: findHeader(['rating', 'score', 'stars', 'totalscore']),
      reviews_count: findHeader(['reviews', 'reviewscount', 'userreviews']),
      price_range: findHeader(['pricerange', 'price', 'cost']),
      category: findHeader(['businesstype', 'categoryname', 'category', 'type', 'primarycategory', 'subtypes']),
      google_category: findHeader(['businesstype', 'categoryname', 'category', 'type']),
      address: findHeader(['address', 'fulladdress', 'street', 'location', 'formattedaddress']),
      timing_text: findHeader(['timing', 'hours', 'openinghours', 'timings', 'openhours']),

      // Description is skipped by default per requirement B.1
      description: '',

      // Optional fields if present
      phone: findHeader(['phone', 'phonenumber', 'mobile', 'contact', 'telephone']),
      whatsapp: findHeader(['whatsapp', 'wanumber']),
      area: findHeader(['area', 'neighborhood', 'sector', 'cityzone']),
      website: findHeader(['website', 'site']),
      email: findHeader(['email', 'mail']),
      latitude: findHeader(['latitude', 'lat']),
      longitude: findHeader(['longitude', 'lng', 'lon']),
      place_id: findHeader(['placeid', 'cid']),
    };

    setColumnMapping(mapping);
  };

  // --------------------------------------------------------------------------
  // STEP 2: CONFIRM MAPPINGS & RECONCILE CATEGORIES
  // --------------------------------------------------------------------------

  const handleConfirmMapping = () => {
    if (!columnMapping.name) {
      showToast('Mapping Error', 'Please select a column for Business Name', 'error');
      return;
    }

    // Extract unique categories / Business Types from the file
    const catHeader = columnMapping.category;
    const uniqueCats = new Set<string>();
    rawRows.forEach((r) => {
      const val = catHeader ? String(r[catHeader] || '').trim() : '';
      if (val) uniqueCats.add(val);
    });

    const fileCatsList = Array.from(uniqueCats);
    setDistinctFileCategories(fileCatsList);

    // Smart default mapping:
    // Check GOOGLE_CATEGORY_DEFAULTS (e.g. Bakery, Cafe, Fast Food, Pizza -> Restaurants & Cafes)
    const initialCatMap: Record<string, number> = {};
    const defaultRestaurantCat = categories.find((c) => c.slug === 'restaurants') || categories[0];

    fileCatsList.forEach((fc) => {
      const lower = fc.toLowerCase().trim();

      // 1. Check smart defaults first
      const defaultSlug = GOOGLE_CATEGORY_DEFAULTS[lower];
      if (defaultSlug) {
        const matched = categories.find((c) => c.slug === defaultSlug);
        if (matched) {
          initialCatMap[fc] = matched.id;
          return;
        }
      }

      // 2. Fuzzy match against existing categories
      const matched = categories.find((c) => {
        const cLower = c.name_en.toLowerCase();
        return (
          lower === cLower ||
          lower.includes(c.slug.replace('-', ' ')) ||
          cLower.includes(lower)
        );
      });

      initialCatMap[fc] = matched ? matched.id : defaultRestaurantCat?.id || 1;
    });
    setCategoryMap(initialCatMap);

    // Extract unique areas from file or auto-detect from address text
    const areaHeader = columnMapping.area;
    const uniqueAreas = new Set<string>();
    rawRows.forEach((r) => {
      let areaVal = areaHeader ? String(r[areaHeader] || '').trim() : '';
      if (!areaVal && columnMapping.address) {
        const addr = String(r[columnMapping.address] || '');
        const found = areas.find((a) => addr.toLowerCase().includes(a.name_en.toLowerCase()));
        if (found) areaVal = found.name_en;
      }
      if (areaVal) uniqueAreas.add(areaVal);
    });

    const fileAreasList = Array.from(uniqueAreas);
    setDistinctFileAreas(fileAreasList);

    const initialAreaMap: Record<string, number> = {};
    fileAreasList.forEach((fa) => {
      const matched = areas.find(
        (a) =>
          a.name_en.toLowerCase() === fa.toLowerCase() ||
          fa.toLowerCase().includes(a.name_en.toLowerCase())
      );
      initialAreaMap[fa] = matched ? matched.id : defaultAreaId;
    });
    setAreaMap(initialAreaMap);

    setStep(3);
  };

  // Helper to create a new category or sub-category on the fly during import
  const handleCreateCategoryOnTheFly = async (businessType: string) => {
    if (!newCatData.name_en.trim()) {
      showToast('Validation Error', 'English Category Name is required', 'error');
      return;
    }

    try {
      const res = await createCategory({
        name_en: newCatData.name_en.trim(),
        name_ur: newCatData.name_ur.trim() || newCatData.name_en.trim(),
        slug: slugify(newCatData.name_en),
        icon: newCatData.icon || 'Building2',
        color: newCatData.color || '#0F766E',
        parent_id: newCatData.parent_id || null,
      });

      if (res.success && res.data) {
        showToast('Category Created', `Created "${res.data.name_en}"`);
        setCategoryMap((prev) => ({ ...prev, [businessType]: res.data!.id }));
        setCreatingCategoryFor(null);
        setNewCatData({ name_en: '', name_ur: '', parent_id: null, icon: 'Building2', color: '#0F766E' });
      } else {
        showToast('Error', res.error || 'Failed to create category', 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  // --------------------------------------------------------------------------
  // STEP 3: PREPARE, CLEAN & DETECT DUPLICATES
  // --------------------------------------------------------------------------

  const handleValidateAndPrepare = async () => {
    showToast('Validating Rows', 'Extracting coordinates, parsing Google Maps URLs, Plus Codes and duplicates...');

    // Fetch existing businesses to check duplicates
    const existing = await getAllBusinessesAdmin();
    const existingFeatureIds = new Set<string>();
    const existingNormalizedUrls = new Set<string>();
    const existingNameAddresses = new Set<string>();

    existing.forEach((b) => {
      if (b.google_feature_id) existingFeatureIds.add(b.google_feature_id.trim());
      if (b.google_maps_url) {
        const norm = b.google_maps_url.split('?')[0].replace(/\/+$/, '').toLowerCase();
        if (norm) existingNormalizedUrls.add(norm);
      }
      const key = `${b.name.toLowerCase().trim()}_${b.address.toLowerCase().trim()}`;
      existingNameAddresses.add(key);
    });

    // In-file deduplication tracker
    const fileSeenFeatureIds = new Set<string>();
    const fileSeenNormalizedUrls = new Set<string>();
    const fileSeenNameAddresses = new Set<string>();

    const prepared: ImportPreparedItem[] = [];

    rawRows.forEach((row, idx) => {
      const nameVal = String(row[columnMapping.name] || '').trim();
      const rawMapsUrl = columnMapping.google_maps_url ? String(row[columnMapping.google_maps_url] || '').trim() : '';

      // Skip totally blank rows
      if (!nameVal && !rawMapsUrl) return;

      const rawCategory = columnMapping.category ? String(row[columnMapping.category] || '').trim() : '';
      const mappedCatId = categoryMap[rawCategory] || categories[0]?.id || 1;
      const matchedCat = categories.find((c) => c.id === mappedCatId);

      const rawArea = columnMapping.area ? String(row[columnMapping.area] || '').trim() : '';
      const mappedAreaId = areaMap[rawArea] || defaultAreaId;
      const matchedArea = areas.find((a) => a.id === mappedAreaId);

      // 1. Google Maps URL Extraction (lat/lng and feature_id)
      const parsedUrl = parseGoogleMapsUrl(rawMapsUrl);
      const googleFeatureId = parsedUrl.featureId;

      // 2. Address & Plus Code Analysis
      const rawAddress = columnMapping.address ? String(row[columnMapping.address] || '').trim() : '';
      const plusCodeAnalysis = analyzeAddressForPlusCode(rawAddress);

      let finalAddress = rawAddress;
      let finalPlusCode = plusCodeAnalysis.plusCode;

      if (plusCodeAnalysis.isPlusCodeOnly) {
        // Address is purely a plus code (e.g. 842M+MWH Sadiqabad)
        finalAddress = ''; // leave address empty/null
      }

      // 3. Coordinate Resolution:
      // Priority 1: From Google Maps URL (@lat,lng or !3d!4d)
      // Priority 2: From Plus Code decoding with Sadiqabad reference (28.30, 70.13)
      // Priority 3: Fallback to Sadiqabad center
      let lat = parsedUrl.latitude;
      let lng = parsedUrl.longitude;

      if ((lat === null || lng === null) && plusCodeAnalysis.decodedCoords) {
        lat = plusCodeAnalysis.decodedCoords.latitude;
        lng = plusCodeAnalysis.decodedCoords.longitude;
      }

      if (lat === null || lng === null) {
        lat = SADIQABAD_REF_COORDS.latitude;
        lng = SADIQABAD_REF_COORDS.longitude;
      }

      // 4. Rating & Reviews Count Parsing (e.g. "(1,370)" -> 1370)
      let rScore = 4.8;
      if (columnMapping.rating && row[columnMapping.rating]) {
        const parsedScore = parseFloat(String(row[columnMapping.rating]));
        if (!isNaN(parsedScore) && parsedScore > 0 && parsedScore <= 5) {
          rScore = parsedScore;
        }
      }

      let rCount = 25;
      if (columnMapping.reviews_count && row[columnMapping.reviews_count]) {
        const rawReviewsStr = String(row[columnMapping.reviews_count]);
        const cleanedDigits = rawReviewsStr.replace(/[^0-9]/g, '');
        if (cleanedDigits) {
          rCount = parseInt(cleanedDigits, 10);
        }
      }

      // 5. Price Range & Timing Text
      const priceRange = columnMapping.price_range ? String(row[columnMapping.price_range] || '').trim() || null : null;
      const timingText = columnMapping.timing_text ? String(row[columnMapping.timing_text] || '').trim() || null : null;

      // 6. Phone handling (Missing phone is ALLOWED and not marked as invalid)
      const rawPhone = columnMapping.phone ? String(row[columnMapping.phone] || '').trim() : '';
      const digits = cleanPhoneNumber(rawPhone);
      const formattedPhone = digits.length >= 7 ? formatDisplayPhone(rawPhone) : null;

      // WhatsApp
      let wa = columnMapping.whatsapp ? String(row[columnMapping.whatsapp] || '').trim() : '';
      if (!wa && formattedPhone && digits.length >= 10) {
        const norm = normalizeWhatsAppNumber(rawPhone);
        if (norm) wa = `+${norm}`;
      }

      // Description: use only if override enabled or manually mapped
      let descText = '';
      if (descriptionOverride && columnMapping.description) {
        descText = String(row[columnMapping.description] || '').trim();
      }

      const bizData: Partial<Business> = {
        name: nameVal,
        name_ur: null,
        category_id: mappedCatId,
        area_id: mappedAreaId,
        address: finalAddress || 'Sadiqabad, Pakistan',
        phone: formattedPhone, // phone is null if missing!
        whatsapp: wa || null,
        website: columnMapping.website ? String(row[columnMapping.website] || '').trim() || null : null,
        email: columnMapping.email ? String(row[columnMapping.email] || '').trim() || null : null,
        latitude: lat,
        longitude: lng,
        google_maps_url: rawMapsUrl || `https://maps.google.com/?q=${lat},${lng}`,
        rating: Math.round(rScore * 10) / 10,
        reviews_count: rCount,
        description: descText,
        price_range: priceRange,
        timing_text: timingText,
        google_category: rawCategory || null,
        plus_code: finalPlusCode,
        google_feature_id: googleFeatureId,
        opening_hours: {}, // Do NOT invent opening_hours
        image_url:
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
        gallery: [],
        is_verified: false,
        is_featured: false,
        is_active: true,
      };

      // 7. Deduplication Logic:
      // Priority 1: google_feature_id
      // Priority 2: normalized google_maps_url
      // Priority 3: name + address
      let status: 'new' | 'duplicate' | 'invalid' | 'missing_phone' = 'new';
      let reason = 'Ready to import';

      if (!nameVal) {
        status = 'invalid';
        reason = 'Missing business title/name';
      } else {
        const normUrl = rawMapsUrl.split('?')[0].replace(/\/+$/, '').toLowerCase();
        const nameAddrKey = `${nameVal.toLowerCase().trim()}_${(finalAddress || '').toLowerCase().trim()}`;

        const isDupFeatureId = Boolean(googleFeatureId && (existingFeatureIds.has(googleFeatureId) || fileSeenFeatureIds.has(googleFeatureId)));
        const isDupUrl = Boolean(normUrl && (existingNormalizedUrls.has(normUrl) || fileSeenNormalizedUrls.has(normUrl)));
        const isDupNameAddr = Boolean(finalAddress && (existingNameAddresses.has(nameAddrKey) || fileSeenNameAddresses.has(nameAddrKey)));

        if (isDupFeatureId || isDupUrl || isDupNameAddr) {
          status = 'duplicate';
          reason = isDupFeatureId
            ? `Duplicate Google Feature ID (${googleFeatureId})`
            : isDupUrl
            ? 'Duplicate Google Maps URL'
            : 'Duplicate business name & address';
        } else if (!formattedPhone) {
          status = 'missing_phone';
          reason = 'No phone number provided in source';
        }

        // Track seen keys
        if (googleFeatureId) fileSeenFeatureIds.add(googleFeatureId);
        if (normUrl) fileSeenNormalizedUrls.add(normUrl);
        if (finalAddress) fileSeenNameAddresses.add(nameAddrKey);
      }

      prepared.push({
        index: idx + 1,
        raw: row,
        business: bizData,
        status,
        statusReason: reason,
        matchedCategory: matchedCat,
        matchedArea: matchedArea,
      });
    });

    setPreparedItems(prepared);
    setStep(4);
    showToast('Preparation Complete', `${prepared.length} valid rows processed`);
  };

  // --------------------------------------------------------------------------
  // STEP 4: PROBLEMS REPORT
  // --------------------------------------------------------------------------

  const handleDownloadProblemsReport = () => {
    const problematic = preparedItems.filter(
      (item) => item.status === 'invalid' || item.status === 'duplicate' || item.status === 'missing_phone'
    );

    if (problematic.length === 0) {
      showToast('Clean Data', 'No problematic rows found! All rows are ready.', 'info');
      return;
    }

    const reportData = problematic.map((p) => ({
      Row: p.index,
      Issue: p.status.toUpperCase(),
      Reason: p.statusReason,
      Name: p.business.name,
      Phone: p.business.phone || 'N/A (Missing)',
      Address: p.business.address,
      PlusCode: p.business.plus_code || '',
      GoogleFeatureId: p.business.google_feature_id || '',
      GoogleMapsUrl: p.business.google_maps_url || '',
      Category: p.matchedCategory?.name_en,
      Area: p.matchedArea?.name_en,
    }));

    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Import Issues');
    XLSX.writeFile(wb, `Sadiqabad_Import_Issues_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Downloaded', `Exported ${reportData.length} flagged rows`);
  };

  // --------------------------------------------------------------------------
  // STEP 5: EXECUTE BATCH UPSERT
  // --------------------------------------------------------------------------

  const handleExecuteImport = async () => {
    // Collect rows to import: 'new' and 'missing_phone' are always included
    const candidateRows = preparedItems.filter(
      (p) => p.status === 'new' || p.status === 'missing_phone' || (p.status === 'duplicate' && duplicateStrategy !== 'skip')
    );

    if (candidateRows.length === 0) {
      showToast('Nothing to Import', 'No valid rows to ingest with current duplicate settings', 'error');
      return;
    }

    setIsImporting(true);
    setImportProgress(10);

    const itemsToUpsert = candidateRows.map((c) => c.business);
    const missingPhoneCount = candidateRows.filter((c) => !c.business.phone).length;

    try {
      const res = await bulkUpsertBusinessesBatch(itemsToUpsert, duplicateStrategy);
      setImportProgress(90);

      // Record batch log
      await recordImportBatch({
        fileName,
        totalRows: preparedItems.length,
        inserted: res.inserted,
        updated: res.updated,
        skipped: res.skipped,
        details: {
          duplicateStrategy,
          missingPhoneCount,
          errorsCount: res.errors.length,
        },
      });

      setImportSummary({
        total: preparedItems.length,
        inserted: res.inserted,
        updated: res.updated,
        skipped: res.skipped,
        missingPhone: missingPhoneCount,
        errors: res.errors,
      });

      setImportProgress(100);
      setStep(5);
      showToast('Import Complete', `Successfully inserted ${res.inserted} businesses!`, 'success');
      onSuccess();
    } catch (err: any) {
      showToast('Import Failed', err.message, 'error');
    } finally {
      setIsImporting(false);
    }
  };

  const missingPhoneCount = preparedItems.filter((i) => i.status === 'missing_phone').length;
  const duplicateCount = preparedItems.filter((i) => i.status === 'duplicate').length;
  const invalidCount = preparedItems.filter((i) => i.status === 'invalid').length;
  const newCount = preparedItems.filter((i) => i.status === 'new').length;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Step Header */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
        <div className="flex items-center justify-between gap-4 overflow-x-auto pb-2 no-scrollbar">
          {[
            { num: 1, label: 'Upload File' },
            { num: 2, label: 'Map Columns' },
            { num: 3, label: 'Categories' },
            { num: 4, label: 'Validate' },
            { num: 5, label: 'Results' },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                  step === s.num
                    ? 'bg-teal-600 text-white ring-4 ring-teal-500/20 shadow-md'
                    : step > s.num
                    ? 'bg-emerald-500 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}
              >
                {step > s.num ? <Check className="w-4 h-4" /> : s.num}
              </div>
              <span
                className={`text-xs font-semibold hidden md:inline ${
                  step === s.num ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-400'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* STEP 1: UPLOAD & BLANK TEMPLATE */}
      {/* -------------------------------------------------------------------- */}
      {step === 1 && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Bulk Import Google Maps / Excel Data
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Upload your scraped Google Maps or Excel (.xlsx, .xls, .csv) spreadsheet. Real Google Maps columns like <strong>Google Maps URL, Business Name, Rating, Reviews, Business Type, Address, Timing</strong> are automatically recognized.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              const file = e.dataTransfer.files?.[0];
              if (file) handleProcessFile(file);
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`p-10 sm:p-14 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/20'
                : 'border-slate-300 dark:border-slate-700 hover:border-teal-500 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept=".xlsx,.xls,.csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleProcessFile(file);
              }}
              className="hidden"
            />
            <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mb-4 shadow-sm">
              <Upload className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-base text-slate-900 dark:text-white">
              Drag & Drop your spreadsheet here
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Supports .xlsx, .xls, and .csv files (handles 5,000+ rows smoothly)
            </p>
            <button
              type="button"
              className="mt-5 px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20"
            >
              Browse Computer
            </button>
          </div>

          {/* Template Download Option */}
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
              <div>
                <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                  Need a standard Google Maps export template?
                </h5>
                <p className="text-xs text-slate-500">
                  Download our blank Excel template featuring Google Maps URL, Business Name, Rating, Reviews, Price Range, Business Type, Address, and Timing.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDownloadBlankTemplate}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-white font-bold text-xs hover:bg-slate-100 transition-colors shadow-soft-sm shrink-0"
            >
              <Download className="w-4 h-4 text-emerald-500" />
              <span>Download Template (.xlsx)</span>
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* STEP 2: COLUMN MAPPING & 10-ROW PREVIEW */}
      {/* -------------------------------------------------------------------- */}
      {step === 2 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Step 2: Map Your File Columns
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                We automatically detected columns from "{fileName}". Adjust or skip any mappings below.
              </p>
            </div>

            {sheetNames.length > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="font-semibold text-slate-500">Sheet:</span>
                <select
                  value={selectedSheet}
                  onChange={(e) => {
                    setSelectedSheet(e.target.value);
                    if (workbook) loadSheetData(workbook, e.target.value);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-slate-800 border text-xs font-bold"
                >
                  {sheetNames.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Description Snippet Warning per requirement B.1 */}
          {descriptionHeaderFound && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Detected Column: "{descriptionHeaderFound}"</span>
                  <p className="mt-0.5 text-amber-700 dark:text-amber-300">
                    This column looks like Google review snippets (quoted user text); skipped by default.
                  </p>
                </div>
              </div>

              <label className="flex items-center gap-2 shrink-0 cursor-pointer text-xs font-bold text-amber-900 dark:text-amber-100">
                <input
                  type="checkbox"
                  checked={descriptionOverride}
                  onChange={(e) => {
                    setDescriptionOverride(e.target.checked);
                    setColumnMapping((prev) => ({
                      ...prev,
                      description: e.target.checked ? descriptionHeaderFound : '',
                    }));
                  }}
                  className="rounded border-amber-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Map as Description anyway</span>
              </label>
            </div>
          )}

          {/* Mapping Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { key: 'name', label: 'Business Name *', required: true },
              { key: 'google_maps_url', label: 'Google Maps URL (Extracts Coordinates & Feature ID)', required: false },
              { key: 'category', label: 'Business Type / Category', required: false },
              { key: 'rating', label: 'Rating (e.g. 4.7)', required: false },
              { key: 'reviews_count', label: 'Reviews Count [cleans (1,370) -> 1370]', required: false },
              { key: 'price_range', label: 'Price Range (e.g. ₨₨)', required: false },
              { key: 'address', label: 'Address / Plus Code (e.g. 842M+MWH)', required: false },
              { key: 'timing_text', label: 'Timing Text (e.g. Open 24 hours)', required: false },
              { key: 'phone', label: 'Phone Number (Optional - missing allowed)', required: false },
              { key: 'whatsapp', label: 'WhatsApp', required: false },
              { key: 'area', label: 'Area / Sector', required: false },
              { key: 'website', label: 'Website URL', required: false },
            ].map((f) => (
              <div key={f.key} className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  {f.label}
                </label>
                <select
                  value={(columnMapping as any)[f.key] || ''}
                  onChange={(e) =>
                    setColumnMapping((prev) => ({
                      ...prev,
                      [f.key]: e.target.value,
                    }))
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  <option value="">-- Skip / Do Not Map --</option>
                  {fileHeaders.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* First 5 Rows Preview Table */}
          <div className="space-y-2 pt-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Preview of First 5 Rows (Mapped Output)
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[10px] text-slate-500">
                  <tr>
                    <th className="p-2.5">Row</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Business Type</th>
                    <th className="p-2.5">Rating & Reviews</th>
                    <th className="p-2.5">Price Range</th>
                    <th className="p-2.5">Address / Plus Code</th>
                    <th className="p-2.5">Timing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {rawRows.slice(0, 5).map((r, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2.5 text-slate-400 font-mono">{i + 1}</td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                        {(columnMapping.name && r[columnMapping.name]) || '—'}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">
                        {(columnMapping.category && r[columnMapping.category]) || '—'}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">
                        ★ {(columnMapping.rating && r[columnMapping.rating]) || '4.8'} ({(columnMapping.reviews_count && r[columnMapping.reviews_count]) || '0'})
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">
                        {(columnMapping.price_range && r[columnMapping.price_range]) || '—'}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                        {(columnMapping.address && r[columnMapping.address]) || '—'}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">
                        {(columnMapping.timing_text && r[columnMapping.timing_text]) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Upload</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmMapping}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20"
            >
              <span>Continue to Categories & Areas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* STEP 3: CATEGORY & AREA RECONCILIATION */}
      {/* -------------------------------------------------------------------- */}
      {step === 3 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Step 3: Business Type Matching & Hierarchy
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Map each distinct Business Type from your Excel file to an existing category, or create it as a new category / sub-category.
            </p>
          </div>

          {/* Categories Mapping Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Distinct Business Types in File ({distinctFileCategories.length})</span>
              </h4>
            </div>

            <div className="space-y-3">
              {distinctFileCategories.map((fc) => {
                const currentCatId = categoryMap[fc] || categories[0]?.id || 1;
                const isCreating = creatingCategoryFor === fc;

                return (
                  <div
                    key={fc}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          "{fc}"
                        </span>
                        <span className="ml-2 text-[11px] text-slate-400">
                          ({rawRows.filter((r) => String(r[columnMapping.category] || '').trim() === fc).length} businesses)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <select
                          value={currentCatId}
                          onChange={(e) =>
                            setCategoryMap((prev) => ({
                              ...prev,
                              [fc]: Number(e.target.value),
                            }))
                          }
                          className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name_en} ({c.name_ur})
                            </option>
                          ))}
                        </select>

                        <button
                          type="button"
                          onClick={() => {
                            setCreatingCategoryFor(isCreating ? null : fc);
                            setNewCatData({
                              name_en: fc,
                              name_ur: '',
                              parent_id: currentCatId,
                              icon: 'Building2',
                              color: '#0F766E',
                            });
                          }}
                          className="px-3 py-1.5 rounded-xl border border-teal-500/40 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-bold flex items-center gap-1 shrink-0"
                        >
                          <FolderPlus className="w-3.5 h-3.5" />
                          <span>{isCreating ? 'Cancel' : 'Create Category / Sub-cat'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Inline Create Form */}
                    {isCreating && (
                      <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-teal-500/30 space-y-3 animate-in fade-in">
                        <h5 className="text-xs font-bold text-teal-700 dark:text-teal-300">
                          Create "{fc}" as New Category or Sub-Category
                        </h5>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Name (English) *
                            </label>
                            <input
                              type="text"
                              value={newCatData.name_en}
                              onChange={(e) => setNewCatData((p) => ({ ...p, name_en: e.target.value }))}
                              className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Name (Urdu)
                            </label>
                            <input
                              type="text"
                              value={newCatData.name_ur}
                              onChange={(e) => setNewCatData((p) => ({ ...p, name_ur: e.target.value }))}
                              placeholder="اردو نام"
                              className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-urdu"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 mb-1">
                              Parent Category (Optional Sub-Category)
                            </label>
                            <select
                              value={newCatData.parent_id || ''}
                              onChange={(e) =>
                                setNewCatData((p) => ({
                                  ...p,
                                  parent_id: e.target.value ? Number(e.target.value) : null,
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border text-xs"
                            >
                              <option value="">None (Top-Level Category)</option>
                              {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  Sub-category of: {c.name_en}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <button
                            type="button"
                            onClick={() => handleCreateCategoryOnTheFly(fc)}
                            className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm"
                          >
                            Save Category & Link
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Area Mapping */}
          {distinctFileAreas.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                <span>Areas Detected ({distinctFileAreas.length})</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {distinctFileAreas.map((fa) => (
                  <div
                    key={fa}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between"
                  >
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      "{fa}"
                    </span>
                    <select
                      value={areaMap[fa] || defaultAreaId}
                      onChange={(e) =>
                        setAreaMap((prev) => ({
                          ...prev,
                          [fa]: Number(e.target.value),
                        }))
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-semibold max-w-[180px]"
                    >
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name_en}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Mapping</span>
            </button>

            <button
              type="button"
              onClick={handleValidateAndPrepare}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20"
            >
              <span>Validate & Check Duplicates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* STEP 4: VALIDATION, METRICS & DUPLICATE STRATEGY */}
      {/* -------------------------------------------------------------------- */}
      {step === 4 && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                Step 4: Validation Results
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Review data quality metrics before committing to database. Missing phone numbers are permitted.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadProblemsReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-bold text-slate-700 dark:text-slate-200"
            >
              <FileDown className="w-4 h-4 text-amber-500" />
              <span>Download Issues Report</span>
            </button>
          </div>

          {/* Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/50 dark:border-teal-800/40">
              <span className="text-[11px] font-bold text-teal-700 dark:text-teal-300">Ready to Import</span>
              <div className="text-2xl font-black text-teal-900 dark:text-teal-100 mt-1">
                {newCount + missingPhoneCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-800/40">
              <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                <PhoneOff className="w-3.5 h-3.5" />
                <span>Missing Phone (Allowed)</span>
              </span>
              <div className="text-2xl font-black text-blue-900 dark:text-blue-100 mt-1">
                {missingPhoneCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-800/40">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300">Duplicates Detected</span>
              <div className="text-2xl font-black text-amber-900 dark:text-amber-100 mt-1">
                {duplicateCount}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-800/40">
              <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300">Invalid Rows</span>
              <div className="text-2xl font-black text-rose-900 dark:text-rose-100 mt-1">
                {invalidCount}
              </div>
            </div>
          </div>

          {/* Duplicate Strategy Selection */}
          {duplicateCount > 0 && (
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                How should we handle the {duplicateCount} duplicate row(s)?
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'skip',
                    title: 'Skip Duplicates (Recommended)',
                    desc: 'Leave existing businesses in database unchanged.',
                  },
                  {
                    id: 'update',
                    title: 'Update Existing',
                    desc: 'Overwrite existing fields with new imported values.',
                  },
                  {
                    id: 'import_anyway',
                    title: 'Import as New',
                    desc: 'Assign fresh UUIDs and insert duplicate records.',
                  },
                ].map((strat) => (
                  <label
                    key={strat.id}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                      duplicateStrategy === strat.id
                        ? 'border-teal-500 bg-teal-50/50 dark:bg-teal-950/40 ring-2 ring-teal-500/20'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <input
                        type="radio"
                        name="dupStrategy"
                        value={strat.id}
                        checked={duplicateStrategy === strat.id}
                        onChange={() => setDuplicateStrategy(strat.id as any)}
                        className="text-teal-600 focus:ring-teal-500"
                      />
                      <span className="font-bold text-slate-900 dark:text-white">
                        {strat.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-5 leading-normal">
                      {strat.desc}
                    </p>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Prepared Items Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Prepared Items Sample ({preparedItems.length} total)
            </h4>
            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 max-h-80 overflow-y-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-800 font-bold uppercase text-[10px] text-slate-500 sticky top-0">
                  <tr>
                    <th className="p-2.5">Row</th>
                    <th className="p-2.5">Name</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Phone</th>
                    <th className="p-2.5">Plus Code / Address</th>
                    <th className="p-2.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {preparedItems.slice(0, 15).map((p) => (
                    <tr key={p.index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                      <td className="p-2.5 text-slate-400 font-mono">{p.index}</td>
                      <td className="p-2.5 font-bold text-slate-900 dark:text-white">
                        {p.business.name}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300">
                        {p.matchedCategory?.name_en}
                      </td>
                      <td className="p-2.5 font-mono text-slate-600 dark:text-slate-300">
                        {p.business.phone || <span className="text-amber-500 font-sans italic">None</span>}
                      </td>
                      <td className="p-2.5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate">
                        {p.business.plus_code ? (
                          <span className="font-mono text-teal-600 mr-1">[{p.business.plus_code}]</span>
                        ) : null}
                        {p.business.address}
                      </td>
                      <td className="p-2.5">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            p.status === 'new'
                              ? 'bg-teal-500/10 text-teal-600'
                              : p.status === 'missing_phone'
                              ? 'bg-blue-500/10 text-blue-600'
                              : p.status === 'duplicate'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-rose-500/10 text-rose-600'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Categories</span>
            </button>

            <button
              type="button"
              disabled={isImporting}
              onClick={handleExecuteImport}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-teal-500/25 transition-all disabled:opacity-50"
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Importing Batch ({importProgress}%)...</span>
                </>
              ) : (
                <>
                  <span>Commit Import to Database</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* -------------------------------------------------------------------- */}
      {/* STEP 5: SUMMARY & COMPLETION */}
      {/* -------------------------------------------------------------------- */}
      {step === 5 && importSummary && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-soft-md">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Import Completed Successfully!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Businesses from "{fileName}" have been ingested in chunks of 200 rows and are now live in the directory.
            </p>
          </div>

          {/* Results Summary Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Inserted</span>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {importSummary.inserted}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Updated</span>
              <div className="text-2xl font-black text-teal-600 mt-1">
                {importSummary.updated}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Skipped Duplicates</span>
              <div className="text-2xl font-black text-amber-500 mt-1">
                {importSummary.skipped}
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Missing Phone</span>
              <div className="text-2xl font-black text-blue-500 mt-1">
                {importSummary.missingPhone}
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/admin/businesses')}
              className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20"
            >
              View Businesses in Admin Table
            </button>

            <button
              type="button"
              onClick={() => {
                setStep(1);
                setPreparedItems([]);
                setRawRows([]);
              }}
              className="px-6 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs hover:bg-slate-100"
            >
              Import Another Spreadsheet
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
