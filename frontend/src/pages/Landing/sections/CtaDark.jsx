import { ROUTES } from '@/lib/routes';
import { Button } from '@/components/ui/Button';
import { useAuthModal } from '@/context/AuthModalContext';

export function CtaDark() {
  const { openRegister } = useAuthModal();

  return (
    <section className="cta-section">
      <span className="cta-eyebrow">Get Started Today</span>
      <h2 className="cta-title">
        India&apos;s billboards.
        <br />
        <em>One platform.</em>
      </h2>
      <p className="cta-sub">
        Free to search, compare, and shortlist. No account needed to browse.
      </p>
      <div className="cta-actions">
        <Button variant="amber" size="lg" to={ROUTES.browse}>
          Browse Billboards
        </Button>
        <Button variant="ghostDark" size="lg" to={ROUTES.browseAgencies}>
          Find an Agency
        </Button>
        <button className="btn-ghost-dark btn-lg" onClick={openRegister}>
          Create Free Account
        </button>
      </div>
    </section>
  );
}
