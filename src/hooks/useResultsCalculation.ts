import { useMemo } from "react";
import { PowerOption, POWER_CONFIGS, EQUIPMENT_BONUS, AUTO_LIMITS, BATTERY_BOOST, SOLAR_CONSTANTS, BILL_RANGES, BillRange, EquipmentType } from "@/config/constants";

interface CalculationResult {
  productionEstimee: number;
  productionConsommee: number; // in %
  productionConsommeeKwh: number;
  economie1an: number;
  primeAutoconso: number;
  factureBefore: number;
  factureAfter: number;
  selfConsoRate: number;
}

export function useResultsCalculation(
  selectedPower: PowerOption,
  hasBattery: boolean,
  billRange: BillRange | null,
  equipment: EquipmentType[]
): CalculationResult {
  return useMemo(() => {
    const config = POWER_CONFIGS[selectedPower];
    
    // Get annual bill from bill range
    const billData = BILL_RANGES.find(b => b.id === billRange);
    const factureMensuelle = billData?.maxMonthly ?? 150;
    const factureBefore = factureMensuelle * 12;
    
    // Calculate self-consumption rate
    const baseRate = config.baseAutoconsoRate;
    const equipmentBonus = equipment.reduce((sum, eq) => sum + (EQUIPMENT_BONUS[eq] || 0), 0);
    const batteryBonus = hasBattery ? BATTERY_BOOST : 0;
    
    const rawRate = baseRate + equipmentBonus + batteryBonus;
    const selfConsoRate = Math.min(rawRate, hasBattery ? AUTO_LIMITS.maxWithBattery : AUTO_LIMITS.max);
    
    // Calculate production consumed
    const productionEstimee = config.productionEstimee;
    const productionConsommeeKwh = Math.round(productionEstimee * selfConsoRate);
    const productionConsommee = Math.round(selfConsoRate * 100);
    
    // Calculate first year savings
    // Cap savings at 85% of the annual bill to stay realistic but allow differentiation
    const rawSavings = productionConsommeeKwh * SOLAR_CONSTANTS.TARIF_KWH;
    const economie1an = Math.round(Math.min(rawSavings, factureBefore * 0.85));
    
    // Calculate bill after solar
    const factureAfter = Math.max(0, factureBefore - economie1an);
    
    return {
      productionEstimee,
      productionConsommee,
      productionConsommeeKwh,
      economie1an,
      primeAutoconso: config.primeAutoconso,
      factureBefore,
      factureAfter,
      selfConsoRate,
    };
  }, [selectedPower, hasBattery, billRange, equipment]);
}
