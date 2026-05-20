-- Create simulator variants table for A/B testing
CREATE TABLE public.simulator_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  traffic_split DECIMAL(3,2) DEFAULT 0.00, -- Percentage of traffic (0.00 to 1.00)
  content JSONB NOT NULL DEFAULT '{}', -- Stores all editable content
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create analytics events table
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID REFERENCES public.simulator_variants(id),
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'page_view', 'step_change', 'button_click', 'form_submit', 'cta_click'
  event_data JSONB DEFAULT '{}',
  step_number INTEGER,
  user_agent TEXT,
  ip_address INET,
  referrer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  variant_id UUID REFERENCES public.simulator_variants(id),
  session_id TEXT NOT NULL,
  contact_data JSONB NOT NULL,
  simulation_results JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create A/B tests table
CREATE TABLE public.ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'running', 'paused', 'completed'
  winner_variant_id UUID REFERENCES public.simulator_variants(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create A/B test variants junction table
CREATE TABLE public.ab_test_variants (
  ab_test_id UUID REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  variant_id UUID REFERENCES public.simulator_variants(id) ON DELETE CASCADE,
  PRIMARY KEY (ab_test_id, variant_id)
);

-- Enable RLS on all tables
ALTER TABLE public.simulator_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;

-- RLS policies for public access (since no auth is implemented yet)
-- These allow read/write access for now, should be restricted later with proper auth

-- Simulator variants policies
CREATE POLICY "Public read access to active variants" 
ON public.simulator_variants 
FOR SELECT 
USING (is_active = true);

CREATE POLICY "Public insert/update access to variants" 
ON public.simulator_variants 
FOR ALL 
USING (true);

-- Analytics events policies (allow all for tracking)
CREATE POLICY "Public insert access to analytics events" 
ON public.analytics_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public read access to analytics events" 
ON public.analytics_events 
FOR SELECT 
USING (true);

-- Leads policies
CREATE POLICY "Public insert access to leads" 
ON public.leads 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Public read access to leads" 
ON public.leads 
FOR SELECT 
USING (true);

-- A/B tests policies
CREATE POLICY "Public access to AB tests" 
ON public.ab_tests 
FOR ALL 
USING (true);

CREATE POLICY "Public access to AB test variants" 
ON public.ab_test_variants 
FOR ALL 
USING (true);

-- Create indexes for better performance
CREATE INDEX idx_analytics_events_variant_id ON public.analytics_events(variant_id);
CREATE INDEX idx_analytics_events_event_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at);
CREATE INDEX idx_analytics_events_session_id ON public.analytics_events(session_id);
CREATE INDEX idx_leads_variant_id ON public.leads(variant_id);
CREATE INDEX idx_leads_created_at ON public.leads(created_at);
CREATE INDEX idx_simulator_variants_slug ON public.simulator_variants(slug);
CREATE INDEX idx_simulator_variants_active ON public.simulator_variants(is_active);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_simulator_variants_updated_at
    BEFORE UPDATE ON public.simulator_variants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ab_tests_updated_at
    BEFORE UPDATE ON public.ab_tests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default variant (the current simulator)
INSERT INTO public.simulator_variants (name, slug, is_active, traffic_split, content) 
VALUES (
    'Version Originale',
    'original',
    true,
    1.00,
    '{
        "heroTitle": "Votre simulation solaire gratuite en 1 minute",
        "heroSubtitle": "Découvrez vos économies avec le solaire à La Réunion",
        "ownershipQuestion": "Êtes-vous propriétaire de votre logement ?",
        "billQuestion": "Quel est le montant de votre facture d''électricité mensuelle ?",
        "equipmentTitle": "Quels équipements possédez-vous ?",
        "equipmentSubtitle": "Sélectionnez tous vos équipments électriques",
        "contactTitle": "Récupérez votre simulation personnalisée",
        "contactSubtitle": "Dernière étape pour recevoir vos résultats détaillés"
    }'::jsonb
);