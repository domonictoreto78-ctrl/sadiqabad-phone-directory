import { Business } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import { generateCallUrl, generateWhatsAppUrl, formatDisplayPhone } from '@/src/lib/phone';
import { Phone, MessageCircle, MapPin, Globe, Facebook, Instagram, Mail, Navigation } from 'lucide-react';

interface ContactButtonsProps {
  business: Business;
  isStickyMobile?: boolean;
}

export function ContactButtons({
  business,
  isStickyMobile = false,
}: ContactButtonsProps) {
  const { t } = useLanguage();
  const hasPhone = Boolean(business.phone && business.phone.trim().length >= 5);

  const callUrl = hasPhone ? generateCallUrl(business.phone!) : '#';
  const whatsappUrl = hasPhone
    ? generateWhatsAppUrl(business.whatsapp || business.phone!, business.name)
    : '#';
  const directionsUrl =
    business.google_maps_url ||
    `https://www.google.com/maps/dir/?api=1&destination=${business.latitude},${business.longitude}`;

  if (isStickyMobile) {
    return (
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 shadow-2xl flex items-center gap-2">
        {hasPhone ? (
          <>
            <a
              href={callUrl}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-teal-600 text-white font-bold text-sm shadow-md shadow-teal-600/30"
            >
              <Phone className="w-4 h-4" />
              <span>{t.callNow}</span>
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-sm shadow-md shadow-emerald-500/30"
            >
              <MessageCircle className="w-4 h-4" />
              <span>{t.chatWhatsApp}</span>
            </a>
          </>
        ) : (
          <div className="flex-1 text-center text-xs text-slate-400 italic">
            Phone number not available yet
          </div>
        )}

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-200 transition-colors"
          title={t.getDirections}
        >
          <MapPin className="w-5 h-5 text-amber-500" />
        </a>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Primary Action Buttons */}
      {hasPhone ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Call Now */}
          <a
            href={callUrl}
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-700 hover:to-teal-600 text-white font-bold text-sm shadow-lg shadow-teal-500/25 transition-transform active:scale-[0.98]"
          >
            <Phone className="w-4 h-4" />
            <span>{t.callNow}</span>
            <span className="text-xs opacity-80 font-normal">
              ({formatDisplayPhone(business.phone!)})
            </span>
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-500/25 transition-transform active:scale-[0.98]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>{t.chatWhatsApp}</span>
          </a>

          {/* Get Directions */}
          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm border border-slate-200 dark:border-slate-700 transition-colors"
          >
            <Navigation className="w-4 h-4 text-amber-500" />
            <span>{t.getDirections}</span>
          </a>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Phone number not available yet for this listing</span>
          </div>

          <a
            href={directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-md shadow-teal-600/20 transition-all shrink-0"
          >
            <Navigation className="w-4 h-4 text-amber-300" />
            <span>{t.getDirections}</span>
          </a>
        </div>
      )}

      {/* Online & Social Profiles */}
      {(business.website || business.email || business.facebook || business.instagram) && (
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Globe className="w-3.5 h-3.5 text-teal-600" />
              <span>Official Website</span>
            </a>
          )}

          {business.email && (
            <a
              href={`mailto:${business.email}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-teal-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Mail className="w-3.5 h-3.5 text-blue-500" />
              <span>{business.email}</span>
            </a>
          )}

          {business.facebook && (
            <a
              href={business.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-700 dark:text-blue-300 transition-colors"
            >
              <Facebook className="w-3.5 h-3.5 text-blue-600" />
              <span>Facebook</span>
            </a>
          )}

          {business.instagram && (
            <a
              href={business.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-50 dark:bg-pink-950/40 hover:bg-pink-100 text-pink-700 dark:text-pink-300 transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 text-pink-600" />
              <span>Instagram</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
