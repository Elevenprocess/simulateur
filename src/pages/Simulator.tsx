import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { useSimulatorStore } from "@/store/simulator";
import { useAnalyticsContext } from "@/contexts/AnalyticsProvider";
import { useAnalytics } from "@/hooks/useAnalytics";
import { useUtmCapture } from "@/hooks/useUtmCapture";
import { ProgressBar } from "@/components/ui/progress-bar";
import { motion, AnimatePresence } from "framer-motion";
import { HeroStep } from "@/components/simulator/HeroStep";
import { OwnershipStep } from "@/components/simulator/OwnershipStep";
import { BillStep } from "@/components/simulator/BillStep";
import { AddressStep } from "@/components/simulator/AddressStep";
import { EquipmentStep } from "@/components/simulator/EquipmentStep";
import { LoadingStep } from "@/components/simulator/LoadingStep";
import { ContactStep } from "@/components/simulator/ContactStep";
import { TrackingTest } from "@/components/TrackingTest";
import { cn } from "@/lib/utils";

const steps = [
  { component: HeroStep, showProgress: false },
  { component: OwnershipStep, showProgress: true },
  { component: BillStep, showProgress: true },
  { component: AddressStep, showProgress: true },
  { component: EquipmentStep, showProgress: true },
  { component: LoadingStep, showProgress: false },
  { component: ContactStep, showProgress: true },
];

export default function Simulator() {
  const { variantSlug } = useParams();
  const { currentStep, setUtmParams } = useSimulatorStore();
  const { currentVariant, loading } = useAnalyticsContext();
  const analytics = useAnalytics(currentVariant?.id);
  const utmParams = useUtmCapture();
  
  // Store UTM params in zustand store
  useEffect(() => {
    const hasUtmParams = Object.values(utmParams).some(v => v !== null);
    if (hasUtmParams) {
      setUtmParams(utmParams);
    }
  }, [utmParams, setUtmParams]);
  
  const CurrentStepComponent = steps[currentStep]?.component || HeroStep;
  const showProgress = steps[currentStep]?.showProgress;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="w-8 h-8 bg-primary/20 rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Tracking Test Component (only in development) */}
      {process.env.NODE_ENV === 'development' && <TrackingTest />}
      
      {/* Progress Bar */}
      {showProgress && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b">
          <div className="px-4 py-3">
            <ProgressBar currentStep={currentStep > 4 ? 4 : currentStep} totalSteps={4} />
          </div>
        </div>
      )}

      {/* Step Content */}
      <div className={cn("w-full", showProgress && "pt-16")}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            <CurrentStepComponent variant={currentVariant} analytics={analytics} />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
