import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { api, RequestError, restoreToken, saveToken } from '../lib/api';
import type { Details, User } from '../lib/types';

export function useCompetition(slug: string) {
  const [data, setData] = useState<Details | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [now, setNow] = useState(Date.now());
  const offset = useRef(0);
  const generation = useRef(0);
  const refresh = useCallback(
    async (visible = false) => {
      const request = ++generation.current;
      if (visible) setRefreshing(true);
      try {
        const start = Date.now();
        const result = await api<Details>(`/competitions/${slug}`);
        if (request !== generation.current) return;
        offset.current = new Date(result.serverTime).getTime() - (start + Date.now()) / 2;
        setNow(Date.now() + offset.current);
        setData(result);
        setError('');
      } catch (e) {
        if (request !== generation.current) return;
        if (e instanceof RequestError && e.status === 401) {
          await saveToken(null);
          setUser(null);
        }
        setError((e as Error).message);
      } finally {
        if (request === generation.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [slug],
  );
  useEffect(() => {
    let alive = true;
    setLoading(true);
    setData(null);
    (async () => {
      try {
        const token = await restoreToken();
        if (token) {
          try {
            const result = await api<{ user: User }>('/auth/me');
            if (alive) setUser(result.user);
          } catch (e) {
            if (e instanceof RequestError && e.status === 401) await saveToken(null);
          }
        }
      } finally {
        if (alive) await refresh();
      }
    })();
    const tick = setInterval(() => setNow(Date.now() + offset.current), 1000);
    const poll = setInterval(() => {
      if (AppState.currentState === 'active') void refresh();
    }, 15000);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      alive = false;
      generation.current++;
      clearInterval(tick);
      clearInterval(poll);
      subscription.remove();
    };
  }, [refresh]);
  const authenticate = async (token: string, nextUser: User) => {
    await saveToken(token);
    setUser(nextUser);
    await refresh();
  };
  const signOut = async () => {
    await saveToken(null);
    setUser(null);
    await refresh();
  };
  return {
    data,
    user,
    error,
    loading,
    refreshing,
    now,
    refresh,
    authenticate,
    signOut,
  };
}
