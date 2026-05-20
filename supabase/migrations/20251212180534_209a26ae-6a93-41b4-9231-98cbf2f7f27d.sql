-- Remove the public INSERT policy on leads table since all legitimate inserts 
-- go through the submit-lead edge function which uses service role key (bypasses RLS)
-- This prevents direct database spam from malicious actors
DROP POLICY IF EXISTS "Public insert access to leads" ON public.leads;