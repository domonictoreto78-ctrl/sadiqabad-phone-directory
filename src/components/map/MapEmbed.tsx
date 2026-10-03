interface MapEmbedProps {
  latitude: number;
  longitude: number;
  title: string;
  zoom?: number;
  height?: string;
  className?: string;
}

export function MapEmbed({
  latitude,
  longitude,
  title,
  zoom = 15,
  height = '350px',
  className = '',
}: MapEmbedProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  // Use API key if available, otherwise use open Google Maps embed URL
  const embedUrl = apiKey
    ? `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitude},${longitude}&zoom=${zoom}`
    : `https://maps.google.com/maps?q=${latitude},${longitude}&hl=en&z=${zoom}&output=embed`;

  return (
    <div
      className={`relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 shadow-soft-sm ${className}`}
      style={{ height }}
    >
      <iframe
        title={`Map of ${title}`}
        width="100%"
        height="100%"
        style={{ border: 0 }}
        loading="lazy"
        allowFullScreen
        referrerPolicy="no-referrer-when-downgrade"
        src={embedUrl}
      />
      {/* External Map Link Overlay */}
      <div className="absolute bottom-2 right-2 z-10">
        <a
          href={`https://maps.google.com/?q=${latitude},${longitude}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-800 shadow-sm hover:text-teal-600 transition-colors"
        >
          Open in Google Maps ↗
        </a>
      </div>
    </div>
  );
}
