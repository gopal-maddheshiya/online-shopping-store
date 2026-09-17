-- Migration: 20260918020000_sync_store_hours_and_site_settings.sql
-- Description: Synchronize Sunday store timings to match the official store schedule
--               (Mon-Sun: 07:00 - 21:00) so all pages and footers display 100% consistent hours.

UPDATE public.store_settings
SET business_hours = jsonb_set(
  COALESCE(business_hours, '{}'::jsonb),
  '{sun}',
  '{"open": "07:00", "close": "21:00", "closed": false}'::jsonb,
  true
)
WHERE id = 1;

-- Also ensure default values exist for all other days
UPDATE public.store_settings
SET business_hours = jsonb_build_object(
  'mon', COALESCE(business_hours->'mon', '{"open": "07:00", "close": "21:00", "closed": false}'::jsonb),
  'tue', COALESCE(business_hours->'tue', '{"open": "07:00", "close": "21:00", "closed": false}'::jsonb),
  'wed', COALESCE(business_hours->'wed', '{"open": "07:00", "close": "21:00", "closed": false}'::jsonb),
  'thu', COALESCE(business_hours->'thu', '{"open": "07:00", "close": "21:00", "closed": false}'::jsonb),
  'fri', COALESCE(business_hours->'fri', '{"open": "07:00", "close": "21:00", "closed": false}'::jsonb),
  'sat', COALESCE(business_hours->'sat', '{"open": "07:00", "close": "21:00", "closed": false}'::jsonb),
  'sun', '{"open": "07:00", "close": "21:00", "closed": false}'::jsonb
)
WHERE id = 1;
