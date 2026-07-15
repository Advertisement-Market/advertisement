import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Toast } from '@/components/ui/Toast';
import { AuthModal } from '@/features/auth/AuthModal';

/**
 * Shell for public marketing pages: navbar + page content + footer, plus the
 * global auth modal and toast rendered *inside* the page-scope wrapper so they
 * inherit that page's styling (each template embeds its own nav/modal styles).
 *
 * @param {object} props
 * @param {string} props.pageClassName  scope class, e.g. "landing-page"
 * @param {object} props.nav            props forwarded to <Navbar />
 * @param {object} props.footer         props forwarded to <Footer />
 */
export function PublicLayout({ pageClassName, nav, footer, children }) {
  return (
    <div className={pageClassName}>
      <Navbar {...nav} />
      {children}
      <Footer {...footer} />
      <AuthModal />
      <Toast />
    </div>
  );
}
