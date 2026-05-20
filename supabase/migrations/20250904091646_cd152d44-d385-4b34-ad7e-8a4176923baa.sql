-- Create the rate limiting trigger for leads
CREATE TRIGGER prevent_frequent_leads_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_frequent_leads();