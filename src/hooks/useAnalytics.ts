import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSimulatorStore } from '@/store/simulator';

// Generate a session ID that persists during the browser session
const getSessionId = () => {
  let sessionId = sessionStorage.getItem('simulator_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('simulator_session_id', sessionId);
  }
  return sessionId;
};

export const useAnalytics = (variantId?: string) => {
  const { currentStep } = useSimulatorStore();
  const lastStepRef = useRef<number | null>(null);

  // Track page view
  const trackPageView = async (variant_id?: string) => {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          variant_id: variant_id || null,
          session_id: getSessionId(),
          event_type: 'page_view',
          event_data: {
            url: window.location.pathname + window.location.search,
            title: document.title
          },
          user_agent: navigator.userAgent,
          referrer: document.referrer || null
        });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  };

  // Track step changes
  const trackStepChange = async (stepNumber: number, variant_id?: string) => {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          variant_id: variant_id || null,
          session_id: getSessionId(),
          event_type: 'step_change',
          event_data: {
            step: stepNumber
          },
          step_number: stepNumber,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Failed to track step change:', error);
    }
  };

  // Track button clicks
  const trackButtonClick = async (buttonLabel: string, context?: any, variant_id?: string) => {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          variant_id: variant_id || null,
          session_id: getSessionId(),
          event_type: 'button_click',
          event_data: {
            button_label: buttonLabel,
            context
          },
          step_number: currentStep,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Failed to track button click:', error);
    }
  };

  // Track CTA clicks (important conversions)
  const trackCTAClick = async (ctaType: string, variant_id?: string) => {
    try {
      await supabase
        .from('analytics_events')
        .insert({
          variant_id: variant_id || null,
          session_id: getSessionId(),
          event_type: 'cta_click',
          event_data: {
            cta_type: ctaType
          },
          step_number: currentStep,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Failed to track CTA click:', error);
    }
  };

  // Track form submissions (leads) - only tracks analytics event
  // Actual lead insertion is handled by the submit-lead edge function
  const trackLead = async (contactData: any, simulationResults: any, variant_id?: string) => {
    try {
      // Track as an analytics event only (lead insertion is done by edge function)
      await supabase
        .from('analytics_events')
        .insert({
          variant_id: variant_id || null,
          session_id: getSessionId(),
          event_type: 'form_submit',
          event_data: {
            lead_generated: true
          },
          step_number: currentStep,
          user_agent: navigator.userAgent
        });
    } catch (error) {
      console.error('Failed to track lead:', error);
    }
  };

  // Auto-track step changes
  useEffect(() => {
    if (currentStep !== lastStepRef.current && lastStepRef.current !== null) {
      trackStepChange(currentStep, variantId);
    }
    lastStepRef.current = currentStep;
  }, [currentStep, variantId]);

  // Track initial page view
  useEffect(() => {
    trackPageView(variantId);
  }, [variantId]);

  return {
    trackPageView,
    trackStepChange,
    trackButtonClick,
    trackCTAClick,
    trackLead,
    sessionId: getSessionId()
  };
};