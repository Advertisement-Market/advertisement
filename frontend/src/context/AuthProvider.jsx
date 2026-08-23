import { useCallback, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { authStorage } from '@/lib/authStorage';
import { authApi } from '@/features/auth/authApi';

/**
 * Holds the authenticated user and exposes login / register / logout actions.
 * On success each action stores the tokens + user and updates state; the session
 * is rehydrated from localStorage on load.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser());

  const applySession = useCallback((response) => {
    authStorage.setSession(response);
    setUser(response.user);
    return response;
  }, []);

  const login = useCallback((email, password) => authApi.login(email, password).then(applySession), [applySession]);
  const loginWithGoogle = useCallback((idToken) => authApi.google(idToken).then(applySession), [applySession]);
  const registerBasic = useCallback((payload) => authApi.register(payload).then(applySession), [applySession]);
  const registerAdvertiser = useCallback((dto) => authApi.registerAdvertiser(dto).then(applySession), [applySession]);
  const registerOwner = useCallback((dto) => authApi.registerOwner(dto).then(applySession), [applySession]);
  const registerAgency = useCallback((dto) => authApi.registerAgency(dto).then(applySession), [applySession]);

  const logout = useCallback(() => {
    const refreshToken = authStorage.getRefreshToken();
    if (refreshToken) authApi.logout(refreshToken).catch(() => {});
    authStorage.clear();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      loginWithGoogle,
      registerBasic,
      registerAdvertiser,
      registerOwner,
      registerAgency,
      logout,
    }),
    [user, login, loginWithGoogle, registerBasic, registerAdvertiser, registerOwner, registerAgency, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
