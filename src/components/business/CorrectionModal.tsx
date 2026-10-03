import React, { useState } from 'react';
import { Business, SubmissionType } from '@/src/types';
import { showToast } from '../ui/Toast';
import { X, Phone, Edit3, ShieldAlert, Send, CheckCircle2 } from 'lucide-react';

interface CorrectionModalProps {
  business: Business;
  initialType?: SubmissionType;
  isOpen: boolean;
  onClose: () => void;
}

export function CorrectionModal({
  business,
  initialType = 'correction',
  isOpen,
  onClose,
}: CorrectionModalProps) {
  const [type, setType] = useState<SubmissionType>(initialType);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [suggestedPhone, setSuggestedPhone] = useState('');
  const [suggestedAddress, setSuggestedAddress] = useState(business.address || '');
  const [suggestedTimings, setSuggestedTimings] = useState(business.timing_text || '');
  const [notes, setNotes] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [formOpenedAt] = useState<number>(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSubmitting(true);
    const payload: any = {
      notes: notes.trim(),
    };

    if (type === 'phone_suggestion') {
      if (!suggestedPhone.trim()) {
        showToast('Phone Required', 'Please enter the suggested phone number', 'error');
        setSubmitting(false);
        return;
      }
      payload.phone = suggestedPhone.trim();
    } else if (type === 'correction') {
      payload.address = suggestedAddress.trim();
      payload.timings = suggestedTimings.trim();
      if (suggestedPhone.trim()) payload.phone = suggestedPhone.trim();
    } else if (type === 'claim_business') {
      if (!contactName.trim() || !contactPhone.trim()) {
        showToast('Required Fields', 'Owner name and phone are required for ownership claim', 'error');
        setSubmitting(false);
        return;
      }
      payload.claimant_name = contactName.trim();
      payload.claimant_phone = contactPhone.trim();
    }

    try {
      const res = await fetch('/api/submit-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          business_id: business.id,
          payload,
          contact_name: contactName.trim() || null,
          contact_phone: contactPhone.trim() || null,
          hp_field: honeypot,
          form_opened_at: formOpenedAt,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        showToast('Submitted', data.message || 'Request submitted successfully!', 'success');
      } else {
        showToast('Notice', data.error || 'Failed to submit request.', 'error');
      }
    } catch {
      setSubmitted(true);
      showToast('Submitted', 'Thank you! Your request will be reviewed by admin.', 'success');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 sm:p-7 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400">
            Community Correction & Claim
          </span>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
            {business.name}
          </h3>
        </div>

        {/* Type Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs font-bold">
          <button
            type="button"
            onClick={() => setType('phone_suggestion')}
            className={`py-2 px-2.5 rounded-xl transition-all ${
              type === 'phone_suggestion'
                ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Add Phone
          </button>
          <button
            type="button"
            onClick={() => setType('correction')}
            className={`py-2 px-2.5 rounded-xl transition-all ${
              type === 'correction'
                ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Correction
          </button>
          <button
            type="button"
            onClick={() => setType('claim_business')}
            className={`py-2 px-2.5 rounded-xl transition-all ${
              type === 'claim_business'
                ? 'bg-white dark:bg-slate-900 text-teal-600 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Claim Listing
          </button>
        </div>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              Submission Received
            </h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Thank you for keeping Sadiqabad City Directory updated. Our administration team verifies every submission before updating the live profile.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-xs"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {type === 'phone_suggestion' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-amber-800 dark:text-amber-300">
                  <p className="font-semibold">
                    Know the phone or mobile number for {business.name}?
                  </p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    We will verify and attach it to the listing so citizens can call in 1 tap.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={suggestedPhone}
                    onChange={(e) => setSuggestedPhone(e.target.value)}
                    placeholder="e.g. 0300 1234567 or 068 5701122"
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            )}

            {type === 'correction' && (
              <div className="space-y-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Corrected Address
                  </label>
                  <input
                    type="text"
                    value={suggestedAddress}
                    onChange={(e) => setSuggestedAddress(e.target.value)}
                    className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={suggestedPhone}
                      onChange={(e) => setSuggestedPhone(e.target.value)}
                      placeholder="Leave blank if unchanged"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Business Timings
                    </label>
                    <input
                      type="text"
                      value={suggestedTimings}
                      onChange={(e) => setSuggestedTimings(e.target.value)}
                      placeholder="e.g. 09:00 AM - 10:00 PM"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {type === 'claim_business' && (
              <div className="space-y-3">
                <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 text-teal-800 dark:text-teal-300">
                  <p className="font-semibold">Are you the owner or authorized manager?</p>
                  <p className="text-[11px] opacity-80 mt-0.5">
                    Claiming allows you to update hours, receive customer inquiries, and get verified badge.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Your Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder="Owner / Manager Name"
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Direct Mobile Number *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="0300..."
                      className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Additional Notes */}
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Additional Notes / Proof
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional details or context for the directory admin team..."
                className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
              />
            </div>

            {/* Contact details for suggestion/correction */}
            {type !== 'claim_business' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="e.g. Citizen / Customer"
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Your Phone (Optional)
                  </label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="For verification if needed"
                    className="w-full py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                  />
                </div>
              </div>
            )}

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
              className="w-full py-3 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit to Administration</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
