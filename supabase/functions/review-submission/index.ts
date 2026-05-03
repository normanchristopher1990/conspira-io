// Supabase Edge Function: review-submission
//
// Triggered by the client right after a theory is submitted. Loads the theory
// + evidence with the service-role key, asks Claude Sonnet 4.6 to score and
// analyse it, writes the structured review back to theories.ai_review, and
// flips status pending_ai → pending_admin.
//
// Body: { theory_id: string }
// Auth: requires the caller's JWT (so only signed-in users can trigger).

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

// --- Scoring rubric (kept stable so the cache hits across submissions) ----
const SCORING_RUBRIC = `You are the automated first-pass reviewer for Conspira.io, a scientific
catalogue of conspiracy theories. Your job is to score the *weight of evidence*
behind a theory using the platform's published rubric — never to argue
political viewpoints or generate prose for the public site.

THEORY SCORE — integer 1..9
  1-2: Almost certainly false (contradicted by reproducible, independent evidence)
  3-4: Likely false
  5  : Undetermined / equal probability
  6-7: Likely true
  8-9: Almost certainly true (supported by reproducible, independent evidence
       AND no credible contradicting evidence)

EVIDENCE SCORE CEILINGS (each item is independently scored 0..5)
  reproducible-experiment    max 5  (only type that can be independently reproduced)
  peer-reviewed-paper        max 4
  witness-with-risk          max 4  (verified, with career/legal/licence cost)
  witness-without-risk       max 3
  government-document        max 3  (may be released strategically)
  declassified-military      max 3  (high disinfo risk)
  video-with-metadata        max 3  (verifiable origin, not reproducible)
  verified-image             max 3
  video-without-metadata     max 2
  unverified                 max 0  (archived only, no impact on theory score)

WEIGHTING (informational — informs your score, you do not need to compute it
exactly):
  • Highest evidence score    50% weight
  • Average of all scores     30% weight
  • Independence bonus        20% weight
      +1 for 2-3 independent sources
      +2 for 4-6 independent sources
      +3 for 7+ independent sources

NEUTRAL EVIDENCE THEMATIC ANALYSIS
  Pieces scored 3 are neutral on their own. If multiple 3s thematically point
  the same direction (all support or all contradict the claim), nudge the
  theory score in that direction. Report this in the 'thematic' field:
    supporting   : 3s lean toward the theory being true
    contradicting: 3s lean toward the theory being false
    mixed        : no clear directional alignment
    neutral      : insufficient neutral evidence to call

QUALITY FLAGS — surface to the human admin in evidence_concerns when:
  • An evidence score exceeds its type's ceiling
  • A description is too thin to verify
  • A URL is missing for a type that should have one (paper, doc, video)
  • A "witness with risk" item has no plausible risk in the description
  • Two items appear to be the same source double-counted

OUTPUT RULES
  • Be concise. Reasoning must fit in 2-4 sentences.
  • Do NOT write prose for the public site; the user-facing summary is
    submitter-authored. Your reasoning is for admins only.
  • Be calibrated, not generous. If evidence is thin or undermined, score
    accordingly — even popular theories should land at 5 without solid
    independently verifiable backing.
  • Never invent facts. Score only on what the submission contains.`;

// --- Structured output schema --------------------------------------------
const REVIEW_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'suggested_score',
    'thematic',
    'thematic_analysis',
    'reasoning',
    'evidence_concerns',
  ],
  properties: {
    suggested_score: { type: 'integer', minimum: 1, maximum: 9 },
    thematic: {
      type: 'string',
      enum: ['supporting', 'contradicting', 'mixed', 'neutral'],
    },
    thematic_analysis: { type: 'string' },
    reasoning: { type: 'string' },
    evidence_concerns: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['evidence_id', 'concern'],
        properties: {
          evidence_id: { type: 'string' },
          concern: { type: 'string' },
        },
      },
    },
  },
} as const;

// --- CORS ----------------------------------------------------------------
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'content-type': 'application/json' },
  });
}

// -------------------------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const ANTHROPIC_KEY = Deno.env.get('ANTHROPIC_API_KEY');

  if (!SUPABASE_URL || !SERVICE_KEY || !ANTHROPIC_KEY) {
    return json({ error: 'Server is missing required env vars' }, 500);
  }

  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) {
    return json({ error: 'Missing bearer token' }, 401);
  }

  let theoryId: string;
  try {
    const body = await req.json();
    theoryId = String(body?.theory_id ?? '');
    if (!theoryId) return json({ error: 'theory_id is required' }, 400);
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  // Verify caller — must be signed in.
  const { data: userData, error: userErr } = await supabase.auth.getUser(
    auth.slice('Bearer '.length),
  );
  if (userErr || !userData.user) return json({ error: 'Invalid token' }, 401);

  // Fetch theory + evidence.
  const { data: theory, error: tErr } = await supabase
    .from('theories')
    .select('id, title, summary, category_slug, submitted_by, status')
    .eq('id', theoryId)
    .maybeSingle();
  if (tErr || !theory) return json({ error: 'Theory not found' }, 404);

  // Caller must own the theory or be admin.
  const callerId = userData.user.id;
  let allowed = theory.submitted_by === callerId;
  if (!allowed) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', callerId)
      .maybeSingle();
    allowed = !!prof?.is_admin;
  }
  if (!allowed) return json({ error: 'Forbidden' }, 403);

  const { data: evidence, error: eErr } = await supabase
    .from('evidence')
    .select('id, type, title, source, url, description, score, involvement')
    .eq('theory_id', theoryId);
  if (eErr) return json({ error: eErr.message }, 500);

  // Compose the user message: a stable JSON wrapper so the model sees the
  // same shape every call (helps schema-following + caching of the rubric).
  const submission = {
    theory: {
      id: theory.id,
      title: theory.title,
      category: theory.category_slug,
      summary: theory.summary,
    },
    evidence: (evidence ?? []).map((e) => ({
      id: e.id,
      type: e.type,
      title: e.title,
      source: e.source,
      url: e.url,
      description: e.description,
      submitter_score: e.score,
      involvement: e.involvement,
    })),
  };

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

  let response;
  try {
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      // Adaptive thinking lets the model decide when to reason; low effort
      // keeps cost / latency reasonable for a fully-automated review.
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'low',
        format: {
          type: 'json_schema',
          name: 'theory_review',
          schema: REVIEW_SCHEMA,
        },
      },
      // Cache the rubric: it is stable across all submissions and easily
      // exceeds Sonnet 4.6's 2048-token minimum. Volatile content (the
      // submission JSON) goes in the user turn, after the cached prefix.
      system: [
        {
          type: 'text',
          text: SCORING_RUBRIC,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Review the following submission and return the JSON ' +
                'object that matches the response schema.\n\n' +
                '```json\n' +
                JSON.stringify(submission, null, 2) +
                '\n```',
            },
          ],
        },
      ],
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: `Claude call failed: ${msg}` }, 502);
  }

  // Extract the structured output.
  const block = response.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') {
    return json({ error: 'No text block in model response' }, 502);
  }

  let review;
  try {
    review = JSON.parse(block.text);
  } catch {
    return json({ error: 'Model output was not valid JSON' }, 502);
  }

  const aiReview = {
    ...review,
    model: 'claude-sonnet-4-6',
    reviewed_at: new Date().toISOString(),
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cache_read_input_tokens: response.usage.cache_read_input_tokens ?? 0,
      cache_creation_input_tokens:
        response.usage.cache_creation_input_tokens ?? 0,
    },
  };

  const newStatus =
    theory.status === 'pending_ai' ? 'pending_admin' : theory.status;

  const { error: updErr } = await supabase
    .from('theories')
    .update({
      ai_review: aiReview,
      ai_reviewed_at: new Date().toISOString(),
      status: newStatus,
      // We do NOT auto-overwrite the live score with the suggestion — admins
      // do that. Score updates only happen on accept (handled in the admin UI).
    })
    .eq('id', theoryId);
  if (updErr) return json({ error: updErr.message }, 500);

  return json({ ok: true, review: aiReview });
});
