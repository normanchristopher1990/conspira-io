import type { Lang } from './i18n';
import type { Theory } from './types';

// Picks the language-specific title/summary off a theory, falling back
// to the canonical original whenever the translated field is missing —
// e.g. while the translate-theory edge function is still running, or
// when a theory was created before translation was enabled.
export function localizeTheory(
  theory: Theory,
  lang: Lang,
): { title: string; summary: string } {
  if (lang === 'de') {
    return {
      title: theory.titleDe || theory.title,
      summary: theory.summaryDe || theory.summary,
    };
  }
  return {
    title: theory.titleEn || theory.title,
    summary: theory.summaryEn || theory.summary,
  };
}
