import { createContext, useContext } from 'react';

/**
 * @typedef {{ id: number, firstName: string, lastName: string|null, email: string,
 *   phone: string|null, role: 'ADVERTISER'|'OWNER'|'AGENCY', emailVerified: boolean }} AuthUser
 * @typedef {{
 *   user: AuthUser|null,
 *   isAuthenticated: boolean,
 *   login: (email: string, password: string) => Promise<object>,
 *   registerBasic: (payload: object) => Promise<object>,
 *   registerAdvertiser: (dto: object) => Promise<object>,
 *   registerOwner: (dto: object) => Promise<object>,
 *   registerAgency: (dto: object) => Promise<object>,
 *   logout: () => void,
 * }} AuthValue
 */

export const AuthContext = createContext(/** @type {AuthValue|null} */ (null));

/** Access auth state + actions. Must be used within <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
