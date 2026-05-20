-- Critical Security Fix 1: Lock down write access to simulator_variants
-- Remove dangerous public ALL policy and restrict to proper access levels

-- Drop the existing dangerous public insert/update policy
DROP POLICY IF EXISTS "Public insert/update access to variants" ON public.simulator_variants;

-- Keep the existing public read policy for active variants (this is safe)
-- Add admin-only policies for full access

-- Admins can read all variants (including inactive ones)
CREATE POLICY "Admins can read all variants" 
ON public.simulator_variants 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Admins can insert variants
CREATE POLICY "Admins can insert variants" 
ON public.simulator_variants 
FOR INSERT 
TO authenticated
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can update variants
CREATE POLICY "Admins can update variants" 
ON public.simulator_variants 
FOR UPDATE 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can delete variants
CREATE POLICY "Admins can delete variants" 
ON public.simulator_variants 
FOR DELETE 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Critical Security Fix 2: Lock down AB tests and AB test variants
-- Remove dangerous public ALL policies

-- Fix ab_tests table
DROP POLICY IF EXISTS "Public access to AB tests" ON public.ab_tests;

CREATE POLICY "Admins can manage AB tests" 
ON public.ab_tests 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Fix ab_test_variants table
DROP POLICY IF EXISTS "Public access to AB test variants" ON public.ab_test_variants;

CREATE POLICY "Admins can manage AB test variants" 
ON public.ab_test_variants 
FOR ALL 
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- Security Fix 3: Add constraints to analytics_events for data integrity
-- Limit event types to known values and cap payload size

-- Add constraint for allowed event types
ALTER TABLE public.analytics_events 
ADD CONSTRAINT valid_event_types 
CHECK (event_type IN ('page_view', 'step_change', 'button_click', 'cta_click', 'form_submit'));

-- Add constraint to limit event_data payload size (8KB limit)
ALTER TABLE public.analytics_events 
ADD CONSTRAINT event_data_size_limit 
CHECK (pg_column_size(event_data) <= 8192);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_variant_id ON public.analytics_events(variant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON public.analytics_events(session_id);

-- Security Fix 4: Add constraints to leads table for data integrity
-- Ensure required contact fields are present and limit payload sizes

-- Add constraint to ensure required contact data fields are present
ALTER TABLE public.leads 
ADD CONSTRAINT required_contact_fields 
CHECK (
  contact_data ? 'firstName' AND 
  contact_data ? 'lastName' AND 
  contact_data ? 'email' AND 
  contact_data ? 'phone' AND
  contact_data->>'email' ~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);

-- Add constraint to limit contact_data payload size (4KB limit)
ALTER TABLE public.leads 
ADD CONSTRAINT contact_data_size_limit 
CHECK (pg_column_size(contact_data) <= 4096);

-- Add constraint to limit simulation_results payload size (8KB limit)
ALTER TABLE public.leads 
ADD CONSTRAINT simulation_results_size_limit 
CHECK (pg_column_size(simulation_results) <= 8192);

-- Add performance indexes
CREATE INDEX IF NOT EXISTS idx_leads_session_id ON public.leads(session_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_variant_id ON public.leads(variant_id);

-- Security Fix 5: Add rate limiting trigger for leads to prevent spam
-- Create a function to check for recent submissions from the same session

CREATE OR REPLACE FUNCTION public.prevent_frequent_leads()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there's a lead from the same session_id in the last 10 minutes
  IF EXISTS (
    SELECT 1 
    FROM public.leads 
    WHERE session_id = NEW.session_id 
      AND created_at > NOW() - INTERVAL '10 minutes'
  ) THEN
    RAISE EXCEPTION 'Rate limit: Only one lead submission per session every 10 minutes';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;