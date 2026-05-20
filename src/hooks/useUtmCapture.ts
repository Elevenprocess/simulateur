import { useEffect, useState } from 'react';

export interface UtmParams {
  utm_source: string | null;
  utm_medium: string | null;    // adset.name
  utm_campaign: string | null;  // campaign.name
  utm_content: string | null;   // ad.name
  campaign_id: string | null;   // campaign.id
  fbclid: string | null;        // Facebook Click Identifier
}

const UTM_STORAGE_KEY = 'simulator_utm_params';

export function useUtmCapture(): UtmParams {
  const [utmParams, setUtmParams] = useState<UtmParams>(() => {
    // Try to get from sessionStorage first
    try {
      const stored = sessionStorage.getItem(UTM_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.log('Could not read UTM from sessionStorage');
    }
    
    return {
      utm_source: null,
      utm_medium: null,
      utm_campaign: null,
      utm_content: null,
      campaign_id: null,
      fbclid: null,
    };
  });

  useEffect(() => {
    // Parse UTM params from URL
    const searchParams = new URLSearchParams(window.location.search);
    
    const newUtmParams: UtmParams = {
      utm_source: searchParams.get('utm_source'),
      utm_medium: searchParams.get('utm_medium'),
      utm_campaign: searchParams.get('utm_campaign'),
      utm_content: searchParams.get('utm_content'),
      campaign_id: searchParams.get('campaign_id'),
      fbclid: searchParams.get('fbclid'),
    };
    
    // Only update if we have at least one UTM param
    const hasUtmParams = Object.values(newUtmParams).some(v => v !== null);
    
    if (hasUtmParams) {
      console.log('📊 UTM params captured:', newUtmParams);
      setUtmParams(newUtmParams);
      
      // Store in sessionStorage for persistence
      try {
        sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(newUtmParams));
      } catch (e) {
        console.log('Could not store UTM in sessionStorage');
      }
    }
  }, []);

  return utmParams;
}
