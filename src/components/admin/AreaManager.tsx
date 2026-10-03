import { useState } from 'react';
import { Area, Business } from '@/src/types';
import { createArea, updateArea, deleteArea } from '@/src/lib/supabase';
import { showToast } from '../ui/Toast';
import { slugify } from '@/src/lib/utils';
import { MapPin, Plus, Edit, Trash2, X, Save, Building2 } from 'lucide-react';

interface AreaManagerProps {
  areas: Area[];
  businesses: Business[];
  onRefresh: () => void;
}

export function AreaManager({ areas, businesses, onRefresh }: AreaManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [slug, setSlug] = useState('');
  const [autoSlug, setAutoSlug] = useState(true);

  const openCreateModal = () => {
    setEditingArea(null);
    setNameEn('');
    setNameUr('');
    setSlug('');
    setAutoSlug(true);
    setModalOpen(true);
  };

  const openEditModal = (area: Area) => {
    setEditingArea(area);
    setNameEn(area.name_en);
    setNameUr(area.name_ur);
    setSlug(area.slug);
    setAutoSlug(false);
    setModalOpen(true);
  };

  const handleNameEnChange = (val: string) => {
    setNameEn(val);
    if (autoSlug) {
      setSlug(slugify(val));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameEn.trim() || !slug.trim()) {
      showToast('Validation Error', 'English name and slug are required', 'error');
      return;
    }

    if (editingArea) {
      const res = await updateArea(editingArea.id, {
        name_en: nameEn.trim(),
        name_ur: nameUr.trim(),
        slug: slug.trim(),
      });
      if (res.success) {
        showToast('Updated', `Area ${nameEn} updated`);
        setModalOpen(false);
        onRefresh();
      } else {
        showToast('Update Failed', res.error, 'error');
      }
    } else {
      const res = await createArea({
        name_en: nameEn.trim(),
        name_ur: nameUr.trim(),
        slug: slug.trim(),
      });
      if (res.success) {
        showToast('Created', `Area ${nameEn} added`);
        setModalOpen(false);
        onRefresh();
      } else {
        showToast('Create Failed', res.error, 'error');
      }
    }
  };

  const handleDelete = async (area: Area) => {
    const linked = businesses.filter((b) => b.area_id === area.id);
    if (linked.length > 0) {
      alert(
        `Cannot delete area "${area.name_en}": ${linked.length} business(es) are registered in this area. Reassign or delete them first.`
      );
      return;
    }

    if (window.confirm(`Are you sure you want to delete area "${area.name_en}"?`)) {
      const res = await deleteArea(area.id);
      if (res.success) {
        showToast('Deleted', `Area ${area.name_en} deleted`);
        onRefresh();
      } else {
        showToast('Delete Failed', res.error, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <MapPin className="w-5 h-5 text-amber-500" />
            <span>Sadiqabad Areas & Sectors</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage city zones (Rail Bazaar, Club Road, Hospital Road, Model Town, etc.)
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Area</span>
        </button>
      </div>

      {/* Areas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {areas.map((area) => {
          const count = businesses.filter((b) => b.area_id === area.id).length;
          return (
            <div
              key={area.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm flex flex-col justify-between hover:shadow-soft-md transition-shadow"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5" />
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                  {area.name_en}
                </h3>
                <p className="font-urdu text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {area.name_ur}
                </p>
                <div className="text-[11px] font-mono text-teal-600 dark:text-teal-400 mt-1">
                  /{area.slug}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">
                  {count} {count === 1 ? 'business' : 'businesses'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(area)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(area)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Area Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingArea ? 'Edit City Area' : 'Add New City Area'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Area Name (English) *
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => handleNameEnChange(e.target.value)}
                  placeholder="e.g. Model Town"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Area Name (Urdu) *
                </label>
                <input
                  type="text"
                  value={nameUr}
                  onChange={(e) => setNameUr(e.target.value)}
                  placeholder="ماڈل ٹاؤن"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-urdu font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  URL Slug *
                </label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setAutoSlug(false);
                  }}
                  placeholder="model-town"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-slate-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-teal-600 text-white font-bold shadow-md shadow-teal-600/20"
                >
                  <Save className="w-4 h-4" />
                  <span>{editingArea ? 'Update Area' : 'Create Area'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
