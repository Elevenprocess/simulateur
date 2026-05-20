import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface UtmParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  campaign_id: string | null;
  fbclid: string | null;  // Facebook Click Identifier
}

interface LeadSubmission {
  contactData: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dataProcessingOptIn: boolean;
    marketingOptIn?: boolean;
  };
  simulationResults: any;
  sessionId: string;
  variantId?: string;
  hcaptchaToken?: string; // Optional now
  utmParams?: UtmParams;  // UTM tracking params
  metaEventId?: string;   // Meta Pixel event ID for CAPI deduplication
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const hcaptchaSecret = Deno.env.get('HCAPTCHA_SECRET_KEY');
    const webhookUrl = Deno.env.get('WEBHOOK_URL');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const submission: LeadSubmission = await req.json();
    console.log('Received lead submission:', { 
      email: submission.contactData.email,
      sessionId: submission.sessionId,
      utmParams: submission.utmParams,
    });

    // Validate required fields
    if (!submission.contactData.firstName || 
        !submission.contactData.lastName || 
        !submission.contactData.email || 
        !submission.contactData.phone ||
        !submission.contactData.dataProcessingOptIn) {
      return new Response(
        JSON.stringify({ error: 'Missing required contact fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify hCaptcha if token provided and secret available
    if (submission.hcaptchaToken && hcaptchaSecret) {
      console.log('Verifying hCaptcha token');
      const hcaptchaResponse = await fetch('https://hcaptcha.com/siteverify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `secret=${hcaptchaSecret}&response=${submission.hcaptchaToken}`,
      });

      const hcaptchaResult = await hcaptchaResponse.json();
      if (!hcaptchaResult.success) {
        console.error('hCaptcha verification failed:', hcaptchaResult);
        return new Response(
          JSON.stringify({ error: 'Captcha verification failed' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      console.log('hCaptcha verification successful');
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(submission.contactData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert lead into database
    console.log('Inserting lead into database');
    const { data: leadData, error: leadError } = await supabase
      .from('leads')
      .insert({
        session_id: submission.sessionId,
        variant_id: submission.variantId || null,
        contact_data: submission.contactData,
        simulation_results: submission.simulationResults,
      })
      .select()
      .single();

    if (leadError) {
      console.error('Error inserting lead:', leadError);
      
      // Check if it's a rate limiting error
      if (leadError.message.includes('Rate limit')) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please wait before submitting again.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw leadError;
    }

    console.log('Lead inserted successfully:', leadData.id);

    // Insert analytics event
    const { error: analyticsError } = await supabase
      .from('analytics_events')
      .insert({
        session_id: submission.sessionId,
        variant_id: submission.variantId || null,
        event_type: 'form_submit',
        event_data: {
          lead_id: leadData.id,
          contact_email: submission.contactData.email,
          has_marketing_opt_in: submission.contactData.marketingOptIn || false,
        },
      });

    if (analyticsError) {
      console.error('Error inserting analytics event:', analyticsError);
      // Don't fail the request for analytics errors
    }

    // Forward to external webhook if configured
    if (webhookUrl) {
      console.log('Forwarding to external webhook');
      try {
        const webhookPayload = {
          contact: submission.contactData,
          results: submission.simulationResults,
          leadId: leadData.id,
          sessionId: submission.sessionId,
          variantId: submission.variantId || null,
          timestamp: new Date().toISOString(),
          // UTM tracking params for CRM
          utm_source: submission.utmParams?.utm_source || null,
          utm_medium: submission.utmParams?.utm_medium || null,      // adset.name
          utm_campaign: submission.utmParams?.utm_campaign || null,  // campaign.name
          utm_content: submission.utmParams?.utm_content || null,    // ad.name
          campaign_id: submission.utmParams?.campaign_id || null,    // campaign.id
          fbclid: submission.utmParams?.fbclid || null,              // Facebook Click Identifier
          // Meta Pixel event ID for CAPI deduplication
          meta_event_id: submission.metaEventId || null,
        };

        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Supabase-Edge-Function/1.0',
          },
          body: JSON.stringify(webhookPayload),
        });

        if (!webhookResponse.ok) {
          console.error('Webhook failed:', webhookResponse.status, await webhookResponse.text());
          // Don't fail the main request if webhook fails
        } else {
          console.log('Webhook forwarded successfully');
        }
      } catch (webhookError) {
        console.error('Webhook error:', webhookError);
        // Don't fail the main request if webhook fails
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        leadId: leadData.id,
        message: 'Lead submitted successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in submit-lead function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});