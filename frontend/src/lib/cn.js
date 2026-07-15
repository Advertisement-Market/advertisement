/**
 * Tiny className combiner — filters out falsy values and joins with a space.
 * Keeps JSX readable without pulling in a dependency.
 *
 * @param {...(string|false|null|undefined)} classes
 * @returns {string}
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
