import { STATIC_PAGES } from '@/src/data/staticPagesContent';
import { useLanguage } from '@/src/lib/i18n';
import { Container } from '../ui/Container';
import { generateCallUrl, generateWhatsAppUrl } from '@/src/lib/phone';
import {
  Info,
  Shield,
  FileText,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  AlertTriangle,
  ArrowLeft,
} from 'lucide-react';

interface StaticPageViewProps {
  pageType: 'about' | 'contact' | 'privacy' | 'terms' | 'disclaimer';
  onNavigate: (path: string) => void;
}

export function StaticPageView({ pageType, onNavigate }: StaticPageViewProps) {
  const { isUrdu } = useLanguage();

  return (
    <div className="py-10 sm:py-16 bg-slate-50 dark:bg-slate-950 min-h-screen">
      <Container size="md">
        <div className="mb-6">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-teal-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isUrdu ? '← ہوم پیج پر واپس جائیں' : '← Back to Home'}</span>
          </button>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-10 shadow-soft-sm space-y-8">
          {/* ABOUT PAGE */}
          {pageType === 'about' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600">
                  <Info className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {isUrdu ? STATIC_PAGES.about.titleUr : STATIC_PAGES.about.titleEn}
                  </h1>
                  <span className="text-xs text-slate-400">
                    Directory Edition: {STATIC_PAGES.about.lastUpdated}
                  </span>
                </div>
              </div>

              <div className="space-y-6 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {STATIC_PAGES.about.sections.map((sec, idx) => (
                  <div key={idx} className="space-y-2">
                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {isUrdu ? sec.headingUr : sec.headingEn}
                    </h2>
                    <p>{isUrdu ? sec.contentUr : sec.contentEn}</p>
                  </div>
                ))}
              </div>

              {/* Data Disclaimer Box */}
              <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-800 dark:text-amber-300 text-xs">
                  <AlertTriangle className="w-4 h-4" />
                  <span>{isUrdu ? STATIC_PAGES.disclaimer.titleUr : STATIC_PAGES.disclaimer.titleEn}</span>
                </div>
                <p className="text-xs text-amber-900/80 dark:text-amber-200/80 leading-relaxed">
                  {isUrdu ? STATIC_PAGES.disclaimer.contentUr : STATIC_PAGES.disclaimer.contentEn}
                </p>
              </div>
            </div>
          )}

          {/* CONTACT PAGE */}
          {pageType === 'contact' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {isUrdu ? STATIC_PAGES.contact.titleUr : STATIC_PAGES.contact.titleEn}
                  </h1>
                  <span className="text-xs text-slate-400">
                    Sadiqabad, District Rahim Yar Khan
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-teal-600 font-bold text-xs">
                    <Mail className="w-4 h-4" />
                    <span>Email Inquiries</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {STATIC_PAGES.contact.email}
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center gap-2 text-teal-600 font-bold text-xs">
                    <Phone className="w-4 h-4" />
                    <span>Direct Helpline</span>
                  </div>
                  <a
                    href={generateCallUrl(STATIC_PAGES.contact.phone)}
                    className="text-sm font-semibold text-teal-600 hover:underline block"
                  >
                    {STATIC_PAGES.contact.phone}
                  </a>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                    <MessageCircle className="w-4 h-4" />
                    <span>WhatsApp Verification Support</span>
                  </div>
                  <a
                    href={generateWhatsAppUrl(STATIC_PAGES.contact.whatsapp, 'Sadiqabad Directory Query')}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat on WhatsApp</span>
                  </a>
                </div>

                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-2 text-teal-600 font-bold text-xs">
                    <MapPin className="w-4 h-4" />
                    <span>Municipal Location</span>
                  </div>
                  <p className="text-xs text-slate-700 dark:text-slate-300">
                    {isUrdu ? STATIC_PAGES.contact.addressUr : STATIC_PAGES.contact.addressEn}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY POLICY */}
          {pageType === 'privacy' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {isUrdu ? STATIC_PAGES.privacy.titleUr : STATIC_PAGES.privacy.titleEn}
                  </h1>
                  <span className="text-xs text-slate-400">
                    Effective: {STATIC_PAGES.privacy.lastUpdated}
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>{isUrdu ? STATIC_PAGES.privacy.contentUr : STATIC_PAGES.privacy.contentEn}</p>
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs space-y-2">
                  <h3 className="font-bold text-slate-900 dark:text-white">Core Privacy Commitments:</h3>
                  <ul className="list-disc pl-5 space-y-1 text-slate-500 dark:text-slate-400">
                    <li>Zero personal cookie tracking or advertising profiling.</li>
                    <li>Browser Do-Not-Track headers are fully honored.</li>
                    <li>Calls and WhatsApp chats occur directly via your device without intermediary recording.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TERMS OF SERVICE */}
          {pageType === 'terms' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {isUrdu ? STATIC_PAGES.terms.titleUr : STATIC_PAGES.terms.titleEn}
                  </h1>
                  <span className="text-xs text-slate-400">
                    Effective: {STATIC_PAGES.terms.lastUpdated}
                  </span>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>{isUrdu ? STATIC_PAGES.terms.contentUr : STATIC_PAGES.terms.contentEn}</p>
              </div>
            </div>
          )}

          {/* DATA DISCLAIMER */}
          {pageType === 'disclaimer' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    {isUrdu ? STATIC_PAGES.disclaimer.titleUr : STATIC_PAGES.disclaimer.titleEn}
                  </h1>
                </div>
              </div>

              <div className="space-y-4 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <p>{isUrdu ? STATIC_PAGES.disclaimer.contentUr : STATIC_PAGES.disclaimer.contentEn}</p>
                <div className="pt-4">
                  <button
                    onClick={() => onNavigate('/contact')}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 text-white font-bold text-xs"
                  >
                    Report an Inaccuracy
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
