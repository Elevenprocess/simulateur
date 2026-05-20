-- Add INSERT policy to allow public lead submissions
CREATE POLICY "Public can submit leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);