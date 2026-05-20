import { motion } from "framer-motion";
import { PowerOption } from "@/config/constants";
import { cn } from "@/lib/utils";

interface PowerSelectorProps {
  selectedPower: PowerOption;
  onPowerChange: (power: PowerOption) => void;
}

const powerOptions: { value: PowerOption; label: string }[] = [
  { value: 3, label: "3 kWc" },
  { value: 6, label: "6 kWc" },
  { value: 9, label: "9 kWc" },
];

export function PowerSelector({ selectedPower, onPowerChange }: PowerSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground">
        Puissance de l'installation
      </label>
      <div className="grid grid-cols-3 gap-2">
        {powerOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onPowerChange(option.value)}
            className={cn(
              "relative px-4 py-3 rounded-lg border-2 transition-all duration-200 font-medium",
              selectedPower === option.value
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/50"
            )}
          >
            {selectedPower === option.value && (
              <motion.div
                layoutId="power-selector"
                className="absolute inset-0 bg-primary/10 rounded-lg"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
