import { OpeningHours, WeekDays } from '@/src/types';

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function truncate(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  return text.slice(0, maxLen).trim() + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Calculates whether a business is open right now using Sadiqabad / Pakistan Standard Time (PKT = UTC+5)
 */
export function isOpenNow(opening_hours?: OpeningHours): {
  isOpen: boolean;
  statusTextEn: string;
  statusTextUr: string;
  todaySchedule?: string;
} {
  if (!opening_hours || Object.keys(opening_hours).length === 0) {
    return {
      isOpen: false,
      statusTextEn: 'Hours Not Available',
      statusTextUr: 'اوقات دستیاب نہیں',
    };
  }

  // Use Pakistan Time (UTC+5)
  const now = new Date();
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const pktTime = new Date(utc + (3600000 * 5));

  const days: WeekDays[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const currentDayName = days[pktTime.getDay()];
  const currentHours = pktTime.getHours();
  const currentMinutes = pktTime.getMinutes();
  const currentTimeVal = currentHours * 60 + currentMinutes;

  const todaySchedule = opening_hours[currentDayName];

  if (!todaySchedule || todaySchedule.is_closed) {
    return {
      isOpen: false,
      statusTextEn: 'Closed Today',
      statusTextUr: 'آج بند ہے',
      todaySchedule: 'Closed',
    };
  }

  const { open, close } = todaySchedule;

  // 24/7 check
  if ((open === '00:00' && close === '23:59') || (open === '00:00' && close === '00:00')) {
    return {
      isOpen: true,
      statusTextEn: 'Open 24/7',
      statusTextUr: '24 گھنٹے کھلا ہے',
      todaySchedule: 'Open 24 Hours',
    };
  }

  const [openH, openM] = open.split(':').map(Number);
  const [closeH, closeM] = close.split(':').map(Number);

  const openTimeVal = openH * 60 + (openM || 0);
  let closeTimeVal = closeH * 60 + (closeM || 0);

  // Handle midnight wrap (e.g. 12:00 to 02:00 AM)
  let isOpen = false;
  if (closeTimeVal < openTimeVal) {
    // Closes past midnight
    isOpen = currentTimeVal >= openTimeVal || currentTimeVal < closeTimeVal;
  } else {
    isOpen = currentTimeVal >= openTimeVal && currentTimeVal <= closeTimeVal;
  }

  if (isOpen) {
    return {
      isOpen: true,
      statusTextEn: `Open Now (Closes ${close})`,
      statusTextUr: `ابھی کھلا ہے (${close} تک)`,
      todaySchedule: `${open} - ${close}`,
    };
  }

  return {
    isOpen: false,
    statusTextEn: `Closed (Opens ${open})`,
    statusTextUr: `بند ہے (${open} کھلے گا)`,
    todaySchedule: `${open} - ${close}`,
  };
}

/**
 * Calculates Haversine distance in Kilometers between two coordinates
 */
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
}

export function formatDistance(km?: number): string {
  if (km === undefined || km === null || isNaN(km)) return '';
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  return `${km.toFixed(1)} km`;
}
