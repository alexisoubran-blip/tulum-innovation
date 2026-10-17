# Integración con Blokko (pagos con QR, cripto y stablecoins)

Rama: `ticketing`. Documentación oficial: https://docs.blokko.us (API v2).

## Decisión de integración (15 oct)

Usamos la **integración completa (payment intent)**, no el link de pago (invoice). Motivo: Blokko confirmó que un pago de invoice **no trae** `invoiceNumber` ni `hash` en el webhook y que el estado solo se consulta por `merchantTransactionId` o `transactionId`. Con el invoice no habría forma confiable de ligar un pago a su orden. Con el payment intent mandamos nuestros propios identificadores y vuelven en el webhook.

| Endpoint | Uso |
|---|---|
| `GET /v2/merchants/{merchantId}/payment-methods` | Métodos disponibles (RTP, stablecoins, cripto) para mostrar en nuestro checkout |
| `POST /v2/payment/intent` | QR para el método elegido. `merchantTransactionId` = un UUID nuevo por intento; `merchantReference` = ID de la orden; `terminalUuid` = terminal virtual (tipo `E`); `amount` en **MXN** como texto; `paymentMethodId` **obligatorio** (la referencia dice opcional, el sandbox responde 422 sin él) |
| `GET /v2/payment/byMerchantTransactionId/{id}` · `GET /v2/payment/{transactionId}` | Consultar estado (`P` pendiente, `E` pagado) mientras el comprador ve el QR |
| `POST /v2/pos/initialization` | Inicializar la terminal (`serial`, `type: "E"` virtual) si Blokko lo requiere |
| `PUT /v2/merchants/{merchantId}/webhook` | Registrar `https://www.tuluminnovationfest.com/api/webhooks/blokko` (solo HTTPS) |

Sandbox: `https://sandbox.blokko.dev`. Producción: la URL que venga con las credenciales de producción.

### Firma (`blokko-signature`)

```
blokko-signature: Api-Key={apiKey}, Timestamp={timestamp}, Nonce={nonce}, Signature={signature}
signature = hex(HMAC-SHA256(secret como texto, "{METHOD}\n{path}\n{query}\n{rawBody}\n{timestamp}\n{nonce}"))
```

Confirmado contra el playground oficial el 15 oct: nuestra cadena y firma coinciden byte por byte. Timestamp en segundos Unix UTC; Blokko acepta la llamada hasta **3 minutos** después del timestamp firmado (si no, 400). Nunca loguear secretos, firmas ni payloads completos.

### Webhook

- Solo el webhook de **pagado (`E`)** viene firmado, con nuestra Api-Key y secret. Canónico: `POST`, `/api/webhooks/blokko`, query vacío, body JSON compacto, timestamp, nonce.
- Los avisos de **pendiente (`P`)** llegan sin firma: respondemos 200 y no guardamos nada. Un `E` sin firma se rechaza (401).
- Hay que responder 200; si no, reintenta a los 0, 30, 60 y 90 s con el mismo nonce. Si nuestro proceso falla, liberamos el nonce para que el reintento sí se procese.
- Fechas en UTC aunque no traigan zona.

## Flujo en TIF

1. El comprador elige pase en `/tickets` → creamos la orden `PENDIENTE` (precio en el servidor, convertido a MXN).
2. Mostramos los métodos de pago de Blokko en nuestra interfaz con la marca TIF.
3. Al elegir método: `POST /v2/payment/intent` → mostramos el QR (`qrUrl` / `qrContent`). El QR expira en ~3 min (lo fija el exchange, no es configurable) → botón para generar uno nuevo (nuevo `merchantTransactionId`, misma orden).
4. Mientras tanto consultamos el estado cada pocos segundos; el webhook firmado es la fuente de verdad: la orden pasa a `PAGADA` una sola vez y se emiten los boletos.
5. Reembolsos: no hay API; se piden a Blokko y se marcan a mano en el admin.

## Lo que ya está en la rama

| Archivo | Qué hace |
|---|---|
| `lib/ticketing/blokko.mjs` | Cliente: firma, `createInvoice`, `createPaymentIntent`, consulta de estado, `setWebhook`, verificación de webhooks, validación del payload |
| `lib/ticketing/blokko-webhook.mjs` | Lógica del webhook: rechaza firmas inválidas, ignora pendientes, idempotente, alerta pagos sin orden |
| `lib/ticketing/order-token.mjs` | Token cifrado para el `successUrl` |
| `api/webhooks/blokko.mjs` | Endpoint de Vercel. Responde 503 mientras no haya base de datos |
| `api/blokko/status.mjs` | Público y de solo lectura: qué credenciales hay (sin valores) y los métodos de pago que Blokko ofrece |
| `api/blokko/admin.mjs` + `/admin/blokko` | Con token: registrar el webhook, QR de prueba en sandbox y consultar su estado |
| `scripts/blokko-signature-check.mjs` | Confirma la codificación de la firma contra el playground |
| `lib/ticketing/supabase-store.mjs` | Guarda nonces, eventos de pago y marca órdenes pagadas en Supabase (sin dependencias, vía API REST) |
| `supabase/migrations/20261015000000_ticketing_core.sql` | Tablas: pases, órdenes, boletos, eventos de pago, nonces, revendedores, staff. RLS activo; solo el servidor lee y escribe |
| `tests/*.test.mjs` | 20 pruebas (`npm test`) |

## Variables de entorno (Vercel)

| Variable | Valor |
|---|---|
| `BLOKKO_BASE_URL` | `https://sandbox.blokko.dev` (producción: la que dé Blokko) |
| `BLOKKO_API_KEY` | API key de Blokko |
| `BLOKKO_SECRET` | Secret key de Blokko |
| `BLOKKO_MERCHANT_UUID` | `merchantUuid` para invoices |
| `BLOKKO_MERCHANT_ID` | `merchantId` (métodos de pago y webhook). Si Blokko no lo entrega, se usa `BLOKKO_MERCHANT_UUID` |
| `BLOKKO_TERMINAL_SERIAL` | Serial de la terminal que entregó Blokko (se usa como `terminalUuid`) |
| `BLOKKO_TERMINAL_UUID` | Solo si al inicializar la terminal Blokko devuelve un UUID distinto |
| `BLOKKO_SIGNATURE_ENCODING` | `hex` (confirmado contra el playground; es el default) |
| `BLOKKO_TIMESTAMP_UNIT` | `s` (confirmado; es el default) |
| `ORDER_TOKEN_SECRET` | 32+ caracteres aleatorios |
| `TICKETING_ADMIN_TOKEN` | Token para `/admin/blokko` (registrar webhook y pagos de prueba) |
| `SUPABASE_URL` | `https://tervlcriapisdpvsyhto.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Llave `service_role` (o `sb_secret_…`) de Supabase → Project Settings → API Keys. Pegarla directo en Vercel, nunca en chat ni en el repo |

## Base de datos (Supabase)

- Proyecto `tervlcriapisdpvsyhto`, conectado al repo. La migración se aplica sola cuando la rama se fusiona a `main`.
- Todas las tablas tienen RLS y ningún permiso para `anon`/`authenticated`: la llave pública no puede leer compradores.
- `mark_order_paid` marca una orden una sola vez: los reintentos del webhook nunca emiten boletos dobles.
- Los precios de `passes` replican los precios públicos en USD; revisarlos antes de vender directo.

## Respuestas de Blokko (15 oct)

1. **Credenciales**: TIF ya tiene registro en sandbox y en producción; usar las credenciales que entregaron.
2. **Moneda**: el registro está en **MXN**.
3. **Invoice ↔ webhook**: no hay forma de ligarlo; el estado solo se consulta por `merchantTransactionId` o `transactionId` → usamos payment intent.
4. **Webhooks**: firmados con el mismo header y nuestras llaves; solo el de estado `E`.
5. **Ruta**: `/v2/payment/intent`.
6. **Ventana**: 3 minutos después del timestamp; reloj con NTP.
7. **Zona horaria**: UTC.
8. **Expiración**: invoice solo por fecha; QR del payment intent no configurable (depende del exchange).
9. **Reembolsos**: sin API; los gestiona Blokko.
10. **Producción**: usar las credenciales de producción entregadas.

Pendiente de nuestro lado: localizar las credenciales (sandbox y producción, incluido el serial/UUID de la terminal virtual) y definir cómo convertimos USD → MXN.
