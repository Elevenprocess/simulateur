-- Fix remaining functions without proper search_path

-- Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Fix get_variant_performance function
CREATE OR REPLACE FUNCTION public.get_variant_performance(start_date timestamp with time zone)
RETURNS TABLE(variant_id uuid, variant_name text, views bigint, leads bigint, cta_clicks bigint, conversion_rate numeric)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sv.id as variant_id,
    sv.name as variant_name,
    COALESCE(views.view_count, 0) as views,
    COALESCE(leads.lead_count, 0) as leads,
    COALESCE(cta.cta_count, 0) as cta_clicks,
    CASE 
      WHEN COALESCE(views.view_count, 0) > 0 THEN 
        ROUND((COALESCE(leads.lead_count, 0)::numeric / views.view_count::numeric) * 100, 2)
      ELSE 0
    END as conversion_rate
  FROM 
    public.simulator_variants sv
  LEFT JOIN (
    SELECT 
      variant_id, 
      COUNT(*) as view_count
    FROM public.analytics_events
    WHERE event_type = 'page_view' 
      AND created_at >= start_date
    GROUP BY variant_id
  ) views ON sv.id = views.variant_id
  LEFT JOIN (
    SELECT 
      variant_id, 
      COUNT(*) as lead_count
    FROM public.leads
    WHERE created_at >= start_date
    GROUP BY variant_id
  ) leads ON sv.id = leads.variant_id
  LEFT JOIN (
    SELECT 
      variant_id, 
      COUNT(*) as cta_count
    FROM public.analytics_events
    WHERE event_type = 'cta_click' 
      AND created_at >= start_date
    GROUP BY variant_id
  ) cta ON sv.id = cta.variant_id
  ORDER BY conversion_rate DESC, views DESC;
END;
$$;