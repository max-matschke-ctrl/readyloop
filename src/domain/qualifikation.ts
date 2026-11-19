// Vertrag §5.7 – Prüferqualifikation (F-15). Nur Warnung, blockiert nie.
import { PRUEFER_TYP_LABEL } from './types';
import type { PrueferTyp } from './types';

const labels = (typen: readonly PrueferTyp[]) => typen.map((t) => PRUEFER_TYP_LABEL[t]).join(', ');

/** null = passt oder keine Anforderung (kein Katalogeintrag bzw. keine Typen gefordert). Sonst Warntext. */
export function qualifikationsWarnung(
  prueferTypen: readonly PrueferTyp[],
  gefordert: readonly PrueferTyp[] | null,
): string | null {
  if (gefordert === null || gefordert.length === 0) return null;
  if (prueferTypen.some((t) => gefordert.includes(t))) return null;
  const hinterlegt = prueferTypen.length > 0 ? labels(prueferTypen) : 'keine Qualifikation hinterlegt';
  return `Qualifikation passt nicht – gefordert: ${labels(gefordert)}; hinterlegt: ${hinterlegt}`;
}
