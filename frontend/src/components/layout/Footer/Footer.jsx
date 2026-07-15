import { Link } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';

function FooterLink({ label, to, href }) {
  if (to) return <Link to={to}>{label}</Link>;
  return <a href={href}>{label}</a>;
}

/**
 * Site footer with a brand blurb and link columns.
 *
 * @param {object} props
 * @param {string} props.description
 * @param {{ title: string, links: { label: string, to?: string, href?: string }[] }[]} props.columns
 * @param {string} props.copyright
 * @param {string} [props.meta]
 */
export function Footer({ description, columns = [], copyright, meta }) {
  return (
    <footer>
      <div className="footer-grid">
        <div>
          <Logo className="footer-logo" />
          <p className="footer-desc">{description}</p>
        </div>

        {columns.map((col) => (
          <div className="footer-col" key={col.title}>
            <h5>{col.title}</h5>
            <ul>
              {col.links.map((link) => (
                <li key={link.label}>
                  <FooterLink {...link} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="footer-bottom">
        <span>{copyright}</span>
        {meta && <span>{meta}</span>}
      </div>
    </footer>
  );
}
