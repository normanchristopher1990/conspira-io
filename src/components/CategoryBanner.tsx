import { getCategory } from '../lib/categories';
import type { CategorySlug } from '../lib/types';

type Props = { category: CategorySlug };

export default function CategoryBanner({ category }: Props) {
  const cat = getCategory(category);
  return (
    <div
      className="h-[52px] w-full relative overflow-hidden"
      style={{
        background: `linear-gradient(110deg, ${cat.hue} 0%, ${cat.hue}CC 60%, #185FA5 140%)`,
      }}
      aria-hidden
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.45) 0, transparent 35%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.25) 0, transparent 40%)',
        }}
      />
      <div className="relative h-full flex items-center px-4">
        <span className="font-mono-num text-[11px] uppercase tracking-[0.18em] text-white/95">
          {cat.label}
        </span>
      </div>
    </div>
  );
}
