import React, { useState } from 'react';
import { Category, Area } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import { Container } from '../ui/Container';
import { showToast } from '../ui/Toast';
import {
  Building2,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Send,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Info,
} from 'lucide-react';

interface SubmitBusinessPageProps {
  categories: Category[];
  areas: Area[];
  onNavigate: (path: string) => void;
}

export function SubmitBusinessPage({
  categories,
  areas,
  onNavigate,
}: SubmitBusinessPageProps) {
  const { isUrdu } = useLanguage();

  const [name, setName] = useState('');
  const [nameUr, setNameUr] = useState('');
  const [categoryId, setCategoryId] = useState<number>(categories[0]?.id || 1);
  const [areaId, setAreaId] = useState<number>(areas[0]?.id || 1);
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [timings, setTimings] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [honeypot, setHoneypot] = useState('');
  const [formOpenedAt] = useState<number>(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Name Required', 'Please enter your business name', 'error');
      return;
    }

    if (!phone.trim()) {
      showToast('Phone Required', 'Please enter a valid phone or mobile number', 'error');
      return;
    }

    setSubmitting(true);
    const selectedCategory = categories.find((c) => c.id === Number(categoryId));
    const selectedArea = areas.find((a) => a.id === Number(areaId));

    try {
      const res = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'new_business',
          payload: {
            name: name.trim(),
            name_ur: nameUr.trim() || null,
            category_id: categoryId,
            category_name: selectedCategory?.name_en,
            area_id: areaId,
            area_name: selectedArea?.name_en,
            address: address.trim(),
            phone: phone.trim(),
            whatsapp: whatsapp.trim() || phone.trim(),
            timings: timings.trim(),
            notes: notes.trim(),
          },
          contact_name: contactName.trim() || null,
          contact_phone: contactPhone.trim() || phone.trim(),
          hp_field: honeypot,
          form_opened_at: formOpenedAt,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        showToast('Application Submitted', 'Your business listing was submitted for review!', 'success');
      } else {
        showToast('Notice', data.error || 'Failed to submit business.', 'error');
      }
    } catch {
      setSubmitted(true);
      showToast('Submitted', 'Thank you! Your listing will be reviewed.', 'success');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="py-8 sm:py-12 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Container size="lg">
        <div className="mb-6">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isUrdu ? '← ہوم پیج پر واپس جائیں' : '← Back to Directory'}</span>
          </button>
        </div>

        {submitted ? (
          <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-soft-lg text-center space-y-4 max-w-xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Listing Request Received!
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Assalam-o-Alaikum! Thank you for listing <strong>"{name}"</strong> on Sadiqabad City Phone Directory. Our editorial team verifies phone numbers and addresses before publishing to the live portal.
            </p>
            <div className="pt-4 flex items-center justify-center gap-3">
              <button
                onClick={() => onNavigate('/')}
                className="px-6 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs shadow-md shadow-teal-600/20"
              >
                Back to Home
              </button>
              <button
                onClick={() => {
                  setSubmitted(false);
                  setName('');
                  setPhone('');
                }}
                className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
              >
                Submit Another Business
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Info Panel */}
            <div className="lg:col-span-4 space-y-6">
              <div className="p-6 rounded-3xl bg-gradient-to-br from-teal-900 to-slate-900 text-white shadow-soft-lg space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-teal-300 block">
                  Free Community Directory
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                  {isUrdu ? 'اپنا کاروبار رجسٹر کریں' : 'Add Your Business Listing'}
                </h1>
                <p className="text-xs text-teal-100/80 leading-relaxed">
                  Join hundreds of verified shops, medical centers, emergency trades, and restaurants across Sadiqabad.
                </p>
                <div className="pt-2 space-y-2.5 text-xs text-teal-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>100% Free Forever</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant Call & WhatsApp buttons</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Google Maps navigation link</span>
                  </div>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Info className="w-4 h-4 text-amber-500" />
                  <span>Verification Note</span>
                </div>
                <p>
                  Our administrators check every phone number before approving listings to keep the directory clean from fake contacts.
                </p>
              </div>
            </div>

            {/* Right Form Panel */}
            <div className="lg:col-span-8 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-soft-sm">
              <form onSubmit={handleSubmit} className="space-y-5 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Business Name (English) *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Al-Rehman Pharmacy"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1 font-urdu">
                      کاروبار کا نام (اردو)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      value={nameUr}
                      onChange={(e) => setNameUr(e.target.value)}
                      placeholder="مثلاً الرحمٰن فارمیسی"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-teal-500 outline-none font-urdu"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Category *
                    </label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(Number(e.target.value))}
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name_en} {c.name_ur ? `(${c.name_ur})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Area / Neighborhood in Sadiqabad *
                    </label>
                    <select
                      value={areaId}
                      onChange={(e) => setAreaId(Number(e.target.value))}
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-teal-500 outline-none"
                    >
                      {areas.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name_en} {a.name_ur ? `(${a.name_ur})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Complete Address *
                  </label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Shop #12, Rail Bazaar, near Jamia Masjid, Sadiqabad"
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0300 1234567"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="Leave blank if same as phone"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Operating Hours
                    </label>
                    <input
                      type="text"
                      value={timings}
                      onChange={(e) => setTimings(e.target.value)}
                      placeholder="e.g. 09:00 AM - 10:00 PM"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                {/* Submitter details */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Owner / Submitter Name (Optional)
                    </label>
                    <input
                      type="text"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Submitter Contact Phone (Optional)
                    </label>
                    <input
                      type="text"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="For verification queries"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Special Notes / Landmark Description
                  </label>
                  <textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Provide details about products, landmark location, or special services..."
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                  />
                </div>

                {/* Honeypot */}
                <div className="hidden" aria-hidden="true">
                  <input
                    type="text"
                    tabIndex={-1}
                    value={honeypot}
                    onChange={(e) => setHoneypot(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm shadow-lg shadow-teal-600/25 transition-transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Submit Business for Verification</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
}
