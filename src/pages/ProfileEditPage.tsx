import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Field from '../components/form/Field';
import { Checkbox, TextInput, Textarea } from '../components/form/inputs';
import { getProfileById, updateMyProfile } from '../lib/api';
import { useAuth } from '../lib/auth';
import { EXPERT_BADGES } from '../lib/ranks';

export default function ProfileEditPage() {
  const { user, isConfigured, profile: meBasic } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [realName, setRealName] = useState('');
  const [expertField, setExpertField] = useState('');
  const [expertNote, setExpertNote] = useState('');
  const [badges, setBadges] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    getProfileById(user.id).then((p) => {
      if (cancelled || !p) return;
      setUsername(p.username);
      setRealName(p.real_name ?? '');
      setExpertField(p.expert_field ?? '');
      setExpertNote(p.expert_note ?? '');
      setBadges(new Set(p.badges ?? []));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!isConfigured) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 text-center text-sm text-muted">
        Profile editing requires Supabase to be configured.
      </main>
    );
  }
  if (!user) {
    return <Navigate to="/login?next=/me/edit" replace />;
  }

  function toggleBadge(slug: string) {
    setBadges((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (username.trim().length < 3) {
      return setError('Username must be at least 3 characters.');
    }
    if (!/^[a-z0-9_]+$/i.test(username.trim())) {
      return setError('Username must be alphanumeric or underscores only.');
    }
    setBusy(true);
    try {
      await updateMyProfile(user!.id, {
        username: username.trim(),
        real_name: realName.trim() || null,
        expert_field: expertField.trim() || null,
        expert_note: expertNote.trim() || null,
        badges: Array.from(badges),
      });
      navigate('/me');
    } catch (e2) {
      setError(e2 instanceof Error ? e2.message : 'Update failed.');
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-sm text-muted">
        Loading profile…
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16">
      <div className="pt-6">
        <Link to="/me" className="text-xs font-medium text-muted hover:text-brand">
          ← Back to profile
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          Edit profile
        </h1>
        {meBasic && (
          <p className="mt-1 text-xs text-muted">
            Signed in as @{meBasic.username}
          </p>
        )}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl ring-1 ring-line bg-white p-5">
        <Field label="Username" required hint="Letters, numbers, underscores">
          <TextInput
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={32}
            required
          />
        </Field>

        <Field label="Real name" hint="Optional · increases evidential weight when verified">
          <TextInput
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="Jane Doe"
          />
        </Field>

        <Field label="Field of expertise" hint="Optional">
          <TextInput
            value={expertField}
            onChange={(e) => setExpertField(e.target.value)}
            placeholder="e.g. Aviation, Virology, Constitutional law"
          />
        </Field>

        <Field
          label="Credential note"
          hint="Public · used by admins to verify your expert status"
        >
          <Textarea
            value={expertNote}
            onChange={(e) => setExpertNote(e.target.value)}
            placeholder="Role, institution, public register, ORCID, LinkedIn — anything verifiable."
          />
        </Field>

        <div>
          <p className="text-sm font-medium text-ink">Domain badges</p>
          <p className="text-xs text-muted">
            Pick the badges that match your expertise. Verified experts get coloured/glowing variants.
          </p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(EXPERT_BADGES).map(([slug, meta]) => (
              <Checkbox
                key={slug}
                label={`${meta.emoji}  ${meta.label}`}
                checked={badges.has(slug)}
                onChange={() => toggleBadge(slug)}
              />
            ))}
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">
            {error}
          </p>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link to="/me" className="text-sm text-slate-600 hover:text-ink">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </main>
  );
}
