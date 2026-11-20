/**
 * Geometrie der Prüfplakette (Designsystem §5.1): Ring mit 12 Monatssegmenten,
 * Monat 1 oben, im Uhrzeigersinn. viewBox 0 0 64 64. Von allen Plakettenvarianten genutzt.
 */
export const C = 32;
export const R_AUSSEN = 31;
export const R_INNEN = 22;
export const VIEWBOX = '0 0 64 64';

export const MONATE: readonly number[] = Array.from({ length: 12 }, (_, i) => i + 1);

export function punkt(r: number, grad: number, c: number = C): [number, number] {
  const rad = ((grad - 90) * Math.PI) / 180;
  return [c + r * Math.cos(rad), c + r * Math.sin(rad)];
}

/** Ringsegment für Monat 1–12 als SVG-Pfad. */
export function segment(
  monat: number,
  rAussen: number = R_AUSSEN,
  rInnen: number = R_INNEN,
  c: number = C,
  luecke = 2,
): string {
  const a0 = (monat - 1) * 30 + luecke / 2;
  const a1 = monat * 30 - luecke / 2;
  const [x0, y0] = punkt(rAussen, a0, c);
  const [x1, y1] = punkt(rAussen, a1, c);
  const [x2, y2] = punkt(rInnen, a1, c);
  const [x3, y3] = punkt(rInnen, a0, c);
  const f = (n: number) => n.toFixed(2);
  return `M${f(x0)} ${f(y0)} A${rAussen} ${rAussen} 0 0 1 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${rInnen} ${rInnen} 0 0 0 ${f(x3)} ${f(y3)} Z`;
}
