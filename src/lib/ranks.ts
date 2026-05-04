// Rank progression — cosmic theme. Auto-derived (lower 6) from
// accepted_count + expert_level; admin-assigned (upper 4) stored on
// profiles.rank.

export type RankSlug =
  | 'zd-27'
  | 'orbit'
  | 'triad'
  | 'cosmos'
  | 'astral'
  | 'stellar'
  | 'ultra'
  | 'luna'
  | 'cosmic'
  | 'majestic';

export type Rank = {
  slug: RankSlug;
  label: string;
  style: 'grey' | 'white' | 'coloured' | 'glow' | 'glow-anim';
  notes: string;
};

export const RANKS: Record<RankSlug, Rank> = {
  'zd-27':   { slug: 'zd-27',   label: 'ZD-27',    style: 'grey',     notes: 'Starting rank' },
  orbit:     { slug: 'orbit',   label: 'ORBIT',    style: 'grey',     notes: 'First submission accepted' },
  triad:     { slug: 'triad',   label: 'TRIAD',    style: 'white',    notes: '3+ accepted theories' },
  cosmos:    { slug: 'cosmos',  label: 'COSMOS',   style: 'white',    notes: '10+ accepted theories' },
  astral:    { slug: 'astral',  label: 'ASTRAL',   style: 'coloured', notes: 'Verified expert / 20+ accepted' },
  stellar:   { slug: 'stellar', label: 'STELLAR',  style: 'coloured', notes: '50+ accepted, strong contributor' },
  ultra:     { slug: 'ultra',   label: 'ULTRA',    style: 'glow',     notes: 'Top tier — elite researcher' },
  luna:      { slug: 'luna',    label: 'LUNA',     style: 'glow',     notes: 'Highly trusted contributor' },
  cosmic:    { slug: 'cosmic',  label: 'COSMIC',   style: 'glow-anim',notes: 'Exceptional contributor' },
  majestic:  { slug: 'majestic',label: 'MAJESTIC', style: 'glow-anim',notes: 'Top contributor on the platform' },
};

export type ExpertLevel =
  | 'none'
  | 'self_declared'
  | 'plausible'
  | 'probable'
  | 'verified';

export function deriveRank(
  acceptedCount: number,
  expertLevel: ExpertLevel,
  storedRank: RankSlug,
): Rank {
  // Admin-assigned tiers always win — never demote a ULTRA+ user.
  const seniorTiers: RankSlug[] = ['ultra', 'luna', 'cosmic', 'majestic'];
  if (seniorTiers.includes(storedRank)) return RANKS[storedRank];

  if (expertLevel === 'verified') return RANKS.astral;
  if (acceptedCount >= 50) return RANKS.stellar;
  if (acceptedCount >= 20) return RANKS.astral;
  if (acceptedCount >= 10) return RANKS.cosmos;
  if (acceptedCount >= 3)  return RANKS.triad;
  if (acceptedCount >= 1)  return RANKS.orbit;
  return RANKS['zd-27'];
}

export function rankBadgeClasses(style: Rank['style']): string {
  switch (style) {
    case 'grey':
      return 'bg-slate-100 text-slate-600 ring-slate-200';
    case 'white':
      return 'bg-white text-slate-700 ring-slate-300';
    case 'coloured':
      return 'bg-brand/10 text-brand ring-brand/30';
    case 'glow':
      return 'bg-brand text-white ring-brand shadow-[0_0_12px_rgba(24,95,165,0.45)]';
    case 'glow-anim':
      return 'bg-brand text-white ring-brand shadow-[0_0_18px_rgba(24,95,165,0.65)] animate-pulse';
  }
}

// Expert domain badges from the concept doc (emoji + label).
export const EXPERT_BADGES: Record<string, { emoji: string; label: string }> = {
  medicine:    { emoji: '⚕️', label: 'Medicine' },
  science:     { emoji: '🔬', label: 'Science / Research' },
  chemistry:   { emoji: '🧪', label: 'Chemistry' },
  physics:     { emoji: '⚛️', label: 'Physics' },
  biology:     { emoji: '🌿', label: 'Biology' },
  law:         { emoji: '⚖️', label: 'Law' },
  aviation:    { emoji: '✈️', label: 'Aviation / Pilot' },
  military:    { emoji: '🎖️', label: 'Military' },
  intelligence:{ emoji: '🕵️', label: 'Intelligence' },
  engineering: { emoji: '⚙️', label: 'Engineering' },
  economics:   { emoji: '📊', label: 'Economics' },
  psychology:  { emoji: '🧠', label: 'Psychology' },
  journalism:  { emoji: '📰', label: 'Journalism' },
  astronomy:   { emoji: '🔭', label: 'Astronomy' },
};
