import { useCallback, useMemo, useState } from 'react';
import { AuthModalContext } from './AuthModalContext';

/**
 * Controls which auth modal view is open (login / register / success / gate).
 * The <AuthModal /> component reads this state and renders inside the page scope.
 */
export function AuthModalProvider({ children }) {
  const [view, setViewState] = useState(null);

  const open = useCallback((next = 'login') => setViewState(next), []);
  const openLogin = useCallback(() => setViewState('login'), []);
  const openRegister = useCallback(() => setViewState('register'), []);
  const openGate = useCallback(() => setViewState('gate'), []);
  const setView = useCallback((next) => setViewState(next), []);
  const close = useCallback(() => setViewState(null), []);

  const value = useMemo(
    () => ({ view, open, openLogin, openRegister, openGate, setView, close }),
    [view, open, openLogin, openRegister, openGate, setView, close],
  );

  return <AuthModalContext.Provider value={value}>{children}</AuthModalContext.Provider>;
}
