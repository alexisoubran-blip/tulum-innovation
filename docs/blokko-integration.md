# Integración con Blokko (pagos con QR, cripto y stablecoins)

Rama: `ticketing`. Documentación oficial: https://docs.blokko.us (API v2).

## Cómo funciona Blokko

Blokko ofrece dos caminos:

| Camino | Endpoint | Para qué lo usamos |
|---|---|---|
| **Invoice (link de pago)** | `POST /v2/invoice` | Venta online en `/tickets`. Blokko devuelve `invoiceUrl`, una página alojada donde el comprador elige stablecoin, RTP o cripto y ve el QR. Al pagar, Blokko lo redirige a nuestro `successUrl`. |
| **Payment Intent (terminal)** | `POST /v2/payment/intent` | Venta presencial en el venue o en comercios de Innovation City. Requiere `terminalUuid`. Devuelve `qrUrl` / `qrContent`. |

Otros endpoints:

- `GET /v2/payment/byMerchantTransactionId/{id}` y `GET` por `transactionId`: consultar estado (`P` pendiente, `E` pagado).
- `PUT /v2/merchants/{merchantId}/webhook` con `{ "callbackUrl": "https://..." }`: registrar el webhook (solo HTTPS).
- `GET` métodos de pago disponibles (`paymentMethodId`, p. ej. `BCLN`).
- Sandbox: `https://sandbox.blokko.dev`. Producción: `api.blokko.io` (variable `baseUrl` en su OpenAPI).

### Firma (`blokko-signature`)

Cada request lleva un solo header:

```
blokko-signature: Api-Key={apiKey}, Timestamp={timestamp}, Nonce={nonce}, Signature={signature}
```

`signature = HMAC-SHA256(secret, canónico)` y el canónico es:

```
{METHOD}\n{path}\n{queryString}\n{rawBody}\n{timestamp}\n{nonce}
```

Reglas: usar el body crudo, normalizar método y query, solo `\n`, nunca firmas parciales, nunca loguear secretos, firmas ni payloads completos.

La documentación **no dice** si la firma va en hex o base64, ni si el timestamp va en segundos o milisegundos. Ambos son configurables (`BLOKKO_SIGNATURE_ENCODING`, `BLOKKO_TIMESTAMP_UNIT`). Para confirmarlo:

1. Abrir https://playground-sandbox.blokko.ai/ con las llaves de sandbox.
2. Generar una firma con valores conocidos.
3. Correr `node scripts/blokko-signature-check.mjs --secret ... --method POST --path /v2/invoice --body '...' --timestamp ... --nonce ... --expected FIRMA` y usar la codificación que diga `MATCH`.

### Webhook

Blokko hace `POST` con: `authorizationId`, `transactionUuid`, `merchantId`, `merchantReference`, `transactionStatus` (`P` / `E`), `createdAt`, `completedAt`. Hay que responder **200**; si no, reintenta a los 0, 30, 60 y 90 segundos.

## Flujo en TIF

1. El comprador elige pase en `/tickets` → creamos la orden `PENDIENTE` (precio calculado en el servidor).
2. `POST /v2/invoice` con el monto y `successUrl = /tickets/gracias?t={token}`. El token es el ID de la orden **cifrado con AES-256-GCM** (`lib/ticketing/order-token.mjs`), como pide Blokko: nunca un ID visible en la URL.
3. Abrimos `invoiceUrl` en un modal (recomendación de Blokko).
4. Blokko llama a `/api/webhooks/blokko` → verificamos firma, ventana de tiempo y nonce → si `E`, la orden pasa a `PAGADA` una sola vez y se emiten los boletos.
5. La página de gracias descifra el token y muestra el estado, pero **el boleto solo se emite por webhook**.

## Lo que ya está en la rama

| Archivo | Qué hace |
|---|---|
| `lib/ticketing/blokko.mjs` | Cliente: firma, `createInvoice`, `createPaymentIntent`, consulta de estado, `setWebhook`, verificación de webhooks, validación del payload |
| `lib/ticketing/blokko-webhook.mjs` | Lógica del webhook: rechaza firmas inválidas, ignora pendientes, idempotente, alerta pagos sin orden |
| `lib/ticketing/order-token.mjs` | Token cifrado para el `successUrl` |
| `api/webhooks/blokko.mjs` | Endpoint de Vercel. Responde 503 mientras no haya base de datos |
| `api/blokko/sandbox-test.mjs` | Prueba con login de admin: crea un invoice de 1.00 en sandbox para validar llaves y firma desde Vercel |
| `scripts/blokko-signature-check.mjs` | Confirma la codificación de la firma contra el playground |
| `tests/blokko.test.mjs` | 13 pruebas (`npm test`) |

## Variables de entorno (Vercel)

| Variable | Valor |
|---|---|
| `BLOKKO_BASE_URL` | `https://sandbox.blokko.dev` (producción: la que dé Blokko) |
| `BLOKKO_API_KEY` | API key de Blokko |
| `BLOKKO_SECRET` | Secret key de Blokko |
| `BLOKKO_MERCHANT_UUID` | `merchantUuid` para invoices |
| `BLOKKO_MERCHANT_ID` | `merchantId` para el webhook (si es distinto del UUID) |
| `BLOKKO_SIGNATURE_ENCODING` | `hex` o `base64` (confirmar con el script) |
| `BLOKKO_TIMESTAMP_UNIT` | `s` o `ms` |
| `ORDER_TOKEN_SECRET` | 32+ caracteres aleatorios |
| `TICKETING_ADMIN_TOKEN` | Token para `/api/blokko/sandbox-test` |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | Base de datos (siguiente paso) |

## Preguntas para Blokko

1. **Credenciales de sandbox**: API key, secret, `merchantUuid` y `merchantId`.
2. **Firma**: ¿hex o base64? ¿timestamp en segundos o milisegundos? ¿Cuál es la ventana de tiempo válida?
3. **Webhooks**: ¿se firman con el mismo esquema `blokko-signature` y nuestras llaves? ¿Qué `path` usan en el canónico?
4. **Correlación de invoices**: el invoice no acepta `merchantReference`. En un pago por invoice, ¿qué campo del webhook trae el `invoiceNumber` (o cómo ligamos el pago a nuestra orden)? ¿Hay endpoint para consultar el estado por `invoiceNumber` o `hash`?
5. **Moneda**: la moneda se define en el onboarding. ¿Podemos cobrar en **USD**? Si es MXN, ¿qué tipo de cambio usamos?
6. **Expiración**: `expiresAt` es solo fecha (`YYYY-MM-DD`). ¿Se puede expirar por hora o minutos?
7. **Reembolsos**: ¿hay API o se hacen desde el dashboard?
8. **Header del link de pago**: imagen de 1200 × 200 px con la marca TIF (la pide en el onboarding).
9. **Producción**: URL base definitiva y proceso para pasar de sandbox a producción.
