import { useInView } from '@/hooks/useInView';
import { useCountUp } from '@/hooks/useCountUp';

/**
 * Animated count-up number that starts when scrolled into view.
 * Formats with Indian digit grouping and an optional suffix — matching the
 * animateCounters() behaviour in index.html (e.g. 12000 -> "12,000+").
 *
 * @param {object} props
 * @param {number} props.target
 * @param {string} [props.suffix='+']
 * @param {string} [props.className]
 * @param {import('react').ElementType} [props.as='span']
 */
export function Counter({ target, suffix = '+', className, as: Tag = 'span', ...rest }) {
  const [ref, inView] = useInView({ once: true, threshold: 0.4 });
  const value = useCountUp(target, { active: inView });

  return (
    <Tag ref={ref} className={className} {...rest}>
      {value.toLocaleString('en-IN')}
      {suffix}
    </Tag>
  );
}
