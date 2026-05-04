// Data layer: tries Supabase if configured, falls back to mock data otherwise.
// Each function returns the same shape regardless of source so callers don't care.

import { supabase } from './supabase';
import {
  MOCK_THEORIES,
  getEvidenceFor,
} from './mockData';
import type {
  CategoryTheoryCount,
  Evidence,
  EvidenceScore,
  EvidenceType,
  Theory,
  CategorySlug,
  TheoryLink,
  TheoryLinkStatus,
  RelatedTheory,
  Topic,
} from './types';

// ---------- Row → domain mappers ----------

type TheoryRow = {
  id: string;
  title: string;
  summary: string;
  title_en: string | null;
  title_de: string | null;
  summary_en: string | null;
  summary_de: string | null;
  category_slug: CategorySlug;
  youtube_id: string | null;
  status: 'draft' | 'pending_ai' | 'pending_admin' | 'accepted' | 'rejected';
  score: number;
  evidence_count: number;
  independent_sources: number;
  view_count: number | null;
  submitted_by: string;
  created_at: string;
  is_seed?: boolean | null;
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
  stance: 'supporting' | 'contradicting';
  submitted_by: string;
  created_at: string;
};

type ProfileRow = { id: string; username: string };

function rowToTheory(row: TheoryRow, usernamesById: Map<string, string>): Theory {
  return {
    id: row.id,
    title: row.title,
    summary: row.summary,
    titleEn: row.title_en,
    titleDe: row.title_de,
    summaryEn: row.summary_en,
    summaryDe: row.summary_de,
    category: row.category_slug,
    youtubeId: row.youtube_id,
    status: row.status,
    score: row.score,
    evidenceCount: row.evidence_count,
    independentSources: row.independent_sources,
    viewCount: row.view_count ?? 0,
    submittedBy: usernamesById.get(row.submitted_by) ?? 'unknown',
    submittedAt: row.created_at,
    isSeed: row.is_seed ?? false,
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
    stance: row.stance,
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
  // On approval, refresh translations in case the theory was edited
  // during review. Best-effort.
  if (status === 'accepted') {
    void supabase.functions
      .invoke('translate-theory', { body: { theory_id: id } })
      .catch(() => {});
  }
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
  stance: 'supporting' | 'contradicting';
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

  // Fire the AI review and translation in parallel — both are
  // best-effort and shouldn't block submission. Admins can re-trigger
  // the review from the queue; translation auto-runs again on approval.
  void supabase.functions
    .invoke('review-submission', { body: { theory_id: t.id } })
    .catch(() => {});
  void supabase.functions
    .invoke('translate-theory', { body: { theory_id: t.id } })
    .catch(() => {});

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
  rank: 'zd-27' | 'orbit' | 'triad' | 'cosmos' | 'astral' | 'stellar' | 'ultra' | 'luna' | 'cosmic' | 'majestic';
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

// ---------- Comments ----------

export type CommentAuthor = {
  id: string;
  username: string;
  rank: PublicProfile['rank'];
  expert_level: PublicProfile['expert_level'];
  badges: string[];
  accepted_count: number;
  is_admin: boolean;
};

export type Comment = {
  id: string;
  theoryId: string;
  body: string;
  createdAt: string;
  author: CommentAuthor;
};

type CommentRow = {
  id: string;
  theory_id: string;
  author_id: string;
  body: string;
  created_at: string;
};

async function fetchAuthors(ids: string[]): Promise<Map<string, CommentAuthor>> {
  const map = new Map<string, CommentAuthor>();
  if (!supabase || ids.length === 0) return map;
  const unique = Array.from(new Set(ids));
  const { data } = await supabase
    .from('profiles')
    .select('id, username, rank, expert_level, badges, accepted_count, is_admin')
    .in('id', unique);
  for (const row of (data ?? []) as CommentAuthor[]) {
    map.set(row.id, row);
  }
  return map;
}

const UNKNOWN_AUTHOR: Omit<CommentAuthor, 'id'> = {
  username: 'unknown',
  rank: 'zd-27',
  expert_level: 'none',
  badges: [],
  accepted_count: 0,
  is_admin: false,
};

export async function listComments(theoryId: string): Promise<Comment[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('theory_id', theoryId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  const rows = (data ?? []) as CommentRow[];
  const authors = await fetchAuthors(rows.map((r) => r.author_id));
  return rows.map((r) => ({
    id: r.id,
    theoryId: r.theory_id,
    body: r.body,
    createdAt: r.created_at,
    author: authors.get(r.author_id) ?? { id: r.author_id, ...UNKNOWN_AUTHOR },
  }));
}

export async function addComment(
  authorId: string,
  theoryId: string,
  body: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const trimmed = body.trim();
  if (trimmed.length === 0) throw new Error('Comment cannot be empty');
  if (trimmed.length > 2000) throw new Error('Comment is too long (max 2000 chars)');
  const { error } = await supabase.from('comments').insert({
    author_id: authorId,
    theory_id: theoryId,
    body: trimmed,
  });
  if (error) throw error;
}

export async function deleteComment(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw error;
}

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

export async function incrementViews(theoryId: string): Promise<void> {
  if (!supabase) return;
  await supabase.rpc('increment_theory_views', { theory_id: theoryId });
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

// =============================================================
// Theory cross-links (containment)
// =============================================================

type TheoryLinkRow = {
  parent_id: string;
  child_id: string;
  status: TheoryLinkStatus;
  requested_by: string;
  decided_by: string | null;
  requested_at: string;
  decided_at: string | null;
  reject_reason: string | null;
};

function rowToLink(row: TheoryLinkRow): TheoryLink {
  return {
    parentId: row.parent_id,
    childId: row.child_id,
    status: row.status,
    requestedBy: row.requested_by,
    decidedBy: row.decided_by,
    requestedAt: row.requested_at,
    decidedAt: row.decided_at,
    rejectReason: row.reject_reason,
  };
}

// Returns approved related theories in both directions, paired with the
// related theory's display data. Used on the public TheoryDetailPage.
export async function getRelatedTheories(theoryId: string): Promise<RelatedTheory[]> {
  if (!supabase) return [];

  // Approved links where this theory is parent (children) OR child (parents).
  const { data: linkRows, error } = await supabase
    .from('theory_links')
    .select('*')
    .or(`parent_id.eq.${theoryId},child_id.eq.${theoryId}`)
    .eq('status', 'approved');
  if (error) throw error;
  const links = (linkRows ?? []) as TheoryLinkRow[];
  if (links.length === 0) return [];

  // Collect the OTHER theory ids and fetch them in one batch.
  const otherIds = links.map((l) =>
    l.parent_id === theoryId ? l.child_id : l.parent_id,
  );
  const { data: theoryRows, error: tErr } = await supabase
    .from('theories')
    .select('*')
    .in('id', otherIds)
    .eq('status', 'accepted');
  if (tErr) throw tErr;
  const rows = (theoryRows ?? []) as TheoryRow[];
  const usernames = await fetchUsernames(rows.map((r) => r.submitted_by));
  const byId = new Map<string, Theory>();
  for (const r of rows) byId.set(r.id, rowToTheory(r, usernames));

  const out: RelatedTheory[] = [];
  for (const l of links) {
    const otherId = l.parent_id === theoryId ? l.child_id : l.parent_id;
    const other = byId.get(otherId);
    if (!other) continue; // hidden theory (rejected, draft) — skip
    out.push({
      link: rowToLink(l),
      theory: other,
      direction: l.parent_id === theoryId ? 'down' : 'up',
    });
  }
  return out;
}

// Returns ALL link rows for one theory (any status) where the user
// owns one side or is admin. Used in EditTheoryPage so the submitter
// can see their own pending requests + approved links + manage them.
export async function getOwnTheoryLinks(theoryId: string): Promise<RelatedTheory[]> {
  if (!supabase) return [];
  const { data: linkRows, error } = await supabase
    .from('theory_links')
    .select('*')
    .or(`parent_id.eq.${theoryId},child_id.eq.${theoryId}`);
  if (error) throw error;
  const links = (linkRows ?? []) as TheoryLinkRow[];
  if (links.length === 0) return [];

  const otherIds = links.map((l) =>
    l.parent_id === theoryId ? l.child_id : l.parent_id,
  );
  const { data: theoryRows, error: tErr } = await supabase
    .from('theories')
    .select('*')
    .in('id', otherIds);
  if (tErr) throw tErr;
  const rows = (theoryRows ?? []) as TheoryRow[];
  const usernames = await fetchUsernames(rows.map((r) => r.submitted_by));
  const byId = new Map<string, Theory>();
  for (const r of rows) byId.set(r.id, rowToTheory(r, usernames));

  return links.flatMap<RelatedTheory>((l) => {
    const otherId = l.parent_id === theoryId ? l.child_id : l.parent_id;
    const other = byId.get(otherId);
    if (!other) return [];
    return [{
      link: rowToLink(l),
      theory: other,
      direction: l.parent_id === theoryId ? 'down' : 'up',
    }];
  });
}

// Admin queue: all pending link requests with both theories' display data.
export type PendingLinkRequest = {
  link: TheoryLink;
  parent: Theory;
  child: Theory;
  requesterUsername: string;
};

export async function listPendingLinkRequestsAdmin(): Promise<PendingLinkRequest[]> {
  if (!supabase) return [];
  const { data: linkRows, error } = await supabase
    .from('theory_links')
    .select('*')
    .eq('status', 'pending')
    .order('requested_at', { ascending: false });
  if (error) throw error;
  const links = (linkRows ?? []) as TheoryLinkRow[];
  if (links.length === 0) return [];

  const theoryIds = Array.from(
    new Set(links.flatMap((l) => [l.parent_id, l.child_id])),
  );
  const { data: theoryRows, error: tErr } = await supabase
    .from('theories')
    .select('*')
    .in('id', theoryIds);
  if (tErr) throw tErr;
  const rows = (theoryRows ?? []) as TheoryRow[];

  const submitterIds = rows.map((r) => r.submitted_by);
  const requesterIds = links.map((l) => l.requested_by);
  const usernames = await fetchUsernames([...submitterIds, ...requesterIds]);

  const byId = new Map<string, Theory>();
  for (const r of rows) byId.set(r.id, rowToTheory(r, usernames));

  return links.flatMap<PendingLinkRequest>((l) => {
    const parent = byId.get(l.parent_id);
    const child = byId.get(l.child_id);
    if (!parent || !child) return [];
    return [{
      link: rowToLink(l),
      parent,
      child,
      requesterUsername: usernames.get(l.requested_by) ?? 'unknown',
    }];
  });
}

// Insert a new link request. Auto-approve trigger handles same-submitter case.
export async function requestTheoryLink(
  parentId: string,
  childId: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  if (parentId === childId) throw new Error('Cannot link a theory to itself');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  const { error } = await supabase
    .from('theory_links')
    .insert({
      parent_id: parentId,
      child_id: childId,
      requested_by: user.id,
    });
  if (error) throw error;
}

// Submitter cancels their own pending request, or admin deletes any link.
export async function deleteTheoryLink(
  parentId: string,
  childId: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase
    .from('theory_links')
    .delete()
    .eq('parent_id', parentId)
    .eq('child_id', childId);
  if (error) throw error;
}

// Admin approve / reject a pending request.
export async function decideTheoryLink(
  parentId: string,
  childId: string,
  decision: 'approved' | 'rejected',
  rejectReason?: string,
): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  const { error } = await supabase
    .from('theory_links')
    .update({
      status: decision,
      decided_by: user.id,
      decided_at: new Date().toISOString(),
      reject_reason: decision === 'rejected' ? (rejectReason ?? null) : null,
    })
    .eq('parent_id', parentId)
    .eq('child_id', childId);
  if (error) throw error;
}

// Title typeahead for the link picker. Excludes the current theory itself
// and any already-linked theories so users don't link the same pair twice.
export async function searchTheoriesByTitle(
  query: string,
  excludeIds: string[] = [],
  limit = 10,
): Promise<Theory[]> {
  if (!supabase) return [];
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  // The .or() filter format uses commas as separators, so a comma in the
  // user's query would break the query. Strip the few characters that
  // would confuse the parser (commas, percent signs, backslashes).
  const safe = trimmed.replace(/[%,\\]/g, ' ');

  let q = supabase
    .from('theories')
    .select('*')
    .eq('status', 'accepted')
    .or(`title.ilike.%${safe}%,title_en.ilike.%${safe}%,title_de.ilike.%${safe}%`)
    .order('score', { ascending: false })
    .limit(limit);

  if (excludeIds.length > 0) {
    q = q.not('id', 'in', `(${excludeIds.join(',')})`);
  }

  const { data, error } = await q;
  if (error) throw error;
  const rows = (data ?? []) as TheoryRow[];
  const usernames = await fetchUsernames(rows.map((r) => r.submitted_by));
  return rows.map((r) => rowToTheory(r, usernames));
}

// =============================================================
// Topics (sub-categories) + Admin Seeding
// =============================================================

type TopicRow = {
  id: string;
  slug: string;
  category_slug: CategorySlug;
  name_en: string;
  name_de: string;
  description_en: string | null;
  description_de: string | null;
  image_path: string | null;
  theory_count: number;
};

function rowToTopic(row: TopicRow): Topic {
  return {
    id: row.id,
    slug: row.slug,
    category: row.category_slug,
    nameEn: row.name_en,
    nameDe: row.name_de,
    descriptionEn: row.description_en,
    descriptionDe: row.description_de,
    imagePath: row.image_path,
    theoryCount: row.theory_count,
  };
}

export async function listTopicsByCategory(category: CategorySlug): Promise<Topic[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .eq('category_slug', category)
    .order('name_en', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as TopicRow[]).map(rowToTopic);
}

export async function listAllTopics(): Promise<Topic[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('topics')
    .select('*')
    .order('category_slug', { ascending: true })
    .order('name_en', { ascending: true });
  if (error) throw error;
  return ((data ?? []) as TopicRow[]).map(rowToTopic);
}

export async function listTheoriesByTopic(topicId: string): Promise<Theory[]> {
  if (!supabase) return [];
  // Two-step: get theory ids from join table, then fetch theories.
  const { data: links, error: linkErr } = await supabase
    .from('theory_topics')
    .select('theory_id')
    .eq('topic_id', topicId);
  if (linkErr) throw linkErr;
  const ids = (links ?? []).map((l: { theory_id: string }) => l.theory_id);
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('theories')
    .select('*')
    .in('id', ids)
    .eq('status', 'accepted')
    .order('score', { ascending: false });
  if (error) throw error;
  const rows = (data ?? []) as TheoryRow[];
  const usernames = await fetchUsernames(rows.map((r) => r.submitted_by));
  return rows.map((r) => rowToTheory(r, usernames));
}

export type TopicInsert = {
  slug: string;
  category: CategorySlug;
  nameEn: string;
  nameDe: string;
  descriptionEn?: string;
  descriptionDe?: string;
  imagePath?: string;
};

export async function createTopic(input: TopicInsert): Promise<{ id: string }> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase
    .from('topics')
    .insert({
      slug: input.slug,
      category_slug: input.category,
      name_en: input.nameEn,
      name_de: input.nameDe,
      description_en: input.descriptionEn ?? null,
      description_de: input.descriptionDe ?? null,
      image_path: input.imagePath ?? null,
    })
    .select('id')
    .single();
  if (error || !data) throw error ?? new Error('Insert failed');
  return { id: data.id as string };
}

export async function updateTopic(id: string, patch: Partial<TopicInsert>): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const row: Record<string, unknown> = {};
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.category !== undefined) row.category_slug = patch.category;
  if (patch.nameEn !== undefined) row.name_en = patch.nameEn;
  if (patch.nameDe !== undefined) row.name_de = patch.nameDe;
  if (patch.descriptionEn !== undefined) row.description_en = patch.descriptionEn || null;
  if (patch.descriptionDe !== undefined) row.description_de = patch.descriptionDe || null;
  if (patch.imagePath !== undefined) row.image_path = patch.imagePath || null;
  const { error } = await supabase.from('topics').update(row).eq('id', id);
  if (error) throw error;
}

export async function deleteTopic(id: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.from('topics').delete().eq('id', id);
  if (error) throw error;
}

export async function setTheoryTopics(theoryId: string, topicIds: string[]): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  // Replace the full set: delete then insert. Wrapped in best-effort
  // (Supabase doesn't expose transactions client-side; the trigger keeps
  // theory_count consistent through both ops).
  const { error: delErr } = await supabase
    .from('theory_topics')
    .delete()
    .eq('theory_id', theoryId);
  if (delErr) throw delErr;
  if (topicIds.length > 0) {
    const rows = topicIds.map((tid) => ({ theory_id: theoryId, topic_id: tid }));
    const { error: insErr } = await supabase.from('theory_topics').insert(rows);
    if (insErr) throw insErr;
  }
}

export async function getTheoryTopicIds(theoryId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('theory_topics')
    .select('topic_id')
    .eq('theory_id', theoryId);
  if (error) throw error;
  return (data ?? []).map((r: { topic_id: string }) => r.topic_id);
}

// Theory counts per category — one row per category with at least one
// accepted theory. Categories with zero accepted theories are absent;
// the UI fills them in as "0".
export async function listCategoryCounts(): Promise<CategoryTheoryCount[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('category_theory_counts')
    .select('*');
  if (error) throw error;
  return ((data ?? []) as { category_slug: CategorySlug; theory_count: number }[])
    .map((r) => ({ category: r.category_slug, count: r.theory_count }));
}

// =============================================================
// Favorites (private bookmarks)
// =============================================================

export async function listMyFavoriteIds(): Promise<Set<string>> {
  if (!supabase) return new Set();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Set();
  const { data, error } = await supabase
    .from('theory_favorites')
    .select('theory_id')
    .eq('user_id', user.id);
  if (error) throw error;
  return new Set((data ?? []).map((r: { theory_id: string }) => r.theory_id));
}

export async function listMyFavoriteTheories(): Promise<Theory[]> {
  if (!supabase) return [];
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Two-step: ids from favorites, then theories. Sort by favorite-time
  // (newest favorites first) by joining manually.
  const { data: favRows, error: favErr } = await supabase
    .from('theory_favorites')
    .select('theory_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (favErr) throw favErr;
  const favs = (favRows ?? []) as { theory_id: string; created_at: string }[];
  if (favs.length === 0) return [];

  const ids = favs.map((f) => f.theory_id);
  const { data, error } = await supabase
    .from('theories')
    .select('*')
    .in('id', ids);
  if (error) throw error;
  const rows = (data ?? []) as TheoryRow[];
  const usernames = await fetchUsernames(rows.map((r) => r.submitted_by));
  const byId = new Map<string, Theory>();
  for (const r of rows) byId.set(r.id, rowToTheory(r, usernames));

  // Preserve the favorite-time ordering.
  const out: Theory[] = [];
  for (const f of favs) {
    const th = byId.get(f.theory_id);
    if (th) out.push(th);
  }
  return out;
}

export async function addFavorite(theoryId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');
  const { error } = await supabase
    .from('theory_favorites')
    .insert({ user_id: user.id, theory_id: theoryId });
  if (error && !error.message.includes('duplicate')) throw error;
}

export async function removeFavorite(theoryId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');
  const { error } = await supabase
    .from('theory_favorites')
    .delete()
    .eq('user_id', user.id)
    .eq('theory_id', theoryId);
  if (error) throw error;
}

// Admin-only: create a "seed" theory that bypasses the evidence
// requirement. The theory is accepted immediately and rendered with an
// "Open question — awaiting evidence" badge until at least one piece
// of evidence is submitted by a regular user.
export type SeedTheoryInsert = {
  title: string;
  summary: string;
  category: CategorySlug;
  youtubeId?: string | null;
  topicIds?: string[];
};

export async function createSeedTheory(input: SeedTheoryInsert): Promise<{ id: string }> {
  if (!supabase) throw new Error('Supabase not configured');
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Sign in required');

  const { data, error } = await supabase
    .from('theories')
    .insert({
      title: input.title,
      summary: input.summary,
      category_slug: input.category,
      youtube_id: input.youtubeId ?? null,
      submitted_by: user.id,
      status: 'accepted',
      score: 5,
      is_seed: true,
    })
    .select('id')
    .single();
  if (error || !data) throw error ?? new Error('Insert failed');

  if (input.topicIds && input.topicIds.length > 0) {
    await setTheoryTopics(data.id as string, input.topicIds);
  }
  return { id: data.id as string };
}
