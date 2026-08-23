import { cn } from '@/lib/cn';
import { useInView } from '@/hooks/useInView';

/**
 * Class-based scroll reveal for the home pages. The scoped CSS defines
 * `.reveal` / `.reveal.visible` / `.reveal-delay-N`; this adds `visible` when
 * the element scrolls into view (matching the original IntersectionObserver).
 *
 * @param {object} props
 * @param {import('react').ElementType} [props.as='div']
 * @param {1|2|3|4} [props.delay]  stagger class reveal-delay-N
 * @param {string} [props.className]  extra classes (rendered alongside `reveal`)
 */
export function Reveal({ as: Tag = 'div', delay, className, children, ...rest }) {
  const [ref, inView] = useInView({ once: true, threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  return (
    <Tag
      ref={ref}
      className={cn('reveal', delay && `reveal-delay-${delay}`, className, inView && 'visible')}
      {...rest}
    >
      {children}
    </Tag>
  );
}
