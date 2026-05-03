import type { EvidenceScore, EvidenceType } from './types';

type Meta = {
  label: string;
  short: string;
  ceiling: EvidenceScore;
  reason: string;
};

export const EVIDENCE_TYPE_META: Record<EvidenceType, Meta> = {
  'reproducible-experiment': {
    label: 'Reproducible experiment',
    short: 'Experiment',
    ceiling: 5,
    reason: 'Independently verifiable and reproducible',
  },
  'peer-reviewed-paper': {
    label: 'Peer-reviewed scientific paper',
    short: 'Paper',
    ceiling: 4,
    reason: 'Can be falsified or funded — not always reproducible',
  },
  'witness-with-risk': {
    label: 'Witness — verified, with career or legal risk',
    short: 'Witness (risk)',
    ceiling: 4,
    reason: 'High credibility due to personal cost of disclosure',
  },
  'witness-without-risk': {
    label: 'Witness — verified, no risk declared',
    short: 'Witness',
    ceiling: 3,
    reason: 'No personal stake — lower inherent credibility',
  },
  'government-document': {
    label: 'Verified government document',
    short: 'Gov. doc',
    ceiling: 3,
    reason: 'May be released strategically',
  },
  'declassified-military': {
    label: 'Declassified military document',
    short: 'Military doc',
    ceiling: 3,
    reason: 'Risk of propaganda or disinformation motive',
  },
  'video-with-metadata': {
    label: 'Video with intact metadata',
    short: 'Video (meta)',
    ceiling: 3,
    reason: 'Verifiable origin but not reproducible',
  },
  'verified-image': {
    label: 'Verified photo or image',
    short: 'Image',
    ceiling: 3,
    reason: 'Visual evidence with confirmed provenance',
  },
  'video-without-metadata': {
    label: 'Video without metadata',
    short: 'Video',
    ceiling: 2,
    reason: 'Cannot verify origin or authenticity',
  },
  unverified: {
    label: 'Unverified',
    short: 'Unverified',
    ceiling: 0,
    reason: 'Archived only — not scored, no impact',
  },
};

export function evidenceColor(score: EvidenceScore): string {
  if (score === 0) return '#94A3B8';
  if (score <= 2) return '#C0392B';
  if (score === 3) return '#9CA3AF';
  return '#1F8A4C';
}
