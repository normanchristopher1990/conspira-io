import { Link } from 'react-router-dom';
import { categoryImageUrl } from '../lib/categories';
import type { Category } from '../lib/types';

type Props = {
  category: Category;
  count: number;
  countLabel: string;
};

// Full-width banner card used on the new HomePage grid. Black header bar
// with category name + count, then a 3:1 image below. The image fills via
// object-fit: cover so 16:9 sources still look right (top/bottom cropped).
export default function CategoryBannerCard({ category, count, countLabel }: Props) {
  return (
    <Link
      to={`/category/${category.slug}`}
      className="block rounded-xl overflow-hidden ring-1 ring-line bg-white hover:ring-slate-300 transition-shadow shadow-card"
    >
      <div
        className="bg-gradient-to-br from-brand to-brand-700 px-4 py-2.5 flex items-center justify-between gap-4"
      >
        <span className="text-sm sm:text-base font-semibold tracking-tight text-white">
          {category.label}
        </span>
        <span className="text-xs font-mono-num text-white/70 inline-flex items-center gap-1.5 shrink-0">
          <span>{count} {countLabel}</span>
          <span aria-hidden>→</span>
        </span>
      </div>
      <div
        className="relative w-full"
        style={{ aspectRatio: '3 / 1', backgroundColor: category.hue }}
      >
        <img
          src={categoryImageUrl(category)}
          alt=""
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => {
            // If image is missing, fall back to the category hue (already set
            // as backgroundColor on the parent) by hiding the broken image.
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      </div>
    </Link>
  );
}
