// GET /api/checkout/tickets?t=TOKEN — the paid order's tickets with their QR codes (SVG).
import QRCode from 'qrcode';
import { handle } from '../../lib/ticketing/runtime.mjs';

export async function GET(request) {
  const token = new URL(request.url).searchParams.get('t');
  return handle(async (checkout) => {
    const result = await checkout.tickets({ token });
    const tickets = await Promise.all(result.tickets.map(async (t) => ({
      ...t,
      qrSvg: await QRCode.toString(t.code, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#00080B', light: '#FFFFFF' } }),
    })));
    return { ...result, tickets };
  });
}
