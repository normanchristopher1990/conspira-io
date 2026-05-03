import type { UploadedFile } from '../../lib/storage';
import type { CategorySlug, EvidenceType } from '../../lib/types';

export type Involvement = {
  directlyInvolved: boolean;
  directlyInvolvedDetail: string;
  insiderKnowledge: boolean;
  insiderKnowledgeDetail: string;
  careerRisk: boolean;
  careerRiskDetail: string;
  licenseRisk: boolean;
  licenseRiskDetail: string;
  legalRisk: boolean;
  legalRiskDetail: string;
};

export const emptyInvolvement: Involvement = {
  directlyInvolved: false,
  directlyInvolvedDetail: '',
  insiderKnowledge: false,
  insiderKnowledgeDetail: '',
  careerRisk: false,
  careerRiskDetail: '',
  licenseRisk: false,
  licenseRiskDetail: '',
  legalRisk: false,
  legalRiskDetail: '',
};

export type EvidenceDraft = {
  id: string;
  type: EvidenceType | '';
  title: string;
  source: string;
  url: string;
  uploadedFile: UploadedFile | null;
  description: string;
  involvement: Involvement;
};

export function emptyEvidence(): EvidenceDraft {
  return {
    id: crypto.randomUUID(),
    type: '',
    title: '',
    source: '',
    url: '',
    uploadedFile: null,
    description: '',
    involvement: { ...emptyInvolvement },
  };
}

export type WizardState = {
  basics: {
    title: string;
    category: CategorySlug | '';
    summary: string;
    youtubeUrl: string;
  };
  evidence: EvidenceDraft[];
  author: {
    displayName: string;
    realName: string;
    expertField: string;
    expertNote: string;
  };
};

export function initialState(): WizardState {
  return {
    basics: { title: '', category: '', summary: '', youtubeUrl: '' },
    evidence: [emptyEvidence()],
    author: { displayName: '', realName: '', expertField: '', expertNote: '' },
  };
}

export const SUMMARY_MAX = 500;

export function validateBasics(s: WizardState['basics']): string | null {
  if (s.title.trim().length < 6) return 'Title must be at least 6 characters.';
  if (!s.category) return 'Please choose a category.';
  if (s.summary.trim().length < 30) return 'Summary should be at least 30 characters.';
  if (s.summary.length > SUMMARY_MAX) return `Summary must be ${SUMMARY_MAX} characters or fewer.`;
  return null;
}

export function validateEvidence(items: EvidenceDraft[]): string | null {
  if (items.length === 0) return 'Add at least one piece of evidence.';
  for (const e of items) {
    if (!e.type) return 'Each evidence item needs a type.';
    if (e.title.trim().length < 4) return 'Each evidence item needs a title.';
    if (!e.source.trim()) return 'Each evidence item needs a source.';
    if (e.description.trim().length < 20)
      return 'Each evidence item needs a description (at least 20 characters).';
    if (!e.url.trim() && !e.uploadedFile)
      return 'Each evidence item needs either a source link or an uploaded file.';
  }
  return null;
}

export function validateAuthor(a: WizardState['author']): string | null {
  if (a.displayName.trim().length < 3) return 'Display name must be at least 3 characters.';
  return null;
}
