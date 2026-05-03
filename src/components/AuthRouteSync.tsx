import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';

// Refreshes the signed-in user's profile on every route change, so
// admin grants / revokes / username edits propagate without forcing a
// re-login. Cheap (one row by primary key); paired with realtime + the
// focus listener in AuthProvider for fast updates without polling.
export default function AuthRouteSync() {
  const location = useLocation();
  const { refreshProfile, user } = useAuth();

  useEffect(() => {
    if (!user) return;
    void refreshProfile();
  }, [location.pathname, refreshProfile, user]);

  return null;
}
