/**
 * Configurable SPA Routing helper (Hash mode vs History mode)
 * Controlled via import.meta.env.VITE_ROUTER_MODE ('hash' | 'history')
 * Default is 'hash' for reliable iframe & AI Studio preview compatibility.
 */

export const ROUTER_MODE: 'hash' | 'history' =
  (import.meta.env.VITE_ROUTER_MODE as any) === 'history' ? 'history' : 'hash';

export function getCurrentRoutePath(): string {
  if (typeof window === 'undefined') return '/';

  if (ROUTER_MODE === 'history') {
    // If user arrived with a hash link, seamlessly migrate to history path
    if (window.location.hash.startsWith('#/')) {
      const hashPath = window.location.hash.slice(1);
      window.history.replaceState(null, '', hashPath);
      return hashPath;
    }
    return window.location.pathname || '/';
  }

  // Hash mode
  const hash = window.location.hash;
  if (!hash || !hash.startsWith('#/')) {
    return '/';
  }
  return hash.slice(1); // remove '#'
}

export function navigate(path: string) {
  if (typeof window === 'undefined') return;

  const normalized = path.startsWith('/') ? path : `/${path}`;

  if (ROUTER_MODE === 'history') {
    if (window.location.pathname !== normalized) {
      window.history.pushState(null, '', normalized);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  } else {
    const targetHash = `#${normalized}`;
    if (window.location.hash !== targetHash) {
      window.location.hash = targetHash;
    }
  }
}
