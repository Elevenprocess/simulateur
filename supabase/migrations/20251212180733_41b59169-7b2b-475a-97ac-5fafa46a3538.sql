-- Add explicit DENY policies for UPDATE and DELETE on leads table
-- This makes the security posture explicit rather than relying on RLS defaults

-- Only admins can update leads (explicit policy)
CREATE POLICY "Only admins can update leads"
ON public.leads
FOR UPDATE
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Only admins can delete leads (explicit policy)  
CREATE POLICY "Only admins can delete leads"
ON public.leads
FOR DELETE
USING (public.is_admin(auth.uid()));