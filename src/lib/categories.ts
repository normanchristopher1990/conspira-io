import type { Category, CategorySlug } from './types';

export const CATEGORIES: Category[] = [
  { slug: 'politics-government',     label: 'Politics & Government',         hue: '#1F4E8A' },
  { slug: 'science-technology',      label: 'Science & Technology',          hue: '#0E7490' },
  { slug: 'health-medicine',         label: 'Health & Medicine',             hue: '#0F766E' },
  { slug: 'military-intelligence',   label: 'Military & Intelligence',       hue: '#3F3F46' },
  { slug: 'surveillance-privacy',    label: 'Surveillance & Privacy',        hue: '#4338CA' },
  { slug: 'economy-finance',         label: 'Economy & Finance',             hue: '#B45309' },
  { slug: 'history-archaeology',     label: 'History & Archaeology',         hue: '#92400E' },
  { slug: 'astronomy-space',         label: 'Astronomy & Space',             hue: '#1E1B4B' },
  { slug: 'energy-environment',      label: 'Energy & Environment',          hue: '#15803D' },
  { slug: 'media-propaganda',        label: 'Media & Propaganda',            hue: '#9F1239' },
  { slug: 'secret-societies',        label: 'Secret Societies',              hue: '#581C87' },
  { slug: 'ufo-extraterrestrial',    label: 'UFO & Extraterrestrial',        hue: '#155E75' },
  { slug: 'pharma-vaccines',         label: 'Pharma & Vaccines',             hue: '#0369A1' },
  { slug: 'religion-ancient',        label: 'Religion & Ancient Civilisations', hue: '#7C2D12' },
];

const BY_SLUG: Record<CategorySlug, Category> = Object.fromEntries(
  CATEGORIES.map((c) => [c.slug, c]),
) as Record<CategorySlug, Category>;

export function getCategory(slug: CategorySlug): Category {
  return BY_SLUG[slug];
}
