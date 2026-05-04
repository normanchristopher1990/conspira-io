import { useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import TheoryCard from '../components/TheoryCard';
import { useAuth } from '../lib/auth';
import { useMyFavoriteIds, useMyFavoriteTheories, useProfile, useUserTheories } from '../lib/hooks';
import { useI18n, type Strings } from '../lib/i18n';
import {
  EXPERT_BADGES,
  deriveRank,
  rankBadgeClasses,
  type ExpertLevel,
  type RankSlug,
} from '../lib/ranks';

type Tab = 'theories' | 'favorites' | 'about';

export default function ProfilePage({ self = false }: { self?: boolean }) {
  const { username: routeUsername } = useParams<{ username: string }>();
  const { profile: meProfile, user, isConfigured } = useAuth();
  const { t } = useI18n();

  const username = self ? meProfile?.username : routeUsername;
  const isMe = self || (meProfile && meProfile.username === routeUsername);

  if (self && !user) {
    return <Navigate to="/login?next=/me" replace />;
  }
  if (!isConfigured) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16 text-center">
        <p className="text-sm text-muted">{t.profile.needsSupabase}</p>
      </main>
    );
  }

  return <ProfileBody username={username} isMe={!!isMe} />;
}

function ProfileBody({ username, isMe }: { username: string | undefined; isMe: boolean }) {
  const [tab, setTab] = useState<Tab>('theories');
  const { data: profile, loading, error } = useProfile(username);
  const { data: theories } = useUserTheories(profile?.id);
  // Favorites — only fetched when viewing own profile (RLS makes it empty for others anyway).
  const { data: favoriteTheories } = useMyFavoriteTheories();
  const { data: favoriteIds } = useMyFavoriteIds();
  const { isAdmin, signOut } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12 text-sm text-muted">
        {t.profile.loading}
      </main>
    );
  }

  if (error || !profile) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-muted">{t.profile.notFound}</p>
        <Link to="/" className="mt-3 inline-block text-sm font-medium text-brand hover:underline">
          {t.detail.backHome}
        </Link>
      </main>
    );
  }

  const rank = deriveRank(
    profile.accepted_count,
    profile.expert_level as ExpertLevel,
    profile.rank as RankSlug,
  );

  const visibleTheories =
    tab === 'theories' ? (theories ?? []).slice(0, 50) : [];

  return (
    <main className="mx-auto max-w-4xl px-4 pb-16">
      <div className="pt-6">
        <Link to="/" className="text-xs font-medium text-muted hover:text-brand">
          {t.profile.backToFeed}
        </Link>
      </div>

      <header className="mt-3 rounded-xl bg-white shadow-card ring-1 ring-line p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
              {profile.username}
            </h1>
            {profile.real_name && (
              <p className="mt-1 text-sm text-slate-600">{profile.real_name}</p>
            )}
            <p className="mt-2 text-xs text-muted">
              {t.profile.joined}{' '}
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
              title={t.rank[rank.slug].notes}
            >
              <span aria-hidden>★</span>
              {t.rank[rank.slug].label}
            </span>
            {profile.expert_level === 'verified' && (
              <span className="text-[11px] font-mono-num text-brand">
                {t.profile.verified}
              </span>
            )}
            {isMe && (
              <div className="flex flex-col items-end gap-1">
                <Link
                  to="/me/edit"
                  className="text-[11px] font-medium text-brand hover:underline"
                >
                  {t.profile.editProfile}
                </Link>
                {isAdmin && (
                  <Link
                    to="/admin"
                    className="text-[11px] font-medium text-brand hover:underline"
                  >
                    {t.profile.adminPanel}
                  </Link>
                )}
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-[11px] font-medium text-muted hover:text-score-bad"
                >
                  {t.profile.signOut}
                </button>
              </div>
            )}
          </div>
        </div>

        {profile.badges.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {profile.badges.map((b) => {
              const meta = EXPERT_BADGES[b];
              if (!meta) return null;
              const label = (t.expertBadge as Record<string, string>)[b] ?? meta.label;
              return (
                <span
                  key={b}
                  className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-medium text-brand ring-1 ring-brand/20"
                  title={label}
                >
                  <span aria-hidden>{meta.emoji}</span>
                  {label}
                </span>
              );
            })}
          </div>
        )}

        <dl className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-line pt-5">
          <Stat label={t.profile.accepted} value={profile.accepted_count} />
          <Stat label={t.profile.submitted} value={(theories ?? []).length} />
          <Stat label={t.profile.rankTier} value={t.rank[rank.slug].label} mono={false} />
          <Stat label={t.profile.badges} value={profile.badges.length} />
        </dl>
      </header>

      <nav className="mt-6 flex items-center gap-1 border-b border-line">
        <TabButton active={tab === 'theories'} onClick={() => setTab('theories')}>
          {t.profile.tabTheories} ({(theories ?? []).length})
        </TabButton>
        {isMe && (
          <TabButton active={tab === 'favorites'} onClick={() => setTab('favorites')}>
            {t.profile.tabFavorites} ({(favoriteTheories ?? []).length})
          </TabButton>
        )}
        <TabButton active={tab === 'about'} onClick={() => setTab('about')}>
          {t.profile.tabAbout}
        </TabButton>
      </nav>

      {tab === 'theories' && (
        <section className="mt-5 grid gap-5">
          {visibleTheories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
              {t.profile.noTheories}
            </div>
          ) : (
            visibleTheories.map((th) => (
              <TheoryCard key={th.id} theory={th} favoriteIds={favoriteIds ?? undefined} />
            ))
          )}
        </section>
      )}

      {tab === 'favorites' && isMe && (
        <section className="mt-5 grid gap-5">
          {(favoriteTheories ?? []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
              {t.favorites.empty}
            </div>
          ) : (
            (favoriteTheories ?? []).map((th) => (
              <TheoryCard key={th.id} theory={th} favoriteIds={favoriteIds ?? undefined} />
            ))
          )}
        </section>
      )}

      {tab === 'about' && (
        <section className="mt-5 rounded-xl bg-white ring-1 ring-line p-6 space-y-3 text-sm text-slate-700">
          <p>
            <span className="text-muted">{t.profile.aboutUsername}:</span>{' '}
            <span className="font-mono-num text-ink">{profile.username}</span>
          </p>
          <p>
            <span className="text-muted">{t.profile.aboutRank}:</span>{' '}
            <span className="text-ink font-medium">{t.rank[rank.slug].label}</span>{' '}
            <span className="text-muted">— {t.rank[rank.slug].notes}</span>
          </p>
          <p>
            <span className="text-muted">{t.profile.aboutExpert}:</span>{' '}
            <span className="text-ink font-medium">
              {profile.expert_level.replace('_', ' ')}
            </span>
          </p>
          <p>
            <span className="text-muted">{t.profile.aboutAccepted}:</span>{' '}
            <span className="font-mono-num text-ink">
              {profile.accepted_count}
            </span>
          </p>
          <p className="pt-2 text-xs text-muted">
            {nextRankNote(profile.accepted_count, profile.expert_level as ExpertLevel, t)}
          </p>
        </section>
      )}
    </main>
  );
}

function nextRankNote(accepted: number, level: ExpertLevel, t: Strings): string {
  if (level === 'verified') return t.profile.nextRankExpert;
  if (accepted < 1)  return t.profile.nextRank(1 - accepted,  t.rank.orbit.label);
  if (accepted < 3)  return t.profile.nextRank(3 - accepted,  t.rank.triad.label);
  if (accepted < 10) return t.profile.nextRank(10 - accepted, t.rank.cosmos.label);
  if (accepted < 20) return t.profile.nextRank(20 - accepted, t.rank.astral.label);
  if (accepted < 50) return t.profile.nextRank(50 - accepted, t.rank.stellar.label);
  return t.profile.adminAssigned;
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
