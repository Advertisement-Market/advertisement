import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

/**
 * Maps semantic variants to the design-system button classes defined in the
 * page/shared CSS (preserved verbatim from the original templates).
 */
const VARIANT_CLASS = {
  primary: 'btn-primary',
  amber: 'btn-amber',
  ghost: 'btn-ghost',
  ghostDark: 'btn-ghost-dark',
  teal: 'btn-teal',
  gold: 'btn-gold',
  navGhost: 'btn-nav-ghost',
  navPrimary: 'btn-nav-primary',
};

const SIZE_CLASS = {
  sm: 'btn-sm',
  lg: 'btn-lg',
};

/**
 * Polymorphic button. Renders:
 *  - a react-router <Link> when `to` is set (internal navigation)
 *  - an <a> when `href` is set (hash links / external)
 *  - a <button> otherwise
 *
 * @param {object} props
 * @param {keyof typeof VARIANT_CLASS} [props.variant='primary']
 * @param {'sm'|'lg'} [props.size]
 * @param {string} [props.to]
 * @param {string} [props.href]
 * @param {string} [props.className]
 */
export function Button({
  variant = 'primary',
  size,
  to,
  href,
  className,
  children,
  type = 'button',
  ...rest
}) {
  const classes = cn(VARIANT_CLASS[variant] ?? variant, size && SIZE_CLASS[size], className);

  if (to) {
    return (
      <Link to={to} className={classes} {...rest}>
        {children}
      </Link>
    );
  }

  if (href) {
    return (
      <a href={href} className={classes} {...rest}>
        {children}
      </a>
    );
  }

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  );
}
