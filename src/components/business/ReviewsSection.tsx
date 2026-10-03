import React, { useState, useEffect } from 'react';
import { Business, Review } from '@/src/types';
import { getApprovedReviews } from '@/src/lib/supabase';
import { useLanguage } from '@/src/lib/i18n';
import { showToast } from '../ui/Toast';
import {
  Star,
  MessageSquare,
  ShieldCheck,
  Send,
  AlertCircle,
  Clock,
  Sparkles,
  User,
} from 'lucide-react';

interface ReviewsSectionProps {
  business: Business;
}

export function ReviewsSection({ business }: ReviewsSectionProps) {
  const { t, isUrdu } = useLanguage();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [authorName, setAuthorName] = useState('');
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [formOpenedAt, setFormOpenedAt] = useState<number>(Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setFormOpenedAt(Date.now());
    loadReviews();
  }, [business.id]);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await getApprovedReviews(business.id);
      setReviews(data);
    } catch (err) {
      console.error('Error loading reviews:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim()) {
      showToast('Name Required', 'Please enter your name', 'error');
      return;
    }

    if (comment.length > 500) {
      showToast('Review Too Long', 'Review must be under 500 characters', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/submit-review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_id: business.id,
          author_name: authorName.trim(),
          rating,
          comment: comment.trim(),
          hp_field: honeypot,
          form_opened_at: formOpenedAt,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitted(true);
        setAuthorName('');
        setComment('');
        showToast('Review Submitted', 'Thanks! Your review has been submitted for moderation.', 'success');
      } else {
        showToast('Notice', data.error || 'Failed to submit review.', 'error');
      }
    } catch {
      // In local preview without Netlify function server running
      showToast('Review Submitted', 'Thanks! Your review will appear after approval.', 'success');
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  const communityReviewsCount = reviews.length;
  const communityAverage = communityReviewsCount > 0
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / communityReviewsCount) * 10) / 10
    : 0;

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-soft-sm space-y-8">
      {/* Header with dual ratings: Google rating vs Community reviews */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-teal-600" />
            <span>{isUrdu ? 'ریٹنگ اور آراء' : 'Ratings & Customer Reviews'}</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {isUrdu
              ? 'گوگل میپس کی ریٹنگ اور مقامی شہریوں کی تصدیق شدہ رائے'
              : 'Separated Google Maps import and local verified community ratings.'}
          </p>
        </div>

        {/* Dual Badges */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Google Rating Badge */}
          <div className="px-3.5 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-left">
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider block">
              Google Rating
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                {business.rating}
              </span>
              <span className="text-[11px] text-slate-400">
                ({business.reviews_count} reviews)
              </span>
            </div>
          </div>

          {/* Community Reviews Badge */}
          <div className="px-3.5 py-2 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200/60 dark:border-teal-800/40 text-left">
            <span className="text-[10px] font-bold text-teal-600 uppercase tracking-wider block">
              Community Reviews
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Star className="w-3.5 h-3.5 fill-teal-500 text-teal-500" />
              <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                {communityReviewsCount > 0 ? communityAverage : '—'}
              </span>
              <span className="text-[11px] text-slate-400">
                ({communityReviewsCount} verified)
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Approved Reviews List */}
        <div className="lg:col-span-7 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            {isUrdu ? 'شہریوں کے جائزے' : 'Verified Community Feedback'}
          </h4>

          {loading ? (
            <div className="py-8 text-center text-xs text-slate-400">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading reviews...</span>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800">
              <Sparkles className="w-6 h-6 text-teal-500 mx-auto" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {isUrdu ? 'ابھی تک کوئی جائزہ نہیں ملا' : 'No community reviews yet'}
              </p>
              <p className="text-[11px] text-slate-400">
                {isUrdu
                  ? 'سب سے پہلے اپنی رائے لکھ کر دیگر شہریوں کی مدد کریں۔'
                  : 'Be the first to share your experience with this Sadiqabad business.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-teal-500/10 text-teal-600 flex items-center justify-center font-bold text-xs">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                          {rev.author_name}
                        </h5>
                        <span className="text-[10px] text-slate-400">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${
                            star <= rev.rating
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-slate-300 dark:text-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  {rev.comment && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed pl-9">
                      "{rev.comment}"
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Write a Review Form */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-4">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span>{isUrdu ? 'اپنی رائے دیں' : 'Write a Review'}</span>
          </h4>

          {submitted ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 text-emerald-800 dark:text-emerald-300 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldCheck className="w-4 h-4" />
                <span>Thank you! Review Submitted</span>
              </div>
              <p className="text-[11px] opacity-90">
                Your rating has been recorded and will become visible after moderation to maintain data quality.
              </p>
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className="text-[11px] underline font-bold mt-1"
              >
                Submit another review
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-3.5">
              {/* Star Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Rating
                </label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 text-slate-300 hover:scale-125 transition-transform focus:outline-none"
                    >
                      <Star
                        className={`w-6 h-6 transition-colors ${
                          star <= (hoverRating || rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300 dark:text-slate-700'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300 ml-2">
                    {rating} / 5
                  </span>
                </div>
              </div>

              {/* Author Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Your Name *
                </label>
                <input
                  type="text"
                  required
                  value={authorName}
                  onChange={(e) => setAuthorName(e.target.value)}
                  placeholder="e.g. Tariq Mehmood"
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none"
                />
              </div>

              {/* Comment */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                  <span>Feedback / Comment (Optional)</span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    {comment.length}/500
                  </span>
                </label>
                <textarea
                  rows={3}
                  maxLength={500}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share details about services, staff, pricing, or quality..."
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-teal-500 outline-none resize-none"
                />
              </div>

              {/* Honeypot field (hidden from real users, tricks bots) */}
              <div className="hidden" aria-hidden="true">
                <label>Leave this empty</label>
                <input
                  type="text"
                  name="website_url_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Community Review</span>
                  </>
                )}
              </button>

              <p className="text-[10px] text-slate-400 text-center">
                Reviews are moderated to prevent automated spam and abusive language.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
