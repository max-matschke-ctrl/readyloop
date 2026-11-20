import type { QrMatrix } from '@/domain/types';

interface Props {
  matrix: QrMatrix;
  /** Kantenlänge einschließlich Ruhezone in mm (§6.21: 21 mm, nie unter 18 mm). */
  groesseMm: number;
  label: string;
}

const RUHEZONE = 4;

/**
 * QR-Code als SVG (§6.21): viewBox = Modulzahl + 8 (Ruhezone 4 Module je Seite), weißer Grund,
 * Module schwarz, crispEdges. Ein Pfad für alle dunklen Module.
 */
export function QrCode({ matrix, groesseMm, label }: Props) {
  const n = matrix.groesse;
  const kante = n + 2 * RUHEZONE;
  let d = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (matrix.module[y * n + x]) d += `M${x + RUHEZONE} ${y + RUHEZONE}h1v1h-1z`;
    }
  }
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${kante} ${kante}`}
      width={`${groesseMm}mm`}
      height={`${groesseMm}mm`}
      shapeRendering="crispEdges"
      className="block shrink-0"
    >
      <rect width={kante} height={kante} fill="white" />
      <path d={d} fill="black" />
    </svg>
  );
}
