-- Add queue_token column to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS queue_token text;

-- Create index for queue_token for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointments_queue_token ON appointments(queue_token);

-- Add comment to explain the column
COMMENT ON COLUMN appointments.queue_token IS 'System generated queue token number for appointment tracking';

