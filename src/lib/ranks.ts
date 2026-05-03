// Rank progression — derived client-side from accepted_count + expert_level.
// Higher tiers (hauptmann+) are admin-assigned via profiles.rank.

export type RankSlug =
  | 'rekrut'
  | 'soldat'
  | 'korporal'
  | 'sergeant'
  | 'leutnant'
  | 'hauptmann'
  | 'major'
  | 'oberst'
  | 'general';

export type Rank = {
  slug: RankSlug;
  label: string;
  style: 'grey' | 'white' | 'coloured' | 'glow' | 'glow-anim';
  notes: string;
};

export const RANKS: Record<RankSlug, Rank> = {
  rekrut:    { slug: 'rekrut',    label: 'Rekrut',    style: 'grey',     notes: 'Starting rank' },
  soldat:    { slug: 'soldat',    label: 'Soldat',    style: 'grey',     notes: 'First submission accepted' },
  korporal:  { slug: 'korporal',  label: 'Korporal',  style: 'white',    notes: '3+ accepted theories' },
  sergeant:  { slug: 'sergeant',  label: 'Sergeant',  style: 'white',    notes: '10+ accepted theories' },
  leutnant:  { slug: 'leutnant',  label: 'Leutnant',  style: 'coloured', notes: 'Verified expert / 20+ accepted' },
  hauptmann: { slug: 'hauptmann', label: 'Hauptmann', style: 'coloured', notes: 'Strong contributor with verified evidence' },
  major:     { slug: 'major',     label: 'Major',     style: 'glow',     notes: 'Top tier — elite researcher' },
  oberst:    { slug: 'oberst',    label: 'Oberst',    style: 'glow',     notes: 'Highly trusted contributor' },
  general:   { slug: 'general',   label: 'General',   style: 'glow-anim',notes: 'Top contributor on the platform' },
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
  // Admin-assigned tiers always win — never demote a hauptmann+ user.
  const seniorTiers: RankSlug[] = ['hauptmann', 'major', 'oberst', 'general'];
  if (seniorTiers.includes(storedRank)) return RANKS[storedRank];

  if (expertLevel === 'verified') return RANKS.leutnant;
  if (acceptedCount >= 20) return RANKS.leutnant;
  if (acceptedCount >= 10) return RANKS.sergeant;
  if (acceptedCount >= 3)  return RANKS.korporal;
  if (acceptedCount >= 1)  return RANKS.soldat;
  return RANKS.rekrut;
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
