import { OpeningHours, WeekDays } from '@/src/types';
import { useLanguage } from '@/src/lib/i18n';
import { isOpenNow } from '@/src/lib/utils';
import { Clock, CheckCircle2, XCircle } from 'lucide-react';

interface TimingsTableProps {
  openingHours?: OpeningHours;
  timingText?: string | null;
}

export function TimingsTable({ openingHours, timingText }: TimingsTableProps) {
  const { t, isUrdu } = useLanguage();
  const status = isOpenNow(openingHours);

  const days: { key: WeekDays; en: string; ur: string }[] = [
    { key: 'monday', en: 'Monday', ur: 'پیر' },
    { key: 'tuesday', en: 'Tuesday', ur: 'منگل' },
    { key: 'wednesday', en: 'Wednesday', ur: 'بدھ' },
    { key: 'thursday', en: 'Thursday', ur: 'جمعرات' },
    { key: 'friday', en: 'Friday', ur: 'جمعہ' },
    { key: 'saturday', en: 'Saturday', ur: 'ہفتہ' },
    { key: 'sunday', en: 'Sunday', ur: 'اتوار' },
  ];

  // Current day index in Sadiqabad (PKT)
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  const pktTime = new Date(utc + 3600000 * 5);
  const dayNames: WeekDays[] = [
    'sunday',
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
  ];
  const todayKey = dayNames[pktTime.getDay()];

  if (!openingHours || Object.keys(openingHours).length === 0) {
    if (timingText) {
      return (
        <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-soft-sm">
          <div className="flex items-center gap-2 mb-2 text-slate-900 dark:text-white font-bold text-sm">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Business Hours & Timings</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">
            {timingText}
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Recorded from Google Maps listing
          </p>
        </div>
      );
    }

    return (
      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 text-slate-500 text-sm">
        Hours information is not specified for this business.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-soft-sm">
      {/* Real-time Status Banner */}
      <div
        className={`px-5 py-3.5 flex items-center justify-between border-b ${
          status.isOpen
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200/60 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
        }`}
      >
        <div className="flex items-center gap-2">
          {status.isOpen ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <XCircle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
          )}
          <span className="font-bold text-sm">
            {isUrdu ? status.statusTextUr : status.statusTextEn}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-semibold opacity-90">
          <Clock className="w-3.5 h-3.5" />
          <span>PKT Standard Time</span>
        </div>
      </div>

      {/* Week Schedule Table */}
      <div className="p-4 sm:p-5 divide-y divide-slate-100 dark:divide-slate-800">
        {days.map((day) => {
          const isToday = day.key === todayKey;
          const schedule = openingHours[day.key];

          let timingLabel = 'Closed';
          let isClosed = true;

          if (schedule && !schedule.is_closed) {
            isClosed = false;
            if (
              (schedule.open === '00:00' && schedule.close === '23:59') ||
              (schedule.open === '00:00' && schedule.close === '00:00')
            ) {
              timingLabel = isUrdu ? '24 گھنٹے کھلا ہے' : 'Open 24 Hours';
            } else {
              timingLabel = `${schedule.open} - ${schedule.close}`;
            }
          } else {
            timingLabel = isUrdu ? 'بند ہے' : 'Closed';
          }

          return (
            <div
              key={day.key}
              className={`flex items-center justify-between py-2.5 px-3 rounded-xl text-sm transition-colors ${
                isToday
                  ? 'bg-teal-50/70 dark:bg-teal-950/40 font-bold text-teal-900 dark:text-teal-200'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <span>{isUrdu ? day.ur : day.en}</span>
                {isToday && (
                  <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-teal-600 text-white font-bold">
                    Today
                  </span>
                )}
              </div>

              <div
                className={`font-mono text-xs sm:text-sm ${
                  isClosed
                    ? 'text-rose-500 font-semibold'
                    : isToday
                    ? 'text-teal-700 dark:text-teal-300'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                {timingLabel}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
