/**
 * The AdBasket logo mark for dark surfaces: the brand artwork with its colours
 * inverted, on a transparent background. Rendered from the raster asset and sized
 * by height (aspect ratio preserved).
 *
 * @param {object} props
 * @param {number} [props.size=26]  rendered height in px
 * @param {object} [props.style]
 */
export function LogoMark({ size = 26, style }) {
  return (
    <img
      src="/logo-mark.png"
      alt="AdBasket"
      style={{
        height: size,
        width: 'auto',
        flexShrink: 0,
        alignSelf: 'center',
        verticalAlign: 'middle',
        display: 'block',
        ...style,
      }}
    />
  );
}
