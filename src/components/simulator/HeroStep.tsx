import { useSimulatorStore } from "@/store/simulator";
import { Button } from "@/components/ui/custom-button";
import { Sun, Zap, Euro } from "lucide-react";
import { motion } from "framer-motion";
import { trackViewContent } from "@/lib/meta-pixel";

interface HeroStepProps {
  variant?: any;
  analytics?: any;
}

export function HeroStep({ variant, analytics }: HeroStepProps) {
  const { setStep } = useSimulatorStore();

  const handleStart = () => {
    trackViewContent('Démarrage Simulateur');
    analytics?.trackButtonClick('Commencer mon estimation', { step: 'hero' }, variant?.id);
    setStep(1);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-subtle-gradient">
      <div className="max-w-md w-full mx-auto text-center space-y-8">
        {/* Logo placeholder - will use provided logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <img 
            src="/lovable-uploads/399d16ca-1a7b-46ce-80ef-929355ae689b.png" 
            alt="Electro Concept OI" 
            className="h-20 mx-auto"
          />
        </motion.div>

        {/* Hero Content */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6"
        >
          <h1 className="text-h1 text-foreground leading-tight">
            {variant?.content?.heroTitle || "Estimation de votre projet solaire en 1 minute"}
          </h1>
          
          <p className="text-body text-muted-foreground">
            {variant?.content?.heroSubtitle || "Découvrez vos économies potentielles avec une installation solaire sur mesure à La Réunion"}
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-3 gap-4 py-6"
        >
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Sun className="w-6 h-6 text-primary" />
            </div>
            <p className="text-small text-muted-foreground">Solaire adapté</p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Euro className="w-6 h-6 text-primary" />
            </div>
            <p className="text-small text-muted-foreground">Aides déduites</p>
          </div>
          
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <p className="text-small text-muted-foreground">Installation pro</p>
          </div>
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Button 
            variant="hero" 
            size="xl" 
            onClick={handleStart}
            className="w-full"
          >
            Commencer mon estimation
          </Button>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center space-y-2"
        >
          <p className="text-small text-muted-foreground">
            ✓ Gratuit et sans engagement
          </p>
          <p className="text-small text-muted-foreground">
            ✓ + de 200 foyers équipés à La Réunion
          </p>
        </motion.div>

      </div>
    </div>
  );
}