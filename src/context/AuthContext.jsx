import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { isFirebaseConfigured } from '../firebase';
import {
  NOT_CONFIGURED_MESSAGE,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
  subscribeToAuth,
} from '../services/authService';

const AuthContext = createContext(null);

/**
 * Holds the signed-in user for the whole app.
 *  - `loading` is true until Firebase has restored (or ruled out) a saved session, so pages never
 *    flash the logged-out UI to a user who is actually signed in.
 *  - `error` is the last authentication error (wrong password, network problem, …).
 *  - every action resolves to true / false and never throws.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionError, setActionError] = useState('');

  useEffect(
    () =>
      subscribeToAuth(
        (nextUser) => {
          setUser(nextUser);
          setLoading(false);
        },
        (error) => {
          setActionError(error.message);
          setLoading(false);
        },
      ),
    [],
  );

  const run = useCallback(async (action) => {
    setActionError('');
    try {
      await action();
      return true;
    } catch (error) {
      if (!error.silent) setActionError(error.message);
      return false;
    }
  }, []);

  const signup = useCallback((email, password) => run(() => signUpWithEmail(email, password)), [run]);
  const login = useCallback((email, password) => run(() => signInWithEmail(email, password)), [run]);
  const loginWithGoogle = useCallback(() => run(() => signInWithGoogle()), [run]);
  const logout = useCallback(() => run(() => signOutUser()), [run]);
  const clearError = useCallback(() => setActionError(''), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isConfigured: isFirebaseConfigured,
      error: actionError || (isFirebaseConfigured ? '' : NOT_CONFIGURED_MESSAGE),
      clearError,
      signup,
      login,
      loginWithGoogle,
      logout,
    }),
    [user, loading, actionError, clearError, signup, login, loginWithGoogle, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
