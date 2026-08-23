import { useCallback, useMemo, useRef, useState } from 'react';
import { ToastContext } from './ToastContext';

const TOAST_DURATION = 3800;

/**
 * Holds toast state and exposes showToast(). The actual toast element is
 * rendered by <Toast /> inside the page scope so it picks up page styling.
 */
export function ToastProvider({ children }) {
  const [message, setMessage] = useState('');
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);

  const showToast = useCallback((msg) => {
    setMessage(msg);
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), TOAST_DURATION);
  }, []);

  const value = useMemo(() => ({ showToast, message, visible }), [showToast, message, visible]);

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}
