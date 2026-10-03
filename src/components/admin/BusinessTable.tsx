import React, { useState, useMemo } from 'react';
import { Business, Category, Area } from '@/src/types';
import {
  updateBusiness,
  deleteBusiness,
  bulkUpdateBusinesses,
  bulkDeleteBusinesses,
  callAIDetectDuplicates,
  logAdminAction,
} from '@/src/lib/supabase';
import { showToast } from '../ui/Toast';
import * as XLSX from 'xlsx';
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  CheckCircle2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Eye,
  Phone,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  MoreVertical,
  CheckSquare,
  Square,
  Building2,
  X,
} from 'lucide-react';
import { formatDisplayPhone } from '@/src/lib/phone';

interface BusinessTableProps {
  businesses: Business[];
  categories: Category[];
  areas: Area[];
  onRefresh: () => void;
  onNavigate: (path: string) => void;
}

export function BusinessTable({
  businesses,
  categories,
  areas,
  onRefresh,
  onNavigate,
}: BusinessTableProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'verified' | 'featured' | 'missing_phone'>('all');

  // Sorting
  const [sortBy, setSortBy] = useState<'name' | 'rating' | 'views_count' | 'created_at'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);

  // Selection
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Bulk modals
  const [bulkCategoryModalOpen, setBulkCategoryModalOpen] = useState(false);
  const [bulkTargetCategoryId, setBulkTargetCategoryId] = useState<number>(categories[0]?.id || 1);
  const [bulkAreaModalOpen, setBulkAreaModalOpen] = useState(false);
  const [bulkTargetAreaId, setBulkTargetAreaId] = useState<number>(areas[0]?.id || 1);

  // Deletion modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  // Duplicates modal & scanning state
  const [duplicatesModalOpen, setDuplicatesModalOpen] = useState(false);
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);
  const [detectedGroups, setDetectedGroups] = useState<any[]>([]);
  const [suspiciousList, setSuspiciousList] = useState<any[]>([]);

  // Check URL query on mount if any
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('missingPhone=true')) {
      setStatusFilter('missing_phone');
    }
  }, []);

  // Filter & Search
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      const q = search.toLowerCase().trim();
      const matchQuery =
        !q ||
        b.name.toLowerCase().includes(q) ||
        (b.name_ur && b.name_ur.includes(q)) ||
        (b.phone && b.phone.includes(q)) ||
        (b.address && b.address.toLowerCase().includes(q)) ||
        (b.google_category && b.google_category.toLowerCase().includes(q));

      const matchCategory = !selectedCategory || String(b.category_id) === selectedCategory;
      const matchArea = !selectedArea || String(b.area_id) === selectedArea;

      let matchStatus = true;
      if (statusFilter === 'active') matchStatus = b.is_active;
      else if (statusFilter === 'inactive') matchStatus = !b.is_active;
      else if (statusFilter === 'verified') matchStatus = b.is_verified;
      else if (statusFilter === 'featured') matchStatus = b.is_featured;
      else if (statusFilter === 'missing_phone') matchStatus = !b.phone || b.phone.trim().length < 5;

      return matchQuery && matchCategory && matchArea && matchStatus;
    });
  }, [businesses, search, selectedCategory, selectedArea, statusFilter]);

  // Sort
  const sortedBusinesses = useMemo(() => {
    return [...filteredBusinesses].sort((a, b) => {
      let valA: any = a[sortBy];
      let valB: any = b[sortBy];

      if (sortBy === 'name') {
        valA = (valA || '').toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredBusinesses, sortBy, sortOrder]);

  // Pagination slice
  const totalPages = Math.ceil(sortedBusinesses.length / pageSize) || 1;
  const paginatedBusinesses = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sortedBusinesses.slice(start, start + pageSize);
  }, [sortedBusinesses, page, pageSize]);

  // Toggle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginatedBusinesses.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Inline Quick Toggles
  const handleToggleActive = async (business: Business) => {
    const next = !business.is_active;
    const res = await updateBusiness(business.id, { is_active: next });
    if (res.success) {
      showToast('Status Updated', `${business.name} is now ${next ? 'Active' : 'Inactive'}`);
      onRefresh();
    } else {
      showToast('Update Failed', res.error, 'error');
    }
  };

  const handleToggleVerified = async (business: Business) => {
    const next = !business.is_verified;
    const res = await updateBusiness(business.id, { is_verified: next });
    if (res.success) {
      showToast('Verified Updated', `${business.name} is now ${next ? 'Verified' : 'Unverified'}`);
      onRefresh();
    } else {
      showToast('Update Failed', res.error, 'error');
    }
  };

  const handleToggleFeatured = async (business: Business) => {
    const next = !business.is_featured;
    const res = await updateBusiness(business.id, { is_featured: next });
    if (res.success) {
      showToast('Featured Updated', `${business.name} is now ${next ? 'Featured' : 'Standard'}`);
      onRefresh();
    } else {
      showToast('Update Failed', res.error, 'error');
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteTargetId) return;
    const res = await deleteBusiness(deleteTargetId);
    if (res.success) {
      showToast('Deleted', 'Business successfully removed from directory');
      setDeleteTargetId(null);
      setSelectedIds((prev) => prev.filter((id) => id !== deleteTargetId));
      onRefresh();
    } else {
      showToast('Delete Failed', res.error, 'error');
    }
  };

  // Bulk Operations
  const handleBulkStatusChange = async (updates: Partial<Business>, label: string) => {
    if (selectedIds.length === 0) return;
    const res = await bulkUpdateBusinesses(selectedIds, updates);
    if (res.success) {
      showToast('Bulk Updated', `Updated ${res.count} businesses (${label})`);
      setSelectedIds([]);
      onRefresh();
    } else {
      showToast('Bulk Update Failed', res.error, 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (
      !window.confirm(
        `Are you sure you want to permanently delete ${selectedIds.length} selected businesses? This cannot be undone.`
      )
    ) {
      return;
    }

    const res = await bulkDeleteBusinesses(selectedIds);
    if (res.success) {
      showToast('Bulk Deleted', `Deleted ${res.count} businesses`);
      setSelectedIds([]);
      onRefresh();
    } else {
      showToast('Bulk Delete Failed', res.error, 'error');
    }
  };

  const handleBulkCategorySubmit = async () => {
    const res = await bulkUpdateBusinesses(selectedIds, { category_id: bulkTargetCategoryId });
    if (res.success) {
      showToast('Categories Updated', `Updated category for ${res.count} businesses`);
      setBulkCategoryModalOpen(false);
      setSelectedIds([]);
      onRefresh();
    } else {
      showToast('Bulk Category Failed', res.error, 'error');
    }
  };

  const handleBulkAreaSubmit = async () => {
    const res = await bulkUpdateBusinesses(selectedIds, { area_id: bulkTargetAreaId });
    if (res.success) {
      showToast('Areas Updated', `Updated area for ${res.count} businesses`);
      setBulkAreaModalOpen(false);
      setSelectedIds([]);
      onRefresh();
    } else {
      showToast('Bulk Area Failed', res.error, 'error');
    }
  };

  // Export to Excel / CSV
  const handleExportData = (format: 'xlsx' | 'csv') => {
    const exportRows = sortedBusinesses.map((b) => {
      const cat = categories.find((c) => c.id === b.category_id);
      const ar = areas.find((a) => a.id === b.area_id);
      return {
        Name: b.name,
        'Name (Urdu)': b.name_ur || '',
        Category: cat?.name_en || '',
        Area: ar?.name_en || '',
        Address: b.address,
        Phone: b.phone,
        WhatsApp: b.whatsapp || '',
        Rating: b.rating,
        Reviews: b.reviews_count,
        Latitude: b.latitude,
        Longitude: b.longitude,
        Website: b.website || '',
        Email: b.email || '',
        'Place ID': b.place_id || '',
        Verified: b.is_verified ? 'YES' : 'NO',
        Featured: b.is_featured ? 'YES' : 'NO',
        Active: b.is_active ? 'YES' : 'NO',
        'Views Count': b.views_count,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(exportRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Businesses');

    const fileName = `Sadiqabad_Directory_Export_${new Date().toISOString().slice(0, 10)}.${format}`;
    XLSX.writeFile(workbook, fileName);
    showToast('Export Ready', `Exported ${exportRows.length} rows to ${fileName}`);
  };

  // Find duplicates via AI / Deterministic API
  const handleFindDuplicates = async () => {
    setIsScanningDuplicates(true);
    showToast('Scanning Duplicates', 'Analyzing business names, proximity and details...');
    try {
      const res = await callAIDetectDuplicates(businesses);
      if (res.success) {
        setDetectedGroups(res.duplicateGroups || []);
        setSuspiciousList(res.suspiciousItems || []);
        setDuplicatesModalOpen(true);
        if (res.duplicateGroups.length === 0) {
          showToast('No Duplicates', 'No duplicate pairs detected in the current directory!');
        } else {
          showToast('Duplicates Found', `Detected ${res.duplicateGroups.length} candidate duplicate groups`);
        }
      } else {
        showToast('Detection Notice', res.error || 'Failed to detect duplicates', 'info');
      }
    } catch (err: any) {
      showToast('Notice', 'Duplicate detector active on Netlify deploy.', 'info');
    } finally {
      setIsScanningDuplicates(false);
    }
  };

  const handleMergeDuplicate = async (keepId: string, removeId: string, groupId: string) => {
    try {
      const keepBiz = businesses.find((b) => b.id === keepId);
      const removeBiz = businesses.find((b) => b.id === removeId);

      // Deactivate / soft-delete the duplicate record
      const res = await updateBusiness(removeId, { is_active: false });
      if (res.success) {
        await logAdminAction('MERGE_DUPLICATES', 'businesses', keepId, {
          keptName: keepBiz?.name,
          removedId: removeId,
          removedName: removeBiz?.name,
        });

        setDetectedGroups((prev) => prev.filter((g) => g.id !== groupId));
        showToast('Merged Successfully', `Kept "${keepBiz?.name}" and archived "${removeBiz?.name}"`, 'success');
        onRefresh();
      } else {
        showToast('Merge Failed', res.error, 'error');
      }
    } catch (err: any) {
      showToast('Error', err.message, 'error');
    }
  };

  const handleDismissDuplicate = async (groupId: string) => {
    setDetectedGroups((prev) => prev.filter((g) => g.id !== groupId));
    await logAdminAction('DISMISS_DUPLICATE', 'businesses', groupId);
    showToast('Dismissed', 'Duplicate warning dismissed');
  };

  const handleKeepBoth = async (groupId: string) => {
    setDetectedGroups((prev) => prev.filter((g) => g.id !== groupId));
    await logAdminAction('KEEP_BOTH_DUPLICATES', 'businesses', groupId);
    showToast('Kept Both', 'Both listings kept active in directory');
  };

  return (
    <div className="space-y-6">
      {/* Top Controls & Filters */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by business name, phone, address, or Urdu..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleFindDuplicates}
              disabled={isScanningDuplicates}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-teal-500/40 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-xs font-bold transition-all shrink-0 disabled:opacity-50"
              title="Detect duplicate listings using AI and proximity"
            >
              <Sparkles className={`w-4 h-4 ${isScanningDuplicates ? 'animate-spin' : ''}`} />
              <span>{isScanningDuplicates ? 'Scanning...' : 'Find Duplicates'}</span>
            </button>

            <button
              onClick={() => onNavigate('/admin/businesses/new')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Add New</span>
            </button>

            <button
              onClick={() => handleExportData('xlsx')}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors shrink-0"
              title="Export all matching listings to Excel"
            >
              <Download className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Export Excel</span>
            </button>
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Category"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Categories ({categories.length})</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_en}
              </option>
            ))}
          </select>

          {/* Area Filter */}
          <select
            value={selectedArea}
            onChange={(e) => {
              setSelectedArea(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by Area"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="">All Areas ({areas.length})</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name_en}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as any);
              setPage(1);
            }}
            aria-label="Filter by Status"
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
            <option value="verified">Verified Only</option>
            <option value="featured">Featured Only</option>
            <option value="missing_phone">Missing Phone</option>
          </select>

          {/* Sort By */}
          <div className="flex items-center gap-1.5">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="Sort By"
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:outline-none"
            >
              <option value="name">Sort by Name</option>
              <option value="rating">Sort by Rating</option>
              <option value="views_count">Sort by Views</option>
              <option value="created_at">Sort by Date</option>
            </select>
            <button
              onClick={() => setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))}
              className="px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
              title="Toggle sort direction"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.length > 0 && (
        <div className="p-4 rounded-2xl bg-teal-900 text-white shadow-xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="w-6 h-6 rounded-full bg-teal-500 flex items-center justify-center text-slate-950 font-black">
              {selectedIds.length}
            </span>
            <span>Businesses Selected</span>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => handleBulkStatusChange({ is_active: true }, 'Activate')}
              className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 font-semibold"
            >
              Activate
            </button>
            <button
              onClick={() => handleBulkStatusChange({ is_active: false }, 'Deactivate')}
              className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 font-semibold"
            >
              Deactivate
            </button>
            <button
              onClick={() => handleBulkStatusChange({ is_verified: true }, 'Verify')}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 font-semibold"
            >
              Verify
            </button>
            <button
              onClick={() => setBulkCategoryModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 font-semibold"
            >
              Change Category
            </button>
            <button
              onClick={() => setBulkAreaModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-teal-800 hover:bg-teal-700 font-semibold"
            >
              Change Area
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 font-bold"
            >
              Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="p-1 text-teal-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold">
                <th className="p-4 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedBusinesses.length > 0 &&
                      paginatedBusinesses.every((b) => selectedIds.includes(b.id))
                    }
                    onChange={handleSelectAll}
                    aria-label="Select all businesses on page"
                    className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                  />
                </th>
                <th className="p-4">Business</th>
                <th className="p-4">Category & Area</th>
                <th className="p-4">Contact Phone</th>
                <th className="p-4 text-center">Active</th>
                <th className="p-4 text-center">Verified</th>
                <th className="p-4 text-center">Featured</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedBusinesses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-slate-400">
                    No businesses match your active filter criteria.
                  </td>
                </tr>
              ) : (
                paginatedBusinesses.map((b) => {
                  const isSelected = selectedIds.includes(b.id);
                  const cat = categories.find((c) => c.id === b.category_id);
                  const ar = areas.find((a) => a.id === b.area_id);
                  const hasMissingPhone = !b.phone || b.phone.trim().length < 5;

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors ${
                        isSelected ? 'bg-teal-50/50 dark:bg-teal-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(b.id)}
                          aria-label={`Select ${b.name}`}
                          className="rounded text-teal-600 focus:ring-teal-500 cursor-pointer"
                        />
                      </td>

                      {/* Business Name & Image */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={b.image_url}
                            alt=""
                            className="w-10 h-10 rounded-xl object-cover shrink-0 bg-slate-200"
                          />
                          <div className="min-w-0 max-w-xs">
                            <h4 className="font-bold text-slate-900 dark:text-white truncate">
                              {b.name}
                            </h4>
                            {b.name_ur && (
                              <p className="font-urdu text-[11px] text-slate-400 truncate">
                                {b.name_ur}
                              </p>
                            )}
                            <p className="text-[11px] text-slate-400 truncate mt-0.5">
                              {b.address}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category & Area */}
                      <td className="p-4">
                        <div className="space-y-1">
                          <span className="inline-block px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wide bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300">
                            {cat?.name_en || `Category #${b.category_id}`}
                          </span>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-amber-500" />
                            <span>{ar?.name_en || 'Sadiqabad'}</span>
                          </div>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="p-4 font-mono">
                        {hasMissingPhone ? (
                          <span className="inline-flex items-center gap-1 text-rose-500 font-bold">
                            <AlertCircle className="w-3.5 h-3.5" />
                            Missing
                          </span>
                        ) : (
                          <span className="text-slate-700 dark:text-slate-300">
                            {formatDisplayPhone(b.phone || '')}
                          </span>
                        )}
                      </td>

                      {/* Active Toggle */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleActive(b)}
                          className="focus:outline-none"
                          title={b.is_active ? 'Click to deactivate' : 'Click to activate'}
                        >
                          {b.is_active ? (
                            <ToggleRight className="w-7 h-7 text-emerald-500 transition-transform active:scale-95" />
                          ) : (
                            <ToggleLeft className="w-7 h-7 text-slate-400 transition-transform active:scale-95" />
                          )}
                        </button>
                      </td>

                      {/* Verified Toggle */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleVerified(b)}
                          className="focus:outline-none"
                          title={b.is_verified ? 'Click to unverify' : 'Click to verify'}
                        >
                          <CheckCircle2
                            className={`w-5 h-5 mx-auto transition-colors ${
                              b.is_verified
                                ? 'text-teal-500 fill-teal-500/20'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Featured Toggle */}
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(b)}
                          className="focus:outline-none"
                          title={b.is_featured ? 'Click to remove from featured' : 'Click to feature'}
                        >
                          <Sparkles
                            className={`w-5 h-5 mx-auto transition-colors ${
                              b.is_featured
                                ? 'text-amber-500 fill-amber-500/20'
                                : 'text-slate-300 dark:text-slate-700'
                            }`}
                          />
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onNavigate(`/business/${b.id}`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="View Public Profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => onNavigate(`/admin/businesses/${b.id}/edit`)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Listing"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeleteTargetId(b.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="text-slate-500">
            Showing{' '}
            <span className="font-bold text-slate-800 dark:text-white">
              {sortedBusinesses.length === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-bold text-slate-800 dark:text-white">
              {Math.min(page * pageSize, sortedBusinesses.length)}
            </span>{' '}
            of{' '}
            <span className="font-bold text-slate-800 dark:text-white">
              {sortedBusinesses.length}
            </span>{' '}
            businesses
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400">Rows:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
                className="bg-slate-100 dark:bg-slate-800 rounded-lg px-2 py-1 font-bold text-xs"
              >
                <option value={15}>15</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-2 font-bold">
                {page} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 disabled:opacity-30 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Delete Business Listing?
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to permanently delete this listing from Sadiqabad directory? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Change Category Modal */}
      {bulkCategoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assign Category to {selectedIds.length} Businesses
            </h3>
            <select
              value={bulkTargetCategoryId}
              onChange={(e) => setBulkTargetCategoryId(Number(e.target.value))}
              aria-label="Target Category"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_en}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBulkCategoryModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkCategorySubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white"
              >
                Apply Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Change Area Modal */}
      {bulkAreaModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-sm w-full p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assign Area to {selectedIds.length} Businesses
            </h3>
            <select
              value={bulkTargetAreaId}
              onChange={(e) => setBulkTargetAreaId(Number(e.target.value))}
              aria-label="Target Area"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-800 dark:text-white"
            >
              {areas.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name_en}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setBulkAreaModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-500"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkAreaSubmit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-teal-600 text-white"
              >
                Apply Area
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Duplicates & Data Quality Comparison Modal */}
      {duplicatesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="max-w-4xl w-full my-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-teal-500" />
                  <span>Duplicate Listings & Quality Assistant</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  AI and deterministic analysis found {detectedGroups.length} candidate duplicate pair(s).
                </p>
              </div>

              <button
                onClick={() => setDuplicatesModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Suspicious list if any */}
            {suspiciousList.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-200 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Suspicious Data Items ({suspiciousList.length})</span>
                </h4>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {suspiciousList.map((item) => (
                    <div key={item.id} className="text-[11px] text-amber-900 dark:text-amber-100 flex items-start gap-2">
                      <span className="font-bold">{item.name}:</span>
                      <span className="text-amber-700 dark:text-amber-300">{item.reasons.join(', ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Groups list */}
            {detectedGroups.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-800 dark:text-white">
                  No Duplicates Found
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Your directory listings appear clean and unique!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {detectedGroups.map((group) => {
                  const [b1, b2] = group.businesses;
                  if (!b1 || !b2) return null;

                  return (
                    <div
                      key={group.id}
                      className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 space-y-4"
                    >
                      {/* Reason & Confidence header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200/60 dark:border-slate-700/60">
                        <span className="text-xs font-bold text-teal-700 dark:text-teal-300">
                          {group.reason}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/10 text-teal-600 border border-teal-500/20 shrink-0">
                          {Math.round(group.confidence * 100)}% Confidence
                        </span>
                      </div>

                      {/* Side by side comparison cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        {/* Business A */}
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Listing A
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {b1.id.slice(0, 8)}...
                            </span>
                          </div>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                            {b1.name}
                          </h5>
                          <p className="text-slate-600 dark:text-slate-300">
                            {b1.address}
                          </p>
                          <div className="pt-1 text-[11px] text-slate-500 flex flex-wrap gap-2">
                            <span>Phone: <strong>{b1.phone || 'None'}</strong></span>
                            <span>Rating: <strong>★ {b1.rating}</strong></span>
                            <span>Active: <strong>{b1.is_active ? 'Yes' : 'No'}</strong></span>
                          </div>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => handleMergeDuplicate(b1.id, b2.id, group.id)}
                              className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors"
                            >
                              Keep A (Archive B)
                            </button>
                          </div>
                        </div>

                        {/* Business B */}
                        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Listing B
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {b2.id.slice(0, 8)}...
                            </span>
                          </div>
                          <h5 className="font-bold text-sm text-slate-900 dark:text-white">
                            {b2.name}
                          </h5>
                          <p className="text-slate-600 dark:text-slate-300">
                            {b2.address}
                          </p>
                          <div className="pt-1 text-[11px] text-slate-500 flex flex-wrap gap-2">
                            <span>Phone: <strong>{b2.phone || 'None'}</strong></span>
                            <span>Rating: <strong>★ {b2.rating}</strong></span>
                            <span>Active: <strong>{b2.is_active ? 'Yes' : 'No'}</strong></span>
                          </div>
                          <div className="pt-2">
                            <button
                              type="button"
                              onClick={() => handleMergeDuplicate(b2.id, b1.id, group.id)}
                              className="w-full py-1.5 rounded-lg bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-sm transition-colors"
                            >
                              Keep B (Archive A)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Group Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => handleKeepBoth(group.id)}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
                        >
                          Keep Both
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissDuplicate(group.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-slate-600"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDuplicatesModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200"
              >
                Close Detector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
