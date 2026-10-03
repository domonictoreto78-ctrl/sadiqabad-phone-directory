import { useState } from 'react';
import { Category, Business } from '@/src/types';
import { createCategory, updateCategory, deleteCategory } from '@/src/lib/supabase';
import { showToast } from '../ui/Toast';
import { slugify } from '@/src/lib/utils';
import {
  Layers,
  Plus,
  Edit,
  Trash2,
  Stethoscope,
  Hospital,
  Pill,
  GraduationCap,
  UtensilsCrossed,
  Smartphone,
  Zap,
  Wrench,
  Building2,
  Hotel,
  Scissors,
  ShoppingCart,
  Heart,
  X,
  Save,
} from 'lucide-react';

interface CategoryManagerProps {
  categories: Category[];
  businesses: Business[];
  onRefresh: () => void;
}

const AVAILABLE_ICONS = [
  'Stethoscope',
  'Hospital',
  'Pill',
  'GraduationCap',
  'UtensilsCrossed',
  'Smartphone',
  'Zap',
  'Wrench',
  'Building2',
  'Hotel',
  'Scissors',
  'ShoppingCart',
  'Heart',
];

const PRESET_COLORS = [
  '#0D9488',
  '#0284C7',
  '#10B981',
  '#8B5CF6',
  '#F59E0B',
  '#EC4899',
  '#F97316',
  '#3B82F6',
  '#6366F1',
  '#14B8A6',
  '#D946EF',
  '#84CC16',
  '#E11D48',
  '#475569',
];

export function CategoryManager({
  categories,
  businesses,
  onRefresh,
}: CategoryManagerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  // Form states
  const [nameEn, setNameEn] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('Building2');
  const [color, setColor] = useState('#0D9488');
  const [sortOrder, setSortOrder] = useState<number>(1);
  const [autoSlug, setAutoSlug] = useState(true);

  const openCreateModal = () => {
    setEditingCategory(null);
    setNameEn('');
    setNameUr('');
    setSlug('');
    setIcon('Building2');
    setColor('#0D9488');
    setSortOrder(categories.length + 1);
    setAutoSlug(true);
    setModalOpen(true);
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setNameEn(cat.name_en);
    setNameUr(cat.name_ur);
    setSlug(cat.slug);
    setIcon(cat.icon);
    setColor(cat.color);
    setSortOrder(cat.sort_order);
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

    if (editingCategory) {
      const res = await updateCategory(editingCategory.id, {
        name_en: nameEn.trim(),
        name_ur: nameUr.trim(),
        slug: slug.trim(),
        icon,
        color,
        sort_order: Number(sortOrder),
      });
      if (res.success) {
        showToast('Updated', `${nameEn} updated`);
        setModalOpen(false);
        onRefresh();
      } else {
        showToast('Update Failed', res.error, 'error');
      }
    } else {
      const res = await createCategory({
        name_en: nameEn.trim(),
        name_ur: nameUr.trim(),
        slug: slug.trim(),
        icon,
        color,
        sort_order: Number(sortOrder),
      });
      if (res.success) {
        showToast('Created', `${nameEn} created`);
        setModalOpen(false);
        onRefresh();
      } else {
        showToast('Create Failed', res.error, 'error');
      }
    }
  };

  const handleDelete = async (cat: Category) => {
    const linked = businesses.filter((b) => b.category_id === cat.id);
    if (linked.length > 0) {
      alert(
        `Cannot delete "${cat.name_en}": ${linked.length} business(es) currently belong to this category. Please reassign them to another category first.`
      );
      return;
    }

    if (window.confirm(`Are you sure you want to delete category "${cat.name_en}"?`)) {
      const res = await deleteCategory(cat.id);
      if (res.success) {
        showToast('Deleted', `Category ${cat.name_en} removed`);
        onRefresh();
      } else {
        showToast('Delete Failed', res.error, 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-teal-600" />
            <span>Categories Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize business types, Urdu translations, icons, and theme accents
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold text-xs shadow-md shadow-teal-500/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const count = businesses.filter((b) => b.category_id === cat.id).length;
          return (
            <div
              key={cat.id}
              className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm flex flex-col justify-between hover:shadow-soft-md transition-shadow"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm"
                    style={{ backgroundColor: cat.color || '#0D9488' }}
                  >
                    <Building2 className="w-5 h-5" />
                  </div>
                  <span className="font-mono text-xs font-bold text-slate-400">
                    Order #{cat.sort_order}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1">
                  {cat.name_en}
                </h3>
                <p className="font-urdu text-xs text-slate-500 line-clamp-1 mt-0.5">
                  {cat.name_ur}
                </p>
                <div className="text-[11px] font-mono text-teal-600 dark:text-teal-400 mt-1">
                  /{cat.slug}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-500">
                  {count} {count === 1 ? 'place' : 'places'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => openEditModal(cat)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat)}
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

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingCategory ? 'Edit Category' : 'Create New Category'}
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
                  Category Name (English) *
                </label>
                <input
                  type="text"
                  value={nameEn}
                  onChange={(e) => handleNameEnChange(e.target.value)}
                  placeholder="e.g. Restaurants & Cafes"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Category Name (Urdu) *
                </label>
                <input
                  type="text"
                  value={nameUr}
                  onChange={(e) => setNameUr(e.target.value)}
                  placeholder="ریسٹورنٹس اور کیفے"
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
                  placeholder="restaurants"
                  required
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>

              {/* Color Picker */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Theme Accent Color
                </label>
                <div className="flex flex-wrap gap-2 items-center">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${
                        color === c ? 'scale-125 border-slate-900 dark:border-white shadow-md' : 'border-transparent'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                    title="Custom color"
                  />
                </div>
              </div>

              {/* Icon Selector */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Category Icon: <span className="font-mono text-teal-600">{icon}</span>
                </label>
                <select
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                >
                  {AVAILABLE_ICONS.map((ic) => (
                    <option key={ic} value={ic}>
                      {ic}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={sortOrder}
                  onChange={(e) => setSortOrder(Number(e.target.value))}
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
                  <span>{editingCategory ? 'Update Category' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
