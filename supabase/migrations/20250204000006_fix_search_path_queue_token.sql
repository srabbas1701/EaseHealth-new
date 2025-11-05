-- Fix search_path security issue for generate_queue_token function
-- This adds SET search_path = public to prevent search path injection attacks

CREATE OR REPLACE FUNCTION generate_queue_token()
RETURNS text AS $$
DECLARE
    token text;
    counter integer := 1;
    max_attempts integer := 1000;
    current_year text;
    current_month text;
    current_day text;
    base_token text;
BEGIN
    -- Get current date components
    current_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;
    current_month := LPAD(EXTRACT(MONTH FROM CURRENT_DATE)::text, 2, '0');
    current_day := LPAD(EXTRACT(DAY FROM CURRENT_DATE)::text, 2, '0');
    
    -- Create base token format: QT-YYYYMMDD-XXXX
    base_token := 'QT-' || current_year || current_month || current_day || '-';
    
    LOOP
        -- Generate token in format: QT-YYYYMMDD-XXXX (e.g., QT-20241225-0001)
        token := base_token || LPAD(counter::text, 4, '0');
        
        -- Check if token already exists
        IF NOT EXISTS (SELECT 1 FROM appointments WHERE queue_token = token) THEN
            RETURN token;
        END IF;
        
        counter := counter + 1;
        
        -- Prevent infinite loop
        IF counter > max_attempts THEN
            -- Fallback to UUID-based token with timestamp
            token := 'QT-' || current_year || current_month || current_day || '-' || 
                     SUBSTRING(gen_random_uuid()::text, 1, 8);
            RETURN token;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Update comment
COMMENT ON FUNCTION generate_queue_token() IS 'Generates a unique queue token in format QT-YYYY-XXXX for appointment tracking. Protected against search path injection.';




