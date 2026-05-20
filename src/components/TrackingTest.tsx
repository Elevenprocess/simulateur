import { useEffect } from 'react';
import { useAnalyticsContext } from '@/contexts/AnalyticsProvider';
import { useAnalytics } from '@/hooks/useAnalytics';

// Test component to verify tracking is working
export const TrackingTest = () => {
  const { currentVariant } = useAnalyticsContext();
  const analytics = useAnalytics(currentVariant?.id);

  useEffect(() => {
    // Test all tracking functions
    const testTracking = async () => {
      console.log('🔍 Testing tracking system...', {
        variant: currentVariant?.name,
        variantId: currentVariant?.id,
        sessionId: analytics.sessionId
      });

      // Test page view tracking
      await analytics.trackPageView(currentVariant?.id);
      console.log('✅ Page view tracked');

      // Test button click tracking
      await analytics.trackButtonClick('Test Button', { test: true }, currentVariant?.id);
      console.log('✅ Button click tracked');

      // Test CTA click tracking
      await analytics.trackCTAClick('test_cta', currentVariant?.id);
      console.log('✅ CTA click tracked');

      console.log('🎯 Tracking system test completed');
    };

    if (currentVariant && analytics) {
      testTracking();
    }
  }, [currentVariant?.id]);

  return null; // This is just a tracking test component
};