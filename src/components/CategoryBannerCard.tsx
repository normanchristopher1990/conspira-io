import { Link } from 'react-router-dom';
import { categoryImageUrl } from '../lib/categories';
import type { Category } from '../lib/types';

type Props = {
  category: Category;
  count: number;
  countLabel: string;
};

// Netflix-style category card: full-bleed image with a dark gradient
// overlay at the bottom and the category name + count layered on top.
// Used in a 2-column grid on desktop, 1 column on mobile.
export default function CategoryBannerCard({ category, count, countLabel }: Props) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="group relative block aspect-video rounded-xl overflow-hidden shadow-card"
      style={{ backgroundColor: category.hue }}
    >
      <img
        src={categoryImageUrl(category)}
        alt=""
        loading="lazy"
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = 'none';
        }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
      />
      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 flex items-end justify-between gap-3">
        <h3 className="text-base sm:text-lg font-semibold text-white tracking-tight leading-tight">
          {category.label}
        </h3>
        <span className="font-mono-num text-xs text-white/80 shrink-0 inline-flex items-center gap-1">
          <span>{count} {countLabel}</span>
          <span aria-hidden>→</span>
        </span>
      </div>
    </Link>
  );
}
