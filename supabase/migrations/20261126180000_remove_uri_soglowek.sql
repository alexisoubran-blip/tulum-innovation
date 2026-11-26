-- Uri Soglowek is no longer part of TIF 2026: retire his speaker-challenge code
-- (kept for order history; inactive codes are rejected at checkout) and drop the deleted photo.
update public.promo_codes
   set active = false, photo_url = null, updated_at = now()
 where code = 'URI10';
