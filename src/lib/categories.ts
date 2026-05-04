import type { Category, CategorySlug } from './types';

export const CATEGORIES: Category[] = [
  { slug: 'politics-government',     label: 'Politics & Government',             hue: '#1F4E8A', imageFile: 'politics.jpg' },
  { slug: 'science-technology',      label: 'Science & Technology',              hue: '#0E7490', imageFile: 'science.jpg' },
  { slug: 'health-medicine',         label: 'Health & Medicine',                 hue: '#0F766E', imageFile: 'health.jpg' },
  { slug: 'military-intelligence',   label: 'Military & Intelligence',           hue: '#3F3F46', imageFile: 'military.jpg' },
  { slug: 'surveillance-privacy',    label: 'Surveillance & Privacy',            hue: '#4338CA', imageFile: 'surveillance.jpg' },
  { slug: 'economy-finance',         label: 'Economy & Finance',                 hue: '#B45309', imageFile: 'economy.jpg' },
  { slug: 'history-archaeology',     label: 'History & Archaeology',             hue: '#92400E', imageFile: 'history.jpg' },
  { slug: 'astronomy-space',         label: 'Astronomy & Space',                 hue: '#1E1B4B', imageFile: 'space.jpg' },
  { slug: 'energy-environment',      label: 'Energy & Environment',              hue: '#15803D', imageFile: 'energy.jpg' },
  { slug: 'media-propaganda',        label: 'Media & Propaganda',                hue: '#9F1239', imageFile: 'media.jpg' },
  { slug: 'secret-societies',        label: 'Secret Societies',                  hue: '#581C87', imageFile: 'societies.jpg' },
  { slug: 'ufo-extraterrestrial',    label: 'UFO & Extraterrestrial',            hue: '#155E75', imageFile: 'ufo.jpg' },
  { slug: 'pharma-vaccines',         label: 'Pharma & Vaccines',                 hue: '#0369A1', imageFile: 'pharma.jpg' },
  { slug: 'religion-ancient',        label: 'Religion & Ancient Civilisations',  hue: '#7C2D12', imageFile: 'religion.jpg' },
];

export function categoryImageUrl(category: Category): string {
  return `/category-images/${category.imageFile}`;
}

const BY_SLUG: Record<CategorySlug, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<CategorySlug, Category>;

export function getCategory(slug: CategorySlug): Category {
  return BY_SLUG[slug];
}
