import type { UploadedFile } from '../../lib/storage';
import type { CategorySlug, EvidenceType, Stance } from '../../lib/types';

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
  stance: Stance;
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
    stance: 'supporting',
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

// Validation returns a key into t.submit.validation so the wizard
// page can show it in the active language.
export type ValidationKey =
  | 'titleMin'
  | 'categoryRequired'
  | 'summaryMin'
  | 'summaryMax'
  | 'evidenceMin'
  | 'evidenceTypeMissing'
  | 'evidenceTitleMissing'
  | 'evidenceSourceMissing'
  | 'evidenceDescriptionMin'
  | 'evidenceLinkOrFile'
  | 'displayNameMin';

export function validateBasics(s: WizardState['basics']): ValidationKey | null {
  if (s.title.trim().length < 6) return 'titleMin';
  if (!s.category) return 'categoryRequired';
  if (s.summary.trim().length < 30) return 'summaryMin';
  if (s.summary.length > SUMMARY_MAX) return 'summaryMax';
  return null;
}

export function validateEvidence(items: EvidenceDraft[]): ValidationKey | null {
  if (items.length === 0) return 'evidenceMin';
  for (const e of items) {
    if (!e.type) return 'evidenceTypeMissing';
    if (e.title.trim().length < 4) return 'evidenceTitleMissing';
    if (!e.source.trim()) return 'evidenceSourceMissing';
    if (e.description.trim().length < 20) return 'evidenceDescriptionMin';
    if (!e.url.trim() && !e.uploadedFile) return 'evidenceLinkOrFile';
  }
  return null;
}

export function validateAuthor(a: WizardState['author']): ValidationKey | null {
  if (a.displayName.trim().length < 3) return 'displayNameMin';
  return null;
}
