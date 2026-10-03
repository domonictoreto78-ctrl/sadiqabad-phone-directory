import { BusinessEventType } from '@/src/types';
import { supabase, isSupabaseConfigured } from './supabase';

const SESSION_KEY = 'sqb_anon_sid_v4';

function getSessionId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let sid = sessionStorage.getItem(SESSION_KEY);
    if (!sid) {
      sid = 'sid_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(SESSION_KEY, sid);
    }
    return sid;
  } catch {
    return 'sid_anon';
  }
}

// Queue for fire-and-forget event batching
const eventQueue: {
  business_id: string;
  event_type: BusinessEventType;
  session_id: string;
}[] = [];

let flushTimeout: any = null;

async function flushEvents() {
  if (eventQueue.length === 0) return;
  const batch = [...eventQueue];
  eventQueue.length = 0;

  if (isSupabaseConfigured && supabase) {
    try {
      await supabase.from('business_events').insert(batch);
    } catch {
      // Fire-and-forget; ignore analytics errors silently
    }
  }
}

export function trackBusinessEvent(businessId: string, eventType: BusinessEventType) {
  if (typeof window === 'undefined') return;

  // Respect Do-Not-Track (DNT) header
  if (
    navigator.doNotTrack === '1' ||
    (window as any).doNotTrack === '1' ||
    navigator.doNotTrack === 'yes'
  ) {
    return;
  }

  if (!businessId) return;

  eventQueue.push({
    business_id: businessId,
    event_type: eventType,
    session_id: getSessionId(),
  });

  if (!flushTimeout) {
    flushTimeout = setTimeout(() => {
      flushTimeout = null;
      flushEvents();
    }, 1500); // 1.5s debounce batching
  }
}
