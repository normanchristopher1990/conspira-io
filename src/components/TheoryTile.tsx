import { Link } from 'react-router-dom';
import { categoryImageUrl, getCategory } from '../lib/categories';
import { useI18n } from '../lib/i18n';
import { localizeTheory } from '../lib/localize';
import type { Theory } from '../lib/types';
import FavoriteButton from './FavoriteButton';

type Props = {
  theory: Theory;
  favoriteIds?: Set<string>;
};

// Netflix-style theory tile — full-bleed image with title overlay.
// Used on CategoryPage in a grid. The whole tile is clickable; the
// favorite star intercepts its own click.
export default function TheoryTile({ theory, favoriteIds }: Props) {
  const { lang } = useI18n();
  const { title, summary } = localizeTheory(theory, lang);
  const favorited = favoriteIds?.has(theory.id) ?? false;
  const image = theory.imageUrl || categoryImageUrl(getCategory(theory.category));

  return (
    <article className="group relative aspect-video rounded-xl overflow-hidden shadow-card ring-1 ring-line">
      <Link
        to={`/theory/${theory.id}`}
        aria-label={title}
        className="absolute inset-0 z-0"
      />

      <img
        src={image}
        alt=""
        loading="lazy"
        className="pointer-events-none absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />

      {/* Top + bottom dark gradients to keep title/summary readable.
          pointer-events-none so clicks pass through to the Link layer. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/80 to-black/0"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/85 via-black/40 to-black/0"
      />

      {/* Title — top left, non-interactive so card stays clickable */}
      <h3 className="pointer-events-none absolute top-3 left-3 right-12 text-sm sm:text-base font-semibold leading-snug text-white line-clamp-2 drop-shadow">
        {title}
      </h3>

      {/* Star — top right; pointer-events on so it intercepts clicks */}
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton
          theoryId={theory.id}
          initialFavorited={favorited}
          size="sm"
          onDark
        />
      </div>

      {/* Summary — bottom, non-interactive */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        {theory.isSeed && theory.evidenceCount === 0 ? (
          <p className="text-[10px] font-mono-num uppercase tracking-wider text-amber-300 mb-1">
            Open question — awaiting evidence
          </p>
        ) : null}
        <p className="text-xs sm:text-sm text-white/85 leading-snug line-clamp-2">
          {summary}
        </p>
      </div>
    </article>
  );
}
