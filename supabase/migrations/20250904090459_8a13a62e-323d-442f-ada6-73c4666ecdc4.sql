-- Fix critical privacy vulnerability: Remove public read access to analytics_events table
-- and implement admin-only access

-- Drop the existing public read policy for analytics_events
DROP POLICY IF EXISTS "Public read access to analytics events" ON public.analytics_events;

-- Create secure RLS policy for analytics_events table - only admins can read
CREATE POLICY "Only admins can view analytics events" 
ON public.analytics_events 
FOR SELECT 
TO authenticated
USING (public.is_admin(auth.uid()));

-- Keep the existing public insert policy (app needs to track events)
-- The "Public insert access to analytics events" policy remains unchanged