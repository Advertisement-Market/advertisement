import { useCallback, useEffect, useMemo, useState } from 'react';
import { AuthContext } from './AuthContext';
import { authStorage } from '@/lib/authStorage';
import { authApi } from '@/features/auth/authApi';
import {
  registerSessionRefreshedHandler,
  resetSessionExpiryGuard,
} from '@/lib/apiClient';
import { clearOwnerRegisterDraft } from '@/pages/OwnerRegister/ownerDraftStorage';

/**
 * Holds the authenticated user and exposes login / register / onboarding / logout actions.
 * On success each action stores the session attributes + user and updates state; the session
 * is rehydrated from localStorage on load and kept synchronized with background token refreshes.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser());

  const applySession = useCallback((response) => {
    authStorage.setSession(response);
    resetSessionExpiryGuard();
    setUser(response.user);
    return response;
  }, []);

  const clearSessionLocal = useCallback(() => {
    authStorage.clear();
    clearOwnerRegisterDraft();
    setUser(null);
  }, []);

  useEffect(() => {
    return registerSessionRefreshedHandler((data) => {
      if (data?.user) {
        setUser(data.user);
      }
    });
  }, []);

  const login = useCallback(
    (email, password) => authApi.login(email, password).then(applySession),
    [applySession],
  );
  const loginWithGoogle = useCallback(
    (idToken) => authApi.google(idToken).then(applySession),
    [applySession],
  );
  const registerBasic = useCallback(
    (payload) => authApi.register(payload).then(applySession),
    [applySession],
  );
  const registerAdvertiser = useCallback(
    (dto) => authApi.registerAdvertiser(dto).then(applySession),
    [applySession],
  );
  const registerOwner = useCallback(
    (dto) => authApi.registerOwner(dto).then(applySession),
    [applySession],
  );
  const onboardOwner = useCallback(
    (dto) => authApi.onboardOwner(dto).then(applySession),
    [applySession],
  );
  const registerAgency = useCallback(
    (dto) => authApi.registerAgency(dto).then(applySession),
    [applySession],
  );

  const logout = useCallback(() => {
    authApi.logout().catch(() => {});
    clearSessionLocal();
  }, [clearSessionLocal]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      login,
      loginWithGoogle,
      registerBasic,
      registerAdvertiser,
      registerOwner,
      onboardOwner,
      registerAgency,
      clearSessionLocal,
      logout,
    }),
    [
      user,
      login,
      loginWithGoogle,
      registerBasic,
      registerAdvertiser,
      registerOwner,
      onboardOwner,
      registerAgency,
      clearSessionLocal,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
