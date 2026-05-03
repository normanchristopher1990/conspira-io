// Supabase Edge Function: translate-theory
//
// Triggered after a theory is submitted (so the admin queue shows both
// languages) and again after approval (in case content was edited during
// review). Auto-detects the source language and produces both English
// and German versions of the title and summary.
//
// Body: { theory_id: string }
// Auth: requires the caller's JWT.

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const SYSTEM = `You translate conspiracy-theory titles and summaries for
Conspira, a scientific catalogue of alleged conspiracy theories.

Your task: given a title and summary in either English or German, return
clean versions in BOTH languages. Auto-detect the source language; the
side matching the source language can be near-identical to the original
(only minor polish if needed for tone).

Strict rules:
- Preserve proper nouns and program names exactly: CIA, NSA, FBI, MI5,
  MKUltra, COINTELPRO, PRISM, etc. Do not translate them.
- Preserve organization names (Senate, Congress, Bundestag, BND, etc.)
  in their established native form (English orgs stay English in German;
  German orgs stay German in English).
- Preserve all numbers, dates, statistics, and section references exactly.
- Match the platform's neutral, scientific tone. No editorialising,
  emojis, marketing language, or hedging that wasn't in the source.
- Keep titles tight; do not pad. Keep summaries under 500 characters.
- Do NOT add facts that are not in the source. Translate, don't expand.
- For German: use Sie-form (formal address) implied by encyclopedic tone.
- For English: prefer British spelling matching the platform style.`;

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['source_lang', 'title_en', 'title_de', 'summary_en', 'summary_de'],
  properties: {
    source_lang: { type: 'string', enum: ['en', 'de'] },
    title_en: { type: 'string' },
    title_de: { type: 'string' },
    summary_en: { type: 'string' },
    summary_de: { type: 'string' },
  },
} as const;

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
  if (!auth?.startsWith('Bearer ')) return json({ error: 'Missing bearer token' }, 401);

  let theoryId: string;
  try {
    const body = await req.json();
    theoryId = String(body?.theory_id ?? '');
    if (!theoryId) return json({ error: 'theory_id is required' }, 400);
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

  const { data: userData, error: userErr } = await supabase.auth.getUser(
    auth.slice('Bearer '.length),
  );
  if (userErr || !userData.user) return json({ error: 'Invalid token' }, 401);

  const { data: theory, error: tErr } = await supabase
    .from('theories')
    .select('id, title, summary, submitted_by')
    .eq('id', theoryId)
    .maybeSingle();
  if (tErr || !theory) return json({ error: 'Theory not found' }, 404);

  // Caller must be the owner or an admin.
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

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_KEY });

  let response;
  try {
    response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'low',
        format: {
          type: 'json_schema',
          name: 'theory_translation',
          schema: SCHEMA,
        },
      },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                'Translate the following submission. Return JSON matching the schema.\n\n' +
                '```json\n' +
                JSON.stringify({ title: theory.title, summary: theory.summary }, null, 2) +
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

  const block = response.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') {
    return json({ error: 'No text block in model response' }, 502);
  }

  let parsed;
  try {
    parsed = JSON.parse(block.text);
  } catch {
    return json({ error: 'Model output was not valid JSON' }, 502);
  }

  const { error: updErr } = await supabase
    .from('theories')
    .update({
      title_en: parsed.title_en,
      title_de: parsed.title_de,
      summary_en: parsed.summary_en,
      summary_de: parsed.summary_de,
      translated_at: new Date().toISOString(),
    })
    .eq('id', theoryId);
  if (updErr) return json({ error: updErr.message }, 500);

  return json({ ok: true, source_lang: parsed.source_lang });
});
