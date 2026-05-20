-- Complete the rate limiting setup by adding the trigger
CREATE TRIGGER prevent_frequent_leads_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_frequent_leads();