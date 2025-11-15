-- Add telegram_user_id column to patients table for Telegram notifications
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS telegram_user_id VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_telegram_id ON patients(telegram_user_id);

-- Add comment
COMMENT ON COLUMN patients.telegram_user_id IS 'Telegram user ID for sending appointment notifications';







