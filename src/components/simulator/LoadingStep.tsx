import { useEffect, useRef } from "react";
import { useSimulatorStore } from "@/store/simulator";
import { Calculator, Zap, Sun, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface LoadingStepProps {
  variant?: any;
  analytics?: any;
}

export function LoadingStep({ variant, analytics }: LoadingStepProps) {
  const { calculateResults, setStep } = useSimulatorStore();
  const hasCalculated = useRef(false);

  useEffect(() => {
    // Calculate results only once
    if (!hasCalculated.current) {
      calculateResults();
      hasCalculated.current = true;
    }
    
    // Show loading for 4 seconds then proceed to contact step
    const timer = setTimeout(() => {
      analytics?.trackButtonClick('Calcul terminé', { step: 'loading' }, variant?.id);
      setStep(6); // Go to contact step (index 6)
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const loadingSteps = [
    { icon: Calculator, text: "Analyse de votre consommation...", delay: 0 },
    { icon: Sun, text: "Calcul du potentiel solaire...", delay: 1000 },
    { icon: Zap, text: "Estimation des économies...", delay: 2000 },
    { icon: TrendingUp, text: "Finalisation de votre devis...", delay: 3000 }
  ];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="max-w-md w-full mx-auto text-center space-y-12">
        {/* Main loading animation */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-6"
        >
          <div className="relative w-24 h-24 mx-auto">
            <motion.div
              className="absolute inset-0 rounded-full border-4 border-primary/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <motion.div
              className="absolute inset-2 rounded-full border-4 border-primary border-t-transparent"
              animate={{ rotate: -360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
            <div className="absolute inset-6 flex items-center justify-center">
              <Sun className="w-8 h-8 text-primary" />
            </div>
          </div>

          <h2 className="text-h2 text-foreground font-semibold">
            Calcul en cours...
          </h2>
          <p className="text-body text-muted-foreground">
            Nous analysons vos données pour vous proposer la solution solaire optimale
          </p>
        </motion.div>

        {/* Loading steps */}
        <div className="space-y-4">
          {loadingSteps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: step.delay / 1000, duration: 0.5 }}
              className="flex items-center space-x-3 text-left"
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <step.icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-small text-muted-foreground">{step.text}</span>
            </motion.div>
          ))}
        </div>

        {/* Progress indicator */}
        <motion.div
          className="w-full h-1 bg-muted rounded-full overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-secondary rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 4, ease: "easeInOut" }}
          />
        </motion.div>
      </div>
    </div>
  );
}