import { createContext, useContext } from 'react';

/**
 * @typedef {'login'|'register'|'success'|'gate'|null} AuthModalView
 * @typedef {{
 *   view: AuthModalView,
 *   open: (view?: Exclude<AuthModalView, null>) => void,
 *   openLogin: () => void,
 *   openRegister: () => void,
 *   openGate: () => void,
 *   setView: (view: Exclude<AuthModalView, null>) => void,
 *   close: () => void,
 * }} AuthModalValue
 */

export const AuthModalContext = createContext(/** @type {AuthModalValue|null} */ (null));

/**
 * Access the auth-modal API. Must be used within <AuthModalProvider>.
 * @returns {AuthModalValue}
 */
export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal must be used within an AuthModalProvider');
  return ctx;
}
