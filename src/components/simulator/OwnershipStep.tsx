import { useSimulatorStore } from "@/store/simulator";
import { Button } from "@/components/ui/custom-button";
import { Home, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

interface OwnershipStepProps {
  variant?: any;
  analytics?: any;
}

export function OwnershipStep({ variant, analytics }: OwnershipStepProps) {
  const { isOwner, setOwnership, setStep } = useSimulatorStore();

  const handleOwnershipSelect = (owner: boolean) => {
    analytics?.trackButtonClick(owner ? 'Oui - Propriétaire' : 'Non - Locataire', { step: 'ownership' }, variant?.id);
    setOwnership(owner);
    if (owner) {
      // Continue to next step
      setTimeout(() => setStep(2), 300);
    }
  };

  if (!isOwner && isOwner !== undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-md w-full mx-auto text-center space-y-6 p-8 bg-destructive/5 rounded-2xl border border-destructive/20"
        >
          <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
          <h2 className="text-h2 text-foreground">
            Service réservé aux propriétaires
          </h2>
          <p className="text-body text-muted-foreground">
            Notre simulateur est destiné aux propriétaires souhaitant installer des panneaux solaires sur leur toit.
          </p>
          <Button 
            variant="outline" 
            onClick={() => setOwnership(true)}
            className="w-full"
          >
            Retour
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Question */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-4"
        >
          <Home className="w-16 h-16 text-primary mx-auto" />
          <h2 className="text-h2 text-foreground">
            {variant?.content?.ownershipQuestion || "Êtes-vous propriétaire de votre logement ?"}
          </h2>
          <p className="text-body text-muted-foreground">
            Cette information nous permet de vous proposer les bonnes solutions
          </p>
        </motion.div>

        {/* Options */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          <Button
            variant="choice"
            size="choice"
            onClick={() => handleOwnershipSelect(true)}
            data-selected={isOwner === true}
            className="w-full text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                {isOwner === true && <div className="w-2 h-2 bg-primary rounded-full" />}
              </div>
              <span>Oui, je suis propriétaire</span>
            </div>
          </Button>

          <Button
            variant="choice"
            size="choice"
            onClick={() => handleOwnershipSelect(false)}
            data-selected={isOwner === false}
            className="w-full text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                {isOwner === false && <div className="w-2 h-2 bg-primary rounded-full" />}
              </div>
              <span>Non, je suis locataire</span>
            </div>
          </Button>
        </motion.div>
      </div>
    </div>
  );
}