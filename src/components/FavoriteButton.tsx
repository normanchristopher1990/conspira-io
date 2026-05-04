import { useState } from 'react';
import { addFavorite, removeFavorite } from '../lib/api';
import { useAuth } from '../lib/auth';
import { useI18n } from '../lib/i18n';

type Props = {
  theoryId: string;
  initialFavorited: boolean;
  size?: 'sm' | 'md';
  // If provided, called after successful toggle so parent can refetch.
  onChange?: (nowFavorited: boolean) => void;
};

// Star toggle button. Hidden when not signed in (favorites are private).
// Optimistic update: flips immediately on click, reverts on error.
export default function FavoriteButton({
  theoryId,
  initialFavorited,
  size = 'md',
  onChange,
}: Props) {
  const { user } = useAuth();
  const { t } = useI18n();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [busy, setBusy] = useState(false);

  if (!user) return null;

  async function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (busy) return;
    const next = !favorited;
    setFavorited(next);
    setBusy(true);
    try {
      if (next) await addFavorite(theoryId);
      else await removeFavorite(theoryId);
      onChange?.(next);
    } catch {
      setFavorited(!next); // revert
    } finally {
      setBusy(false);
    }
  }

  const px = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={favorited ? t.favorites.remove : t.favorites.add}
      title={favorited ? t.favorites.remove : t.favorites.add}
      className={
        'inline-flex items-center justify-center rounded-md p-1.5 transition-colors ' +
        (favorited
          ? 'text-brand hover:bg-brand/10'
          : 'text-slate-400 hover:text-brand hover:bg-slate-100')
      }
    >
      {favorited ? (
        <svg
          viewBox="0 0 24 24"
          className={px}
          fill="currentColor"
          aria-hidden
        >
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.32.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className={px}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
          strokeLinecap="round"
          aria-hidden
        >
          <path d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.32.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
        </svg>
      )}
    </button>
  );
}
