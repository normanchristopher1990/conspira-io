import { useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import TheoryCard from '../components/TheoryCard';
import { useAuth } from '../lib/auth';
import { useProfile, useUserTheories } from '../lib/hooks';
import {
  EXPERT_BADGES,
  RANKS,
  deriveRank,
  rankBadgeClasses,
  type ExpertLevel,
  type RankSlug,
} from '../lib/ranks';

type Tab = 'theories' | 'about';

export default function ProfilePage({ self = false }: { self?: boolean }) {
  const { username: routeUsername } = useParams<{ username: string }>();
  const { profile: meProfile, user, isConfigured } = useAuth();

  const username = self ? meProfile?.username : routeUsername;
  const isMe = self || (meProfile && meProfile.username === routeUsername);

  if (self && !user) {
    return <Navigate to="/login?next=/me" replace />;
  }
  if (!isConfigured) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-muted">
          Profiles need Supabase to be configured. Set the env vars and restart the dev server.
        </p>
      </main>
    );
  }

  return <ProfileBody username={username} isMe={!!isMe} />;
}

function ProfileBody({ username, isMe }: { username: string | undefined; isMe: boolean }) {
  const [tab, setTab] = useState<Tab>('theories');
  const { data: profile, loading, error } = useProfile(username);
  const { data: theories } = useUserTheories(profile?.id);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-sm text-muted">
        Loading profile…
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-muted">Profile not found.</p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
          ← Back to homepage
        </Link>
      </main>
    );
  }

  const rank = deriveRank(
    profile.accepted_count,
    profile.expert_level as ExpertLevel,
    profile.rank as RankSlug,
  );

  const acceptedTheories = (theories ?? []).filter((t) => t.score > 0);
  const visibleTheories =
    tab === 'theories' ? (theories ?? []).slice(0, 50) : [];

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16">
      <div className="pt-6">
        <Link to="/" className="text-xs font-medium text-muted hover:text-brand">
          ← Back to feed
        </Link>
      </div>

      <header className="mt-3 rounded-xl bg-white shadow-card ring-1 ring-line p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              @{profile.username}
            </h1>
            {profile.real_name && (
              <p className="mt-1 text-sm text-slate-600">{profile.real_name}</p>
            )}
            <p className="mt-2 text-xs text-muted">
              Joined{' '}
              <span className="font-mono-num">
                {new Date(profile.created_at).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'short',
                })}
              </span>
            </p>
          </div>

          <div className="flex flex-col items-end gap-2">
            <span
              className={
                'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ' +
                rankBadgeClasses(rank.style)
              }
              title={rank.notes}
            >
              <span aria-hidden>★</span>
              {rank.label}
            </span>
            {profile.expert_level === 'verified' && (
              <span className="text-[11px] font-mono-num text-brand">
                ✓ verified expert
              </span>
            )}
            {isMe && (
              <Link
                to="/me/edit"
                className="text-[11px] font-medium text-brand hover:underline"
              >
                Edit profile →
              </Link>
            )}
          </div>
        </div>

        {profile.badges.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.badges.map((b) => {
              const meta = EXPERT_BADGES[b];
              if (!meta) return null;
              return (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand ring-1 ring-brand/20"
                  title={meta.label}
                >
                  <span aria-hidden>{meta.emoji}</span>
                  {meta.label}
                </span>
              );
            })}
          </div>
        )}

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-line pt-5">
          <Stat label="Accepted" value={profile.accepted_count} />
          <Stat label="Submitted" value={(theories ?? []).length} />
          <Stat label="Rank tier" value={rank.label} mono={false} />
          <Stat label="Badges" value={profile.badges.length} />
        </dl>
      </header>

      <nav className="mt-6 flex items-center gap-1 border-b border-line">
        <TabButton active={tab === 'theories'} onClick={() => setTab('theories')}>
          Theories ({(theories ?? []).length})
        </TabButton>
        <TabButton active={tab === 'about'} onClick={() => setTab('about')}>
          About
        </TabButton>
      </nav>

      {tab === 'theories' && (
        <section className="mt-5 grid gap-5">
          {visibleTheories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
              No theories submitted yet.
            </div>
          ) : (
            visibleTheories.map((t) => <TheoryCard key={t.id} theory={t} />)
          )}
        </section>
      )}

      {tab === 'about' && (
        <section className="mt-5 rounded-xl bg-white ring-1 ring-line p-6 space-y-3 text-sm text-slate-700">
          <p>
            <span className="text-muted">Username:</span>{' '}
            <span className="font-mono-num text-ink">@{profile.username}</span>
          </p>
          <p>
            <span className="text-muted">Rank:</span>{' '}
            <span className="text-ink font-medium">{rank.label}</span>{' '}
            <span className="text-muted">— {rank.notes}</span>
          </p>
          <p>
            <span className="text-muted">Expert level:</span>{' '}
            <span className="text-ink font-medium">
              {profile.expert_level.replace('_', ' ')}
            </span>
          </p>
          <p>
            <span className="text-muted">Accepted contributions:</span>{' '}
            <span className="font-mono-num text-ink">
              {profile.accepted_count}
            </span>
            {acceptedTheories.length !== profile.accepted_count && (
              <span className="text-muted">
                {' '}
                ({acceptedTheories.length} visible)
              </span>
            )}
          </p>
          <p className="pt-2 text-xs text-muted">
            Next rank: {nextRankNote(profile.accepted_count, profile.expert_level as ExpertLevel)}
          </p>
        </section>
      )}
    </main>
  );
}

function nextRankNote(accepted: number, level: ExpertLevel): string {
  if (level === 'verified') return 'Already qualifies for Leutnant — top tiers are admin-assigned.';
  if (accepted < 1) return `${1 - accepted} accepted submission to reach ${RANKS.soldat.label}.`;
  if (accepted < 3) return `${3 - accepted} more accepted to reach ${RANKS.korporal.label}.`;
  if (accepted < 10) return `${10 - accepted} more accepted to reach ${RANKS.sergeant.label}.`;
  if (accepted < 20) return `${20 - accepted} more accepted to reach ${RANKS.leutnant.label}.`;
  return 'Hauptmann and above are admin-assigned.';
}

function Stat({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string | number;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd
        className={
          'mt-0.5 text-ink ' +
          (mono ? 'font-mono-num text-lg font-semibold' : 'text-sm font-medium')
        }
      >
        {value}
      </dd>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'relative -mb-px px-4 py-2 text-sm font-medium transition-colors ' +
        (active
          ? 'text-ink border-b-2 border-brand'
          : 'text-muted hover:text-ink border-b-2 border-transparent')
      }
    >
      {children}
    </button>
  );
}
