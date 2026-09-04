-- Add Telegram Bot Token and Chat ID to store_settings
ALTER TABLE public.store_settings
ADD COLUMN IF NOT EXISTS telegram_bot_token text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS telegram_chat_id text DEFAULT NULL;
