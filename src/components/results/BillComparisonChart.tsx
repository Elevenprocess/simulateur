import { motion } from "framer-motion";
import { TrendingDown } from "lucide-react";

interface BillComparisonChartProps {
  billBefore: number;
  billAfter: number;
  annualSavings: number;
}

export function BillComparisonChart({
  billBefore,
  billAfter,
  annualSavings,
}: BillComparisonChartProps) {
  const maxBill = billBefore;
  const beforePercent = 100;
  const afterPercent = (billAfter / maxBill) * 100;
  const savingsPercent = Math.round(((billBefore - billAfter) / billBefore) * 100);

  return (
    <div className="p-4 md:p-6 rounded-xl border border-border bg-card">
      <h3 className="text-base md:text-lg font-semibold text-foreground mb-4 md:mb-6">
        Estimation de votre facture
      </h3>
      
      <div className="flex flex-col gap-4">
        {/* Vertical Bars */}
        <div className="flex items-end justify-center gap-8 h-48 md:h-56">
          {/* Before */}
          <div className="flex flex-col items-center h-full">
            <span className="text-sm md:text-base font-medium text-foreground mb-2">
              {billBefore.toLocaleString()} €
            </span>
            <motion.div
              className="w-16 md:w-20 bg-zinc-400 rounded-t-lg flex-1"
              initial={{ height: 0 }}
              animate={{ height: '100%' }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <span className="text-xs md:text-sm text-muted-foreground mt-2 text-center">
              Avant
            </span>
          </div>
          
          {/* After */}
          <div className="flex flex-col items-center" style={{ height: '100%' }}>
            <span className="text-sm md:text-base font-medium text-primary mb-2">
              {billAfter.toLocaleString()} €
            </span>
            <div 
              className="w-16 md:w-20 bg-muted rounded-t-lg overflow-hidden mt-auto"
              style={{ height: `${afterPercent}%` }}
            >
              <motion.div
                className="w-full h-full bg-gradient-to-t from-primary to-primary/80 rounded-t-lg"
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
              />
            </div>
            <span className="text-xs md:text-sm text-muted-foreground mt-2 text-center">
              Après
            </span>
          </div>
        </div>
        
        {/* Savings Card */}
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center gap-4">
          <TrendingDown className="w-6 h-6 text-primary flex-shrink-0" />
          <div className="text-center">
            <motion.div
              className="text-xl md:text-2xl font-bold text-primary"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              {annualSavings.toLocaleString()} € d'économies/an
            </motion.div>
            <p className="text-xs text-primary font-medium">
              soit -{savingsPercent}% sur votre facture
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
