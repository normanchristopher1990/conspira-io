type Props = {
  videoId: string | null;
  title: string;
};

// Lightweight alternative to embedding an iframe per card — the homepage
// would otherwise mount one player per card and stutter on mobile.
// The whole thumbnail is the link; the play button is purely visual.
export default function YouTubeThumbnail({ videoId, title }: Props) {
  if (!videoId) {
    return (
      <div className="aspect-video w-full rounded-md bg-slate-100 ring-1 ring-line flex items-center justify-center text-xs text-muted">
        No video attached
      </div>
    );
  }

  const watchUrl = `https://youtube.com/watch?v=${videoId}`;
  const thumbUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  const fallbackUrl = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <a
      href={watchUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Watch "${title}" on YouTube (opens in a new tab)`}
      className="group relative block aspect-video w-full overflow-hidden rounded-md bg-black ring-1 ring-line touch-manipulation focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <img
        src={thumbUrl}
        alt=""
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        // YouTube returns a 120×90 grey placeholder when maxresdefault doesn't
        // exist (no error event fires — the request "succeeds"). Detect the
        // placeholder by its known dimensions and swap to hqdefault.
        onLoad={(e) => {
          const img = e.currentTarget;
          if (
            img.naturalWidth === 120 &&
            img.naturalHeight === 90 &&
            !img.src.endsWith('hqdefault.jpg')
          ) {
            img.src = fallbackUrl;
          }
        }}
        onError={(e) => {
          const img = e.currentTarget;
          if (!img.src.endsWith('hqdefault.jpg')) img.src = fallbackUrl;
        }}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />

      {/* Soft bottom gradient so the play button always stands out
          against bright thumbnails too. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/0 to-black/0"
      />

      {/* Play button — purely decorative; the whole tile is the click target. */}
      <span
        aria-hidden
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 inline-flex items-center justify-center h-11 w-16 sm:h-14 sm:w-20 rounded-xl bg-[#FF0000]/90 shadow-lg transition-all duration-150 group-hover:scale-105 group-hover:bg-[#FF0000] group-active:scale-95"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6 translate-x-[1px] fill-white">
          <path d="M8 5v14l11-7z" />
        </svg>
      </span>
    </a>
  );
}
