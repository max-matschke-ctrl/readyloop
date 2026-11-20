// QR-Code als Modulraster (F-25), serverseitig mit npm 'qrcode', kein externer Dienst.
import QRCode from 'qrcode';
import type { QrMatrix } from '@/domain/types';

/** Fehlerkorrektur M; zeilenweise groesse × groesse Module, true = dunkel; ohne Ruhezone (die setzt das FE, 4 Module). */
export function qrMatrix(text: string): QrMatrix {
  const qr = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const groesse = qr.modules.size;
  const module = Array.from({ length: groesse * groesse }, (_, i) => qr.modules.data[i] === 1);
  return { groesse, module };
}
