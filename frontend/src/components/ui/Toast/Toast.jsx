import { cn } from '@/lib/cn';
import { useToast } from '@/context/ToastContext';

/**
 * Renders the global toast element. Placed inside the page scope so it inherits
 * the page's `.toast` styling. Visibility is driven by ToastProvider state.
 */
export function Toast() {
  const { message, visible } = useToast();
  return (
    <div className={cn('toast', visible && 'show')} role="status" aria-live="polite">
      {message}
    </div>
  );
}
