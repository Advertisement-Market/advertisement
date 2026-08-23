import { useInView } from '@/hooks/useInView';

/**
 * Fade-and-rise on scroll into view. Renders AS the target element (default div)
 * so it can be a grid item / card / link directly — no extra wrapper DOM.
 * Reproduces the IntersectionObserver scroll-reveal in index.html, including the
 * staggered transition-delay (index % 4) * 0.07s.
 *
 * @param {object} props
 * @param {import('react').ElementType} [props.as='div']
 * @param {number} [props.index=0]  position used for the stagger delay
 * @param {string} [props.className]
 * @param {object} [props.style]
 */
export function Reveal({ as: Tag = 'div', index = 0, className, style, children, ...rest }) {
  const [ref, inView] = useInView({ once: true, threshold: 0.08, rootMargin: '0px 0px -20px 0px' });

  const revealStyle = {
    opacity: inView ? 1 : 0,
    transform: inView ? 'translateY(0)' : 'translateY(16px)',
    transition: 'opacity 0.48s ease, transform 0.48s ease',
    transitionDelay: inView ? `${(index % 4) * 0.07}s` : '0s',
    ...style,
  };

  return (
    <Tag ref={ref} className={className} style={revealStyle} {...rest}>
      {children}
    </Tag>
  );
}
