-- Add rate limiting trigger for analytics_events to prevent spam
CREATE OR REPLACE FUNCTION public.prevent_analytics_spam()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if there are more than 100 events from the same session in the last minute
  IF (
    SELECT COUNT(*) 
    FROM public.analytics_events 
    WHERE session_id = NEW.session_id 
      AND created_at > NOW() - INTERVAL '1 minute'
  ) > 100 THEN
    RAISE EXCEPTION 'Rate limit: Too many analytics events from this session';
  END IF;
  
  -- Validate event_type is one of the allowed types
  IF NEW.event_type NOT IN ('page_view', 'step_change', 'button_click', 'cta_click', 'form_submit') THEN
    RAISE EXCEPTION 'Invalid event_type';
  END IF;
  
  -- Sanitize and limit the size of event_data to prevent payload abuse
  IF NEW.event_data IS NOT NULL AND pg_column_size(NEW.event_data) > 10000 THEN
    RAISE EXCEPTION 'Event data payload too large';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the trigger for analytics_events
DROP TRIGGER IF EXISTS prevent_analytics_spam_trigger ON public.analytics_events;
CREATE TRIGGER prevent_analytics_spam_trigger
  BEFORE INSERT ON public.analytics_events
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_analytics_spam();

-- Add validation trigger for leads table to sanitize contact_data
CREATE OR REPLACE FUNCTION public.validate_lead_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  email_value text;
  phone_value text;
BEGIN
  -- Validate contact_data has required fields
  IF NEW.contact_data IS NULL OR 
     NEW.contact_data->>'email' IS NULL OR 
     NEW.contact_data->>'firstName' IS NULL OR
     NEW.contact_data->>'lastName' IS NULL OR
     NEW.contact_data->>'phone' IS NULL THEN
    RAISE EXCEPTION 'Missing required contact fields';
  END IF;
  
  -- Extract and validate email format
  email_value := NEW.contact_data->>'email';
  IF email_value !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- Limit email length
  IF LENGTH(email_value) > 255 THEN
    RAISE EXCEPTION 'Email too long';
  END IF;
  
  -- Extract and validate phone (should start with + and contain only digits after)
  phone_value := NEW.contact_data->>'phone';
  IF phone_value !~ '^\+[0-9]{10,15}$' THEN
    RAISE EXCEPTION 'Invalid phone format';
  END IF;
  
  -- Limit name lengths to prevent abuse
  IF LENGTH(NEW.contact_data->>'firstName') > 100 OR LENGTH(NEW.contact_data->>'lastName') > 100 THEN
    RAISE EXCEPTION 'Name too long';
  END IF;
  
  -- Limit overall payload size
  IF pg_column_size(NEW.contact_data) > 5000 OR pg_column_size(NEW.simulation_results) > 50000 THEN
    RAISE EXCEPTION 'Payload too large';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create the validation trigger for leads (runs before the rate limit trigger)
DROP TRIGGER IF EXISTS validate_lead_data_trigger ON public.leads;
CREATE TRIGGER validate_lead_data_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_lead_data();