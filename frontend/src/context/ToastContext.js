import { createContext, useContext } from 'react';

/** @typedef {{ showToast: (message: string) => void, message: string, visible: boolean }} ToastValue */

export const ToastContext = createContext(/** @type {ToastValue|null} */ (null));

/**
 * Access the toast API. Must be used within <ToastProvider>.
 * @returns {ToastValue}
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
