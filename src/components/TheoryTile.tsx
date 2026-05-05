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
  const { title } = localizeTheory(theory, lang);
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
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />

      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/0"
      />

      {/* Star button — top right */}
      <div className="absolute top-2 right-2 z-10">
        <FavoriteButton
          theoryId={theory.id}
          initialFavorited={favorited}
          size="sm"
          onDark
        />
      </div>

      {/* Title — bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
        <h3 className="text-sm sm:text-base font-semibold leading-snug text-white line-clamp-2">
          {title}
        </h3>
        {theory.isSeed && theory.evidenceCount === 0 ? (
          <p className="mt-1 text-[10px] font-mono-num uppercase tracking-wider text-amber-300">
            Open question
          </p>
        ) : (
          <p className="mt-1 text-[10px] font-mono-num text-white/70">
            Score {theory.score}/9 · {theory.evidenceCount} evidence
          </p>
        )}
      </div>
    </article>
  );
}
