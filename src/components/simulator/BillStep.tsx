import { useSimulatorStore } from "@/store/simulator";
import { Button } from "@/components/ui/custom-button";
import { BILL_RANGES, BillRange } from "@/config/constants";
import { Receipt, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

interface BillStepProps {
  variant?: any;
  analytics?: any;
}

export function BillStep({ variant, analytics }: BillStepProps) {
  const { billRange, setBillRange, setStep } = useSimulatorStore();

  const handleBillSelect = (range: BillRange) => {
    analytics?.trackButtonClick(`Facture: ${BILL_RANGES.find(r => r.id === range)?.label}`, { step: 'bill', range }, variant?.id);
    setBillRange(range);
    // Auto-continue to next step
    setTimeout(() => setStep(3), 300);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Question */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-4"
        >
          <Receipt className="w-16 h-16 text-primary mx-auto" />
          <h2 className="text-h2 text-foreground">
            {variant?.content?.billQuestion || "Quel est le montant de votre facture d'électricité mensuelle ?"}
          </h2>
          <p className="text-body text-muted-foreground">
            Cette information nous aide à dimensionner votre installation solaire
          </p>
        </motion.div>

        {/* Bill range options */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {BILL_RANGES.map((range, index) => (
            <motion.div
              key={range.id}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 + index * 0.1 }}
            >
              <Button
                variant="choice"
                size="choice"
                onClick={() => handleBillSelect(range.id)}
                data-selected={billRange === range.id}
                className="w-full"
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3">
                    <div className="w-4 h-4 rounded-full border-2 border-primary flex items-center justify-center">
                      {billRange === range.id && <div className="w-2 h-2 bg-primary rounded-full" />}
                    </div>
                    <span className="font-medium">{range.label}</span>
                  </div>
                  
                  {/* Show potential savings hint */}
                  <div className="flex items-center space-x-1 text-primary text-small">
                    <TrendingUp className="w-4 h-4" />
                    <span>
                      {range.id === 'low' && '30-50%'}
                      {range.id === 'medium' && '40-60%'}
                      {range.id === 'high' && '50-70%'}
                    </span>
                  </div>
                </div>
              </Button>
            </motion.div>
          ))}
        </motion.div>

        {/* Additional info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-small text-muted-foreground">
            💡 Vos économies potentielles sont indiquées à droite
          </p>
        </motion.div>
      </div>
    </div>
  );
}