import { useEffect, useRef, useState } from 'react';
import {
  getAiReview,
  getProfileByUsername,
  listAllProfiles,
  listEvidence,
  listTakedownsAdmin,
  listTakedownsPublic,
  listTheories,
  listTheoriesByUser,
  getTheory,
  listPendingTheories,
  type AiReview,
  type PublicProfile,
  type Takedown,
} from './api';
import { supabase } from './supabase';
import type { Evidence, Theory } from './types';

export type AsyncState<T> = {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
};

function useAsync<T>(fn: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fn()
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  return { data, loading, error, refetch: () => setTick((t) => t + 1) };
}

export function useTheories(): AsyncState<Theory[]> {
  return useAsync(listTheories, []);
}

export function useTheory(id: string | undefined): AsyncState<Theory | null> {
  return useAsync(() => (id ? getTheory(id) : Promise.resolve(null)), [id]);
}

export function useEvidence(theoryId: string | undefined): AsyncState<Evidence[]> {
  return useAsync(
    () => (theoryId ? listEvidence(theoryId) : Promise.resolve([])),
    [theoryId],
  );
}

export function usePendingTheories(): AsyncState<Theory[]> {
  return useAsync(listPendingTheories, []);
}

export function useAiReview(theoryId: string | undefined): AsyncState<AiReview | null> {
  return useAsync(
    () => (theoryId ? getAiReview(theoryId) : Promise.resolve(null)),
    [theoryId],
  );
}

export function useProfile(username: string | undefined): AsyncState<PublicProfile | null> {
  return useAsync(
    () => (username ? getProfileByUsername(username) : Promise.resolve(null)),
    [username],
  );
}

export function useUserTheories(userId: string | undefined): AsyncState<Theory[]> {
  return useAsync(
    () => (userId ? listTheoriesByUser(userId) : Promise.resolve([])),
    [userId],
  );
}

export function useTakedownsPublic(): AsyncState<Takedown[]> {
  return useAsync(listTakedownsPublic, []);
}

export function useTakedownsAdmin(): AsyncState<Takedown[]> {
  return useAsync(listTakedownsAdmin, []);
}

export function useAllProfiles(): AsyncState<PublicProfile[]> {
  return useAsync(listAllProfiles, []);
}

// Subscribe to Postgres changes on a table; calls onChange with a small
// debounce so a burst of inserts triggers a single refetch.
export function useRealtimeTable(table: string, onChange: () => void) {
  const fnRef = useRef(onChange);
  fnRef.current = onChange;

  useEffect(() => {
    if (!supabase) return;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const fire = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fnRef.current(), 200);
    };
    const channel = supabase
      .channel(`realtime:${table}`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, fire)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase!.removeChannel(channel);
    };
  }, [table]);
}
