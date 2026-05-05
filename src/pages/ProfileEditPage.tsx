import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Field from '../components/form/Field';
import { Checkbox, TextInput, Textarea } from '../components/form/inputs';
import { deleteMyAccount, getProfileById, updateMyProfile } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';
import { EXPERT_BADGES } from '../lib/ranks';

export default function ProfileEditPage() {
  const { user, isConfigured, profile: meBasic } = useAuth();
  const { t } = useI18n();
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
        {t.profileEdit.needsSupabase}
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
      return setError(t.profileEdit.usernameMin);
    }
    if (!/^[a-z0-9_]+$/i.test(username.trim())) {
      return setError(t.profileEdit.invalidUsername);
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
      setError(e2 instanceof Error ? e2.message : t.profileEdit.updateFailed);
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12 text-sm text-muted">
        {t.profile.loading}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16">
      <div className="pt-6">
        <Link to="/me" className="text-xs font-medium text-muted hover:text-brand">
          {t.profileEdit.backToProfile}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">
          {t.profileEdit.title}
        </h1>
        {meBasic && (
          <p className="mt-1 text-xs text-muted">{t.profileEdit.signedInAs(meBasic.username)}</p>
        )}
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5 rounded-xl ring-1 ring-line bg-white p-5">
        <Field label={t.profileEdit.username} required hint={t.profileEdit.usernameHint}>
          <TextInput
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={32}
            required
          />
        </Field>

        <Field label={t.profileEdit.realName} hint={t.profileEdit.realNameHint}>
          <TextInput
            value={realName}
            onChange={(e) => setRealName(e.target.value)}
            placeholder="Jane Doe"
          />
        </Field>

        <Field label={t.profileEdit.expertField} hint={t.profileEdit.expertFieldHint}>
          <TextInput
            value={expertField}
            onChange={(e) => setExpertField(e.target.value)}
            placeholder="e.g. Aviation, Virology, Constitutional law"
          />
        </Field>

        <Field
          label={t.profileEdit.credentialNote}
          hint={t.profileEdit.credentialNoteHint}
        >
          <Textarea
            value={expertNote}
            onChange={(e) => setExpertNote(e.target.value)}
            placeholder="Role, institution, public register, ORCID, LinkedIn — anything verifiable."
          />
        </Field>

        <div>
          <p className="text-sm font-medium text-ink">{t.profileEdit.badgesTitle}</p>
          <p className="text-xs text-muted">{t.profileEdit.badgesIntro}</p>
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(EXPERT_BADGES).map(([slug, meta]) => {
              const label = (t.expertBadge as Record<string, string>)[slug] ?? meta.label;
              return (
                <Checkbox
                  key={slug}
                  label={`${meta.emoji}  ${label}`}
                  checked={badges.has(slug)}
                  onChange={() => toggleBadge(slug)}
                />
              );
            })}
          </div>
        </div>

        {error && (
          <p className="rounded-md bg-score-bad/10 px-3 py-2 text-sm text-score-bad">{error}</p>
        )}

        <div className="flex items-center justify-end gap-3">
          <Link to="/me" className="text-sm text-slate-600 hover:text-ink">
            {t.profileEdit.cancel}
          </Link>
          <button
            type="submit"
            disabled={busy}
            className="rounded-md bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
          >
            {busy ? t.profileEdit.saving : t.profileEdit.save}
          </button>
        </div>
      </form>

      <DangerZone />
    </main>
  );
}

// Account deletion — multi-step confirmation to prevent accidental clicks.
// Step 1: small grey link to expand. Step 2: warning + username typing.
// Step 3: final delete (only enabled when typed correctly).
function DangerZone() {
  const { profile, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const username = profile?.username ?? '';
  const canDelete = confirmText.trim() === username && username.length > 0;

  async function handleDelete() {
    if (!canDelete) return;
    setBusy(true);
    setError(null);
    try {
      await deleteMyAccount();
      await signOut();
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.profileEdit.deleteFailed);
      setBusy(false);
    }
  }

  return (
    <section className="mt-12 border-t border-line pt-8">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-xs text-muted hover:text-score-bad underline-offset-4 hover:underline"
        >
          {t.profileEdit.dangerLink}
        </button>
      ) : (
        <div className="rounded-xl border border-score-bad/30 bg-score-bad/5 p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-score-bad">
              {t.profileEdit.dangerTitle}
            </h3>
            <p className="mt-1 text-xs text-slate-700 leading-relaxed">
              {t.profileEdit.dangerBody}
            </p>
          </div>

          <Field label={t.profileEdit.dangerConfirmLabel(username)}>
            <TextInput
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              autoComplete="off"
              placeholder={username}
            />
          </Field>

          {error && (
            <p className="rounded-md bg-score-bad/10 px-3 py-2 text-xs text-score-bad">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setConfirmText('');
                setError(null);
              }}
              disabled={busy}
              className="text-sm text-slate-600 hover:text-ink"
            >
              {t.profileEdit.cancel}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={!canDelete || busy}
              className="rounded-md bg-score-bad px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {busy ? t.profileEdit.deleting : t.profileEdit.dangerConfirmButton}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
