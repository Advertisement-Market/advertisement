import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

/**
 * Placeholder for pages not yet converted from templates/. Keeps every nav and
 * footer link resolvable so the app can be navigated end-to-end during Phase 1.
 *
 * @param {object} props
 * @param {string} props.title
 */
export function ComingSoon({ title }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-cream px-6 text-center">
      <span className="text-xs font-bold uppercase tracking-[0.2em] text-indigo">The AdBasket</span>
      <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">{title}</h1>
      <p className="max-w-md text-ink-muted">
        This page is being crafted in React. The landing page is live — explore it while we bring
        the rest of the experience online.
      </p>
      <Link
        to={ROUTES.home}
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-indigo px-6 py-3 text-sm font-medium text-white transition hover:bg-indigo-dark"
      >
        ← Back to home
      </Link>
    </main>
  );
}

export default ComingSoon;
