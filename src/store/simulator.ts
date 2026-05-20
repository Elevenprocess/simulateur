import { create } from 'zustand';
import { BillRange, EquipmentType, SOLAR_CONSTANTS, BILL_RANGES, KIT_PRICES, SELF_CONSO_BASE, EQUIPMENT_BONUS, BATTERY_BOOST, AUTO_LIMITS } from '../config/constants';

export interface UtmParams {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  campaign_id: string | null;
}

export interface SimulatorState {
  // Current step (0-5: hero, ownership, bill, address, equipment, contact)
  currentStep: number;
  
  // Form data
  isOwner: boolean;
  billRange: BillRange | null;
  address: {
    formatted: string;
    street: string;
    city: string;
    postalCode: string;
    lat: number | null;
    lng: number | null;
  };
  equipment: EquipmentType[];
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    marketingOptIn: boolean;
    dataProcessingOptIn: boolean;
  };
  
  // UTM tracking params
  utmParams: UtmParams | null;
  
  // Calculated results
  results: {
    consoAnnuelle: number; // kWh/year
    puissanceKWc: number;
    productionKWh: number;
    selfConsoRate: number; // 0-1
    selfConsumedKWh: number;
    surplusKWh: number;
    economie1an: number; // €
    economie10ans: number; // €
    investissementBrut: number; // €
    prime: number; // €
    prixNet: number; // €
    reductionPct: number; // %
    recommendedKit: {
      kwc: 3 | 6;
      withBattery: boolean;
      priceFrom: number | null;
    };
  } | null;
  
  // Actions
  setStep: (step: number) => void;
  setOwnership: (isOwner: boolean) => void;
  setBillRange: (range: BillRange) => void;
  setAddress: (address: SimulatorState['address']) => void;
  setEquipment: (equipment: EquipmentType[]) => void;
  setContact: (contact: SimulatorState['contact']) => void;
  setUtmParams: (utmParams: UtmParams) => void;
  calculateResults: () => void;
  resetSimulator: () => void;
}

const initialState = {
  currentStep: 0,
  isOwner: true,
  billRange: null,
  address: {
    formatted: '',
    street: '',
    city: '',
    postalCode: '',
    lat: null,
    lng: null,
  },
  equipment: [],
  contact: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    marketingOptIn: false,
    dataProcessingOptIn: false,
  },
  utmParams: null,
  results: null,
};

export const useSimulatorStore = create<SimulatorState>((set, get) => ({
  ...initialState,
  
  setStep: (step) => set({ currentStep: step }),
  
  setOwnership: (isOwner) => set({ isOwner }),
  
  setBillRange: (billRange) => set({ billRange }),
  
  setAddress: (address) => set({ address }),
  
  setEquipment: (equipment) => set({ equipment }),
  
  setContact: (contact) => set({ contact }),
  
  setUtmParams: (utmParams) => set({ utmParams }),
  
  calculateResults: () => {
    const state = get();
    if (!state.billRange) return;
    
    // Get bill range data
    const billRangeData = BILL_RANGES.find(range => range.id === state.billRange);
    if (!billRangeData) return;
    
    // Calculate annual consumption
    const factureMensuelle = billRangeData.maxMonthly;
    const consoAnnuelle = (factureMensuelle * 12) / SOLAR_CONSTANTS.TARIF_KWH;
    
    // Select kit size (3 or 6 kWc)
    const kitKWc: 3 | 6 = consoAnnuelle <= 6000 ? 3 : 6;
    const puissanceKWc = kitKWc;
    
    // Solar production
    const productionKWh = puissanceKWc * SOLAR_CONSTANTS.PRODUCTION_FACTOR;
    
    // Self-consumption rate calculation
    const baseRate = SELF_CONSO_BASE[kitKWc];
    const bonus = state.equipment.reduce((sum, eq) => sum + (EQUIPMENT_BONUS[eq] || 0), 0);
    const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val));
    const rateNoBattery = clamp(baseRate + bonus, AUTO_LIMITS.min, AUTO_LIMITS.max);
    
    // Battery recommendation
    const hasBatteryTrigger = state.equipment.some(eq =>
      ['vehicule-electrique', 'ballon-ecs', 'pac-air-eau'].includes(eq)
    );
    const withBattery = hasBatteryTrigger || (kitKWc === 6 && rateNoBattery < 0.45 && consoAnnuelle > 6000);
    const selfConsoRate = withBattery
      ? Math.min(rateNoBattery + BATTERY_BOOST, AUTO_LIMITS.maxWithBattery)
      : rateNoBattery;
    
    // First year savings
    const selfConsumedKWh = productionKWh * selfConsoRate;
    const economie1an = selfConsumedKWh * SOLAR_CONSTANTS.TARIF_KWH;
    
    // 10-year savings with price increases
    let economie10ans = 0;
    for (let year = 0; year < 10; year++) {
      const yearlyEconomy = economie1an * Math.pow(1 + SOLAR_CONSTANTS.ANNUAL_INCREASE, year);
      economie10ans += yearlyEconomy;
    }
    
    // Investment calculations (kept for reference)
    const investissementBrut = puissanceKWc * SOLAR_CONSTANTS.COST_PER_KWC;
    const prime = puissanceKWc * SOLAR_CONSTANTS.AIDE_PER_KWC;
    const prixNet = Math.max(investissementBrut - prime, SOLAR_CONSTANTS.MINIMUM_PRICE);
    
    // Bill reduction percentage
    const annualBill = factureMensuelle * 12;
    const reductionPct = Math.max(40, Math.min(85, Math.round((economie1an / annualBill) * 100)));
    
    const recommendedKit = {
      kwc: kitKWc,
      withBattery,
      priceFrom: KIT_PRICES[kitKWc],
    } as const;
    
    set({
      results: {
        consoAnnuelle: Math.round(consoAnnuelle),
        puissanceKWc,
        productionKWh: Math.round(productionKWh),
        selfConsoRate: Math.round(selfConsoRate * 100) / 100,
        selfConsumedKWh: Math.round(selfConsumedKWh),
        surplusKWh: Math.max(0, Math.round(productionKWh - selfConsumedKWh)),
        economie1an: Math.round(economie1an),
        economie10ans: Math.round(economie10ans),
        investissementBrut: Math.round(investissementBrut),
        prime: Math.round(prime),
        prixNet: Math.round(prixNet),
        reductionPct,
        recommendedKit,
      },
    });
  },
  
  resetSimulator: () => set(initialState),
}));