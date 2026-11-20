// BE-16: Token (F-24) und QR-Matrix (F-25).
import { afterEach, describe, expect, it, vi } from 'vitest';
import QRCode from 'qrcode';
import { istTokenFormat } from '@/domain/nutzung';
import { qrMatrix } from '@/server/qr';
import { kurzUrl, neuerToken, tokenUrl } from '@/server/token';

afterEach(() => vi.unstubAllEnvs());

describe('neuerToken', () => {
  it('erfüllt istTokenFormat und liefert in 1.000 Aufrufen keine Dublette', () => {
    const tokens = Array.from({ length: 1000 }, () => neuerToken());
    for (const t of tokens) expect(istTokenFormat(t)).toBe(true);
    expect(new Set(tokens).size).toBe(1000);
  });
  it('hat 128 Bit (16 Byte) Inhalt', () => {
    expect(Buffer.from(neuerToken(), 'base64url')).toHaveLength(16);
  });
});

describe('tokenUrl / kurzUrl', () => {
  it('Standard localhost', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', '');
    expect(tokenUrl('a'.repeat(22))).toBe(`http://localhost:3000/g/${'a'.repeat(22)}`);
  });
  it('ohne doppelten Schrägstrich', () => {
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://app.readyloop.de/');
    expect(tokenUrl('abc')).toBe('https://app.readyloop.de/g/abc');
  });
  it('kurzUrl ohne Schema', () => {
    expect(kurzUrl('https://app.readyloop.de/g/abc')).toBe('app.readyloop.de/g/abc');
    expect(kurzUrl('http://localhost:3000/g/abc')).toBe('localhost:3000/g/abc');
  });
});

describe('qrMatrix', () => {
  it('Größe ≥ 25 und module.length === groesse²', () => {
    const m = qrMatrix('https://example.org/g/' + 'a'.repeat(22));
    expect(m.groesse).toBeGreaterThanOrEqual(25);
    expect(m.module).toHaveLength(m.groesse ** 2);
    expect(m.module.every((x) => typeof x === 'boolean')).toBe(true);
  });
  it('entspricht qrcode mit Fehlerkorrektur M (Finder-Muster oben links dunkel)', () => {
    const text = 'https://example.org/g/' + 'b'.repeat(22);
    const m = qrMatrix(text);
    const ref = QRCode.create(text, { errorCorrectionLevel: 'M' });
    expect(ref.errorCorrectionLevel.bit).toBe(QRCode.create('x', { errorCorrectionLevel: 'M' }).errorCorrectionLevel.bit);
    expect(m.groesse).toBe(ref.modules.size);
    expect(m.module[0]).toBe(true);
    expect(m.module[6]).toBe(true);
    expect(m.module[7]).toBe(false);
  });
});
