// Data layer: tries Supabase if configured, falls back to mock data otherwise.
// Each function returns the same shape regardless of source so callers don't care.

import { supabase } from './supabase';
import {
  MOCK_THEORIES,
  getEvidenceFor,
} from './mockData';
import type {
  Evidence,
  EvidenceScore,
  EvidenceType,
  Theory,
  CategorySlug,
} from './types';

// ---------- Row → domain mappers ----------

type TheoryRow = {
  id: string;
  title: string;
  summary: string;
  category_slug: CategorySlug;
  youtube_id: string | null;
  status: 'draft' | 'pending_ai' | 'pending_admin' | 'accepted' | 'rejected';
  score: number;
  evidence_count: number;
  independent_sources: number;
  submitted_by: string;
  created_at: string;
};

type EvidenceRow = {
  id: string;
  theory_id: string;
  type: EvidenceType;
  title: string;
  source: string;
  url: string | null;
  storage_path: string | null;
  description: string;
  score: EvidenceScore;
  submitted_by: string;
  created_at: string;
};

type ProfileRow = { id: string; username: string };

function rowToTheory(row: TheoryRow, usernamesById: Map<string, string>): Theory {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    category: row.category_slug,
    youtubeId: row.youtube_id,
    status: row.status,
    score: row.score,
    evidenceCount: row.evidence_count,
    independentSources: row.independent_sources,
    submittedBy: usernamesById.get(row.submitted_by) ?? 'unknown',
    submittedAt: row.created_at,
  };
}

function rowToEvidence(row: EvidenceRow, usernamesById: Map<string, string>): Evidence {
  return {
    id: row.id,
    theoryId: row.theory_id,
    type: row.type,
    title: row.title,
    source: row.source,
    url: row.url ?? '',
    storagePath: row.storage_path,
    description: row.description,
    score: row.score,
    submittedBy: usernamesById.get(row.submitted_by) ?? 'unknown',
    submittedAt: row.created_at,
  };
}

async function fetchUsernames(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!supabase || ids.length === 0) return map;
  const unique = Array.from(new Set(ids));
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username')
    .in('id', unique);
  if (error || !data) return map;
  for (const row of data as ProfileRow[]) map.set(row.id, row.username);
  return map;
}

// ---------- Public API ----------

export async function listTheories(): Promise<Theory[]> {
  if (!supabase) return MOCK_THEORIES;

  const { data, error } = await supabase
    .from('theories')
    .select('*')
    .eq('status', 'accepted')
    .order('created_at', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as TheoryRow[];
  const usernames = await fetchUsernames(rows.map((r) => r.submitted_by));
  return rows.map((r) => rowToTheory(r, usernames));
}

export type SortKeyApi = 'newest' | 'highest' | 'lowest' | 'most-evidence';
export type Page<T> = { items: T[]; total: number; hasMore: boolean };

export async function listTheoriesPage(opts: {
  category?: CategorySlug;
  sort?: SortKeyApi;
  offset?: number;
  limit?: number;
}): Promise<Page<Theory>> {
  const { category, sort = 'newest', offset = 0, limit = 20 } = opts;

  if (!supabase) {
    let items = MOCK_THEORIES.slice();
    if (category) items = items.filter((t) => t.category === category);
    items = sortMockTheories(items, sort);
    const total = items.length;
    const sliced = items.slice(offset, offset + limit);
    return { items: sliced, total, hasMore: offset + sliced.length < total };
  }

  let q = supabase
    .from('theories')
    .select('*', { count: 'exact' })
    .eq('status', 'accepted');
  if (category) q = q.eq('category_slug', category);

  switch (sort) {
    case 'highest':
      q = q.order('score', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'lowest':
      q = q.order('score', { ascending: true }).order('created_at', { ascending: false });
      break;
    case 'most-evidence':
      q = q.order('evidence_count', { ascending: false }).order('created_at', { ascending: false });
      break;
    case 'newest':
    default:
      q = q.order('created_at', { ascending: false });
  }
  q = q.range(offset, offset + limit - 1);

  const { data, error, count } = await q;
  if (error) throw error;
  const rows = (data ?? []) as TheoryRow[];
  const usernames = await fetchUsernames(rows.map((r) => r.submitted_by));
  const items = rows.map((r) => rowToTheory(r, usernames));
  const total = count ?? items.length;
  return { items, total, hasMore: offset + items.length < total };
}

function sortMockTheories(items: Theory[], key: SortKeyApi): Theory[] {
  const copy = [...items];
  switch (key) {
    case 'newest':
      return copy.sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
    case 'highest':
      return copy.sort((a, b) => b.score - a.score);
    case 'lowest':
      return copy.sort((a, b) => a.score - b.score);
    case 'most-evidence':
      return copy.sort((a, b) => b.evidenceCount - a.evidenceCount);
  }
}

// ---------- Search ----------

export async function searchTheories(q: string, limit = 30): Promise<Theory[]> {
  if (!q.trim()) return [];
  if (!supabase) {
    const needle = q.trim().toLowerCase();
    return MOCK_THEORIES.filter(
      (t) =>
        t.title.toLowerCase().includes(needle) ||
        t.summary.toLowerCase().includes(needle),
    ).slice(0, limit);
  }

  // Postgres `websearch_to_tsquery` takes natural-language queries
  // ("nasa OR moon", quoted phrases, exclusions). RLS limits results to
  // accepted theories.
  const { data, error } = await supabase
    .from('theories')
    .select('*')
    .textSearch('search_tsv', q.trim(), { type: 'websearch' })
    .limit(limit);
  if (error) throw error;
  const rows = (data ?? []) as TheoryRow[];
  const usernames = await fetchUsernames(rows.map((r) => r.submitted_by));
  return rows.map((r) => rowToTheory(r, usernames));
}

export async function getTheory(id: string): Promise<Theory | null> {
  if (!supabase) return MOCK_THEORIES.find((t) => t.id === id) ?? null;

  const { data, error } = await supabase
    .from('theories')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  const row = data as TheoryRow;
  const usernames = await fetchUsernames([row.submitted_by]);
  return rowToTheory(row, usernames);
}

export async function listEvidence(theoryId: string): Promise<Evidence[]> {
  if (!supabase) return getEvidenceFor(theoryId);

  const { data, error } = await supabase
    .from('evidence')
    .select('*')
    .eq('theory_id', theoryId)
    .order('score', { ascending: false });

  if (error) throw error;
  const rows = (data ?? []) as EvidenceRow[];
  const usernames = await fetchUsernames(rows.map((r) => r.submitted_by));
  return rows.map((r) => rowToEvidence(r, usernames));
}

// ---------- Admin queue ----------

export async function listPendingTheories(): Promise<Theory[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('theories')
    .select('*')
    .in('status', ['pending_ai', 'pending_admin'])
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as TheoryRow[];
  const usernames = await fetchUsernames(rows.map((r) => r.submitted_by));
  return rows.map((r) => rowToTheory(r, usernames));
}

export async function setTheoryStatus(
  id: string,
  status: 'accepted' | 'rejected',
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('theories').update({ status }).eq('id', id);
  if (error) throw error;
}

// ---------- Owner edit / delete ----------

export type TheoryUpdate = {
  title?: string;
  summary?: string;
  category_slug?: CategorySlug;
  youtube_id?: string | null;
};

export async function updateTheory(id: string, patch: TheoryUpdate): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('theories').update(patch).eq('id', id);
  if (error) throw error;
}

export async function deleteTheory(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('theories').delete().eq('id', id);
  if (error) throw error;
}

// ---------- Submission ----------

export type EvidenceInsert = {
  type: EvidenceType;
  title: string;
  source: string;
  url: string | null;
  storage_path?: string | null;
  description: string;
  involvement: Record<string, unknown>;
};

export type TheoryInsert = {
  title: string;
  summary: string;
  category_slug: CategorySlug;
  youtube_id: string | null;
};

export async function submitTheory(
  userId: string,
  theory: TheoryInsert,
  evidence: EvidenceInsert[],
): Promise<{ id: string }> {
  if (!supabase) throw new Error('Supabase not configured');

  const { data: t, error: tErr } = await supabase
    .from('theories')
    .insert({ ...theory, submitted_by: userId, status: 'pending_ai' })
    .select('id')
    .single();
  if (tErr || !t) throw tErr ?? new Error('Insert failed');

  if (evidence.length > 0) {
    const rows = evidence.map((e) => ({
      ...e,
      theory_id: t.id,
      submitted_by: userId,
    }));
    const { error: eErr } = await supabase.from('evidence').insert(rows);
    if (eErr) throw eErr;
  }

  // Fire the AI review in the background. Failure here doesn't block
  // submission — admins can re-trigger it from the queue.
  void supabase.functions
    .invoke('review-submission', { body: { theory_id: t.id } })
    .catch(() => {
      /* swallow — review is best-effort */
    });

  return { id: t.id as string };
}

// ---------- Profiles ----------

export type PublicProfile = {
  id: string;
  username: string;
  real_name: string | null;
  expert_level: 'none' | 'self_declared' | 'plausible' | 'probable' | 'verified';
  expert_field?: string | null;
  expert_note?: string | null;
  badges: string[];
  rank: 'rekrut' | 'soldat' | 'korporal' | 'sergeant' | 'leutnant' | 'hauptmann' | 'major' | 'oberst' | 'general';
  accepted_count: number;
  is_admin?: boolean;
  created_at: string;
};

export type ProfileUpdate = {
  username?: string;
  real_name?: string | null;
  expert_field?: string | null;
  expert_note?: string | null;
  badges?: string[];
};

export async function updateMyProfile(userId: string, patch: ProfileUpdate): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId);
  if (error) throw error;
}

export async function listAllProfiles(): Promise<PublicProfile[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, real_name, expert_level, expert_field, expert_note, badges, rank, accepted_count, is_admin, created_at')
    .order('is_admin', { ascending: false, nullsFirst: false })
    .order('accepted_count', { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as PublicProfile[];
}

export async function setUserAdmin(userId: string, isAdmin: boolean): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('profiles').update({ is_admin: isAdmin }).eq('id', userId);
  if (error) throw error;
}

export async function getProfileByUsername(username: string): Promise<PublicProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, real_name, expert_level, expert_field, expert_note, badges, rank, accepted_count, is_admin, created_at')
    .eq('username', username)
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicProfile;
}

export async function getProfileById(id: string): Promise<PublicProfile | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, real_name, expert_level, expert_field, expert_note, badges, rank, accepted_count, is_admin, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error || !data) return null;
  return data as PublicProfile;
}

export async function listTheoriesByUser(userId: string): Promise<Theory[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('theories')
    .select('*')
    .eq('submitted_by', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as TheoryRow[];
  const usernames = await fetchUsernames(rows.map((r) => r.submitted_by));
  return rows.map((r) => rowToTheory(r, usernames));
}

// ---------- AI review ----------

export type AiReview = {
  suggested_score: number;
  thematic: 'supporting' | 'contradicting' | 'mixed' | 'neutral';
  thematic_analysis: string;
  reasoning: string;
  evidence_concerns: { evidence_id: string; concern: string }[];
  model: string;
  reviewed_at: string;
};

export async function getAiReview(theoryId: string): Promise<AiReview | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('theories')
    .select('ai_review')
    .eq('id', theoryId)
    .maybeSingle();
  if (error || !data) return null;
  return (data.ai_review as AiReview | null) ?? null;
}

export async function triggerReview(theoryId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.functions.invoke('review-submission', {
    body: { theory_id: theoryId },
  });
  if (error) throw error;
}

// ---------- Add evidence to existing theory ----------

export async function addEvidence(
  userId: string,
  theoryId: string,
  evidence: EvidenceInsert,
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('evidence').insert({
    ...evidence,
    theory_id: theoryId,
    submitted_by: userId,
  });
  if (error) throw error;

  // Re-run the AI review to incorporate the new piece (best-effort).
  void supabase.functions
    .invoke('review-submission', { body: { theory_id: theoryId } })
    .catch(() => {});
}

// ---------- Takedowns ----------

export type TakedownStatus = 'received' | 'declined' | 'accepted';

export type Takedown = {
  id: string;
  theory_id: string | null;
  evidence_id: string | null;
  requester_name: string | null;
  requester_org: string | null;
  legal_basis: string | null;
  status: TakedownStatus;
  notes: string | null;
  created_at: string;
};

export type TakedownInsert = {
  theory_id?: string | null;
  evidence_id?: string | null;
  requester_name?: string;
  requester_org?: string;
  legal_basis?: string;
};

export async function submitTakedown(req: TakedownInsert): Promise<{ id: string }> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('takedown_requests')
    .insert({
      theory_id: req.theory_id ?? null,
      evidence_id: req.evidence_id ?? null,
      requester_name: req.requester_name ?? null,
      requester_org: req.requester_org ?? null,
      legal_basis: req.legal_basis ?? null,
    })
    .select('id')
    .single();
  if (error || !data) throw error ?? new Error('Insert failed');
  return { id: data.id as string };
}

export async function listTakedownsPublic(): Promise<Takedown[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('takedowns_public')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Takedown[];
}

export async function listTakedownsAdmin(): Promise<Takedown[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('takedown_requests')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as Takedown[];
}

export async function setTakedownStatus(
  id: string,
  status: TakedownStatus,
  notes?: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('takedown_requests')
    .update({ status, notes: notes ?? null })
    .eq('id', id);
  if (error) throw error;
}
