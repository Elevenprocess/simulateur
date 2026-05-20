// Meta Pixel tracking utilities
declare global {
  interface Window {
    fbq: any;
  }
}

export const trackViewContent = (contentName?: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'ViewContent', {
      content_name: contentName || 'Simulateur Solaire',
      content_category: 'Solar Simulation'
    });
  }
};

export const trackLead = (eventId?: string) => {
  if (typeof window !== 'undefined' && window.fbq) {
    if (eventId) {
      // Pass eventID for server-side deduplication with CAPI
      window.fbq('track', 'Lead', {}, { eventID: eventId });
    } else {
      window.fbq('track', 'Lead');
    }
  }
};

export const trackSchedule = () => {
  if (typeof window !== 'undefined' && window.fbq) {
    window.fbq('track', 'Schedule');
  }
};