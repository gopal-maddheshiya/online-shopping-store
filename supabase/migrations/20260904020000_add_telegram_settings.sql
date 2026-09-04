-- Add Telegram Bot Token and Chat ID to store_settings
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS telegram_bot_token text DEFAULT '8654538443:AAE_5yJ5GnmIYCKFz6A9lwcOT-_-4GqgFZc',
ADD COLUMN IF NOT EXISTS telegram_chat_id text DEFAULT '5935206082';

-- Update existing settings record with active telegram credentials
UPDATE public.store_settings
SET 
  telegram_bot_token = '8654538443:AAE_5yJ5GnmIYCKFz6A9lwcOT-_-4GqgFZc',
  telegram_chat_id = '5935206082'
WHERE id = 1;
