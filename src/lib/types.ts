export type CategorySlug =
  | 'politics-government'
  | 'science-technology'
  | 'health-medicine'
  | 'military-intelligence'
  | 'surveillance-privacy'
  | 'economy-finance'
  | 'history-archaeology'
  | 'astronomy-space'
  | 'energy-environment'
  | 'media-propaganda'
  | 'secret-societies'
  | 'ufo-extraterrestrial'
  | 'pharma-vaccines'
  | 'religion-ancient';

export type Category = {
  slug: CategorySlug;
  label: string;
  hue: string;
};

export type TheoryStatus = 'draft' | 'pending_ai' | 'pending_admin' | 'accepted' | 'rejected';

export type Theory = {
  id: string;
  title: string;        // canonical original — what the submitter typed
  summary: string;
  titleEn?: string | null;   // Claude-translated English version
  titleDe?: string | null;   // Claude-translated German version
  summaryEn?: string | null;
  summaryDe?: string | null;
  category: CategorySlug;
  score: number; // 1..9
  evidenceCount: number;
  independentSources: number;
  viewCount?: number;
  youtubeId: string | null;
  status: TheoryStatus;
  submittedBy: string;
  submittedAt: string; // ISO
};

export type SortKey = 'newest' | 'highest' | 'lowest' | 'most-evidence';

export type EvidenceType =
  | 'reproducible-experiment'
  | 'peer-reviewed-paper'
  | 'witness-with-risk'
  | 'witness-without-risk'
  | 'government-document'
  | 'declassified-military'
  | 'video-with-metadata'
  | 'verified-image'
  | 'video-without-metadata'
  | 'unverified';

export type EvidenceScore = 0 | 1 | 2 | 3 | 4 | 5;

export type Evidence = {
  id: string;
  theoryId: string;
  type: EvidenceType;
  title: string;
  source: string;
  url: string;
  storagePath?: string | null;
  description: string;
  score: EvidenceScore;
  submittedBy: string;
  submittedAt: string; // ISO
};
