import { Switch } from "@/components/ui/switch";
import { Battery } from "lucide-react";

interface BatteryToggleProps {
  hasBattery: boolean;
  onBatteryChange: (hasBattery: boolean) => void;
}

export function BatteryToggle({ hasBattery, onBatteryChange }: BatteryToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Battery className="w-5 h-5 text-primary" />
        </div>
        <div>
          <p className="font-medium text-foreground">Batterie physique</p>
          <p className="text-sm text-muted-foreground">
            Stockez votre surplus d'énergie
          </p>
        </div>
      </div>
      <Switch
        checked={hasBattery}
        onCheckedChange={onBatteryChange}
      />
    </div>
  );
}
