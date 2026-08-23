import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib/routes';
import { LogoMark } from './LogoMark';

/**
 * The AdBasket logo: "AB" monogram mark + wordmark. Reused in the navbar and footer.
 *
 * @param {object} props
 * @param {string} [props.className='nav-logo']
 * @param {boolean} [props.showMark=true]
 */
export function Logo({ className = 'nav-logo', showMark = true }) {
  return (
    <Link to={ROUTES.home} className={className} aria-label="The AdBasket — home">
      {showMark && <LogoMark size={26} style={{ marginRight: 9 }} />}
      <span className="logo-the">The</span>
      <span className="logo-ad">Ad</span>
      <span className="logo-bsk">Basket</span>
    </Link>
  );
}
