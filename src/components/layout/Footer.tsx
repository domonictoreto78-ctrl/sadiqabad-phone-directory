import { useLanguage } from '@/src/lib/i18n';
import { Container } from '../ui/Container';
import { STATIC_CATEGORIES, STATIC_AREAS, EMERGENCY_CONTACTS } from '@/src/lib/categories';
import { Phone, MapPin, Heart, ShieldCheck, PlusCircle, PhoneCall } from 'lucide-react';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const { t, isUrdu } = useLanguage();

  const handleLinkClick = (path: string, e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <footer className="w-full bg-slate-900 text-slate-300 border-t border-slate-800 pt-16 pb-24 md:pb-16 mt-20">
      <Container size="xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-8 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-teal-500 to-teal-400 text-slate-950 font-extrabold text-lg flex items-center justify-center shadow-lg shadow-teal-500/20">
                SQB
              </div>
              <div>
                <h3 className="text-white font-bold text-lg tracking-tight">
                  Sadiqabad City Directory
                </h3>
                <p className="text-xs text-teal-400 font-medium">
                  {isUrdu ? 'صادق آباد کا مستند بزنس پورٹل' : 'Tehsil Sadiqabad • Rahim Yar Khan'}
                </p>
              </div>
            </div>

            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              {t.footerTagline}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                100% Verified Numbers
              </span>
              <span className="flex items-center gap-1.5 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <MapPin className="w-4 h-4 text-amber-400" />
                Sadiqabad, Punjab
              </span>
            </div>

            {/* Quick Submit CTA */}
            <div className="pt-2">
              <a
                href="/submit"
                onClick={(e) => handleLinkClick('/submit', e)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-teal-600/30 hover:bg-teal-600 text-teal-300 hover:text-white border border-teal-500/40 text-xs font-bold transition-all"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isUrdu ? 'اپنا کاروبار رجسٹر کریں' : 'Add Your Business Listing'}</span>
              </a>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              {isUrdu ? 'اہم کیٹیگریز' : 'Top Categories'}
            </h4>
            <ul className="space-y-2 text-sm">
              {STATIC_CATEGORIES.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <a
                    href={`/categories/${cat.slug}`}
                    onClick={(e) => handleLinkClick(`/categories/${cat.slug}`, e)}
                    className="hover:text-teal-400 transition-colors flex items-center justify-between"
                  >
                    <span>{isUrdu ? cat.name_ur : cat.name_en}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Areas & Information */}
          <div>
            <h4 className="text-white font-semibold text-sm uppercase tracking-wider mb-4">
              {isUrdu ? 'معلومات و رہنما' : 'Directory Info'}
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="/about"
                  onClick={(e) => handleLinkClick('/about', e)}
                  className="hover:text-teal-400 transition-colors"
                >
                  {isUrdu ? 'ہمارے بارے میں' : 'About Directory'}
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => handleLinkClick('/contact', e)}
                  className="hover:text-teal-400 transition-colors"
                >
                  {isUrdu ? 'رابطہ کریں' : 'Contact Support'}
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => handleLinkClick('/privacy', e)}
                  className="hover:text-teal-400 transition-colors"
                >
                  {isUrdu ? 'رازداری کی پالیسی' : 'Privacy Policy'}
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  onClick={(e) => handleLinkClick('/terms', e)}
                  className="hover:text-teal-400 transition-colors"
                >
                  {isUrdu ? 'شرائط و ضوابط' : 'Terms of Service'}
                </a>
              </li>
              <li>
                <a
                  href="/disclaimer"
                  onClick={(e) => handleLinkClick('/disclaimer', e)}
                  className="hover:text-teal-400 transition-colors"
                >
                  {isUrdu ? 'معلومات کی درستگی' : 'Data Disclaimer'}
                </a>
              </li>
            </ul>
          </div>

          {/* Emergency Helplines */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-white font-semibold text-sm uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4 animate-pulse" />
                <span>{t.emergencyServices}</span>
              </h4>
            </div>
            <ul className="space-y-2.5 text-sm">
              {EMERGENCY_CONTACTS.map((contact) => (
                <li key={contact.id} className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 truncate pr-2">
                    {isUrdu ? contact.name_ur : contact.name_en}
                  </span>
                  <a
                    href={`tel:${contact.number}`}
                    className="font-mono font-bold text-xs px-2.5 py-1 rounded-md bg-rose-950/60 text-rose-300 border border-rose-900 hover:bg-rose-900 transition-colors shrink-0"
                  >
                    {contact.number}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-4 pt-3 border-t border-slate-800">
              <a
                href="/emergency"
                onClick={(e) => handleLinkClick('/emergency', e)}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors block"
              >
                {isUrdu ? 'تمام ایمرجنسی نمبرز دیکھیں →' : 'All 24/7 Helplines →'}
              </a>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-3">
            <p>
              © {new Date().getFullYear()} Sadiqabad Directory. {t.footerRights}
            </p>
            <span>•</span>
            <a
              href="#/admin"
              onClick={(e) => handleLinkClick('/admin', e)}
              className="text-slate-400 hover:text-teal-400 font-semibold transition-colors flex items-center gap-1"
            >
              <span>Admin Portal</span>
            </a>
          </div>
          <div className="flex items-center gap-1 text-slate-400">
            <span>Built with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline mx-0.5" />
            <span>for the citizens of Sadiqabad City</span>
          </div>
        </div>
      </Container>
    </footer>
  );
}
