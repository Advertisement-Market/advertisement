import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';

/**
 * The AdBasket wordmark. Reused in the navbar and footer with different classes.
 *
 * @param {object} props
 * @param {string} [props.className='nav-logo']
 */
export function Logo({ className = 'nav-logo' }) {
  return (
    <Link to={ROUTES.home} className={className} aria-label="The AdBasket — home">
      <span className="logo-the">The</span>
      <span className="logo-ad">Ad</span>
      <span className="logo-bsk">Basket</span>
    </Link>
  );
}
