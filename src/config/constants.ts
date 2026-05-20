// Solar calculation constants for La Réunion
export const SOLAR_CONSTANTS = {
  // Electricity pricing (EDF Réunion 2025)
  TARIF_KWH: 0.195, // € TTC
  
  // Solar production (kWh/kWc/year for La Réunion)
  PRODUCTION_FACTOR: 1400, // Excellent solar irradiation
  
  // Autoconsumption rate
  AUTOCONSO_RATE: 0.40, // 40% typical for residential
  
  // Installation costs
  COST_PER_KWC: 2300, // €/kWc installed
  MINIMUM_PRICE: 2890, // € minimum installation
  
  // Government subsidies (2025)
  AIDE_PER_KWC: 320, // € per kWc
  
  // Electricity price increase
  ANNUAL_INCREASE: 0.05, // 5% per year
  
  // Power sizing thresholds
  POWER_THRESHOLDS: {
    LOW: { max: 4000, power: 3 }, // < 4000 kWh/year → 3 kWc
    MEDIUM: { max: 7500, power: 4.5 }, // 4000-7500 kWh/year → 4.5 kWc
    HIGH: { power: 6 } // > 7500 kWh/year → 6 kWc
  }
} as const;

// Bill range configurations
export const BILL_RANGES = [
  { id: 'low', label: '< 85 €', maxMonthly: 85 },
  { id: 'medium', label: '85 - 165 €', maxMonthly: 165 },
  { id: 'high', label: '> 165 €', maxMonthly: 300 } // Assuming 300€ max for calculation
] as const;

// Equipment options for energy consumption analysis
export const EQUIPMENT_OPTIONS = [
  { id: 'pac-air-air', label: 'PAC air-air', icon: 'Wind' },
  { id: 'pac-air-eau', label: 'PAC air-eau', icon: 'Droplets' },
  { id: 'radiateurs', label: 'Radiateurs électriques', icon: 'Zap' },
  { id: 'climatisation', label: 'Climatisation', icon: 'Snowflake' },
  { id: 'ballon-ecs', label: 'Ballon ECS électrique', icon: 'Bath' },
  { id: 'vehicule-electrique', label: 'Véhicule électrique', icon: 'Car' },
  { id: 'pompe-piscine', label: 'Pompe piscine', icon: 'Waves' },
  { id: 'pac-piscine', label: 'PAC piscine', icon: 'Thermometer' }
] as const;

export type BillRange = typeof BILL_RANGES[number]['id'];
export type EquipmentType = typeof EQUIPMENT_OPTIONS[number]['id'];

// Kit prices (aides déduites) - kept for backward compatibility
export const KIT_PRICES = {
  3: 3490,
  6: 6920,
} as const;

// NEW: Power configurations for interactive results page
export const POWER_CONFIGS = {
  3: {
    productionEstimee: 4037,
    primeAutoconso: 4740,
    baseAutoconsoRate: 0.55,
  },
  6: {
    productionEstimee: 8074,
    primeAutoconso: 5700,
    baseAutoconsoRate: 0.45,
  },
  9: {
    productionEstimee: 12111,
    primeAutoconso: 8550,
    baseAutoconsoRate: 0.38,
  },
} as const;

export type PowerOption = keyof typeof POWER_CONFIGS;

// Base self-consumption by kit size
export const SELF_CONSO_BASE = {
  3: 0.45,
  6: 0.35,
} as const;

// Additional self-consumption bonus by equipment
export const EQUIPMENT_BONUS: Record<EquipmentType, number> = {
  'pompe-piscine': 0.08,
  'vehicule-electrique': 0.05,
  'ballon-ecs': 0.05,
  'pac-air-eau': 0.04,
  'pac-air-air': 0.03,
  'climatisation': 0.03,
  'radiateurs': 0.02,
  'pac-piscine': 0.04,
};

// Auto-consumption bounds and battery effect
export const AUTO_LIMITS = { min: 0.25, max: 0.80, maxWithBattery: 0.95 } as const;
export const BATTERY_BOOST = 0.15 as const; // 15% boost with battery