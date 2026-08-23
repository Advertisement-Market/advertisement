import { Footer } from '@/components/layout/Footer';
import { Toast } from '@/components/ui/Toast';
import { AuthModal } from '@/features/auth/AuthModal';
import { HomeNavbar } from './HomeNavbar';
import { ScrollProgress } from './ScrollProgress';

/**
 * Shell for the role home pages: scroll progress bar + `#mainNav` + page content
 * + footer, plus the global auth modal and toast, all inside the page-scope
 * wrapper so they inherit that page's styling.
 *
 * @param {object} props
 * @param {string} props.pageClassName  scope class, e.g. "advertiser-home-page"
 * @param {object} props.nav            props for <HomeNavbar />
 * @param {object} props.footer         props for <Footer />
 * @param {import('react').ReactNode} [props.floatBar]
 */
export function HomeLayout({ pageClassName, nav, footer, floatBar, withModal = true, children }) {
  return (
    <div className={pageClassName}>
      <ScrollProgress />
      <HomeNavbar {...nav} />
      {children}
      <Footer {...footer} />
      {floatBar}
      {withModal && <AuthModal submitVariant="primary" />}
      <Toast />
    </div>
  );
}
