import { useSimulatorStore } from "@/store/simulator";
import { Card } from "@/components/ui/card";
import { Zap, Sun, Percent, Gift, MapPin, Users, Phone, CheckCircle, Wrench, LifeBuoy, Clock, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { PowerOption } from "@/config/constants";
import { PowerSelector } from "@/components/results/PowerSelector";
import { BatteryToggle } from "@/components/results/BatteryToggle";
import { BillComparisonChart } from "@/components/results/BillComparisonChart";
import { KPICard } from "@/components/results/KPICard";
import { useResultsCalculation } from "@/hooks/useResultsCalculation";

export default function Results() {
  const { results, contact, address, billRange, equipment, resetSimulator } = useSimulatorStore();
  
  // Debug: Log address coordinates
  console.log('📍 Results page - Address from store:', {
    formatted: address?.formatted,
    lat: address?.lat,
    lng: address?.lng,
    hasCoords: !!(address?.lat && address?.lng)
  });
  
  // Interactive state
  const [selectedPower, setSelectedPower] = useState<PowerOption>(
    (results?.recommendedKit?.kwc as PowerOption) ?? 6
  );
  const [hasBattery, setHasBattery] = useState(results?.recommendedKit?.withBattery ?? false);
  
  // Calculate results based on selections
  const calculation = useResultsCalculation(selectedPower, hasBattery, billRange, equipment);

  useEffect(() => {
    if (!results) {
      window.location.href = '/';
    }
  }, [results]);

  useEffect(() => {
    if (!results) return;
    document.title = `Simulation solaire - ${selectedPower} kWc | Electro Concept OI`;
  }, [results, selectedPower]);

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Redirection en cours...</p>
      </div>
    );
  }

  const handleNewSimulation = () => {
    resetSimulator();
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary py-4 md:py-6 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-lg md:text-2xl font-bold text-primary-foreground">
            Simulation de votre étude solaire
          </h1>
          <div className="flex items-center gap-2 mt-2 text-primary-foreground/80">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs md:text-sm truncate">{address.formatted || "Votre adresse"}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Mobile: Personalization first */}
        <div className="lg:hidden mb-6">
          <Card className="p-4 border-border">
            <h2 className="text-base font-semibold text-foreground mb-2">
              Personnalisez votre simulation
            </h2>
            <div className="space-y-4">
              <PowerSelector
                selectedPower={selectedPower}
                onPowerChange={setSelectedPower}
              />
              <BatteryToggle
                hasBattery={hasBattery}
                onBatteryChange={setHasBattery}
              />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Left Column - KPIs and Chart */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* KPI Cards */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${selectedPower}-${hasBattery}`}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 gap-3 md:gap-4"
              >
                <KPICard
                  title="Production estimée"
                  value={calculation.productionEstimee}
                  suffix=" kWh/an"
                  icon={Sun}
                  variant="primary"
                  delay={0}
                />
                <KPICard
                  title="Production consommée"
                  value={calculation.productionConsommee}
                  suffix=" %"
                  icon={Percent}
                  delay={0.1}
                />
                <KPICard
                  title="Économies 1ère année"
                  value={calculation.economie1an}
                  suffix=" €"
                  icon={Zap}
                  delay={0.2}
                />
                <KPICard
                  title="Prime autoconsommation"
                  value={calculation.primeAutoconso}
                  suffix=" €"
                  icon={Gift}
                  variant="primary"
                  delay={0.3}
                />
              </motion.div>
            </AnimatePresence>

            {/* Bill Comparison Chart */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <BillComparisonChart
                billBefore={calculation.factureBefore}
                billAfter={calculation.factureAfter}
                annualSavings={calculation.economie1an}
              />
            </motion.div>

            {/* Satellite View */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-4 md:p-6 border-border">
                <h3 className="text-base md:text-lg font-semibold text-foreground mb-3 md:mb-4">
                  Votre logement est parfait pour le solaire !
                </h3>
                <div className="w-full h-40 md:h-48 rounded-lg overflow-hidden bg-muted">
                  {address?.lat && address?.lng ? (
                    <img
                      src={`https://maps.googleapis.com/maps/api/staticmap?center=${address.lat},${address.lng}&zoom=19&size=800x400&maptype=satellite&key=AIzaSyB-cjtQhRBqh2JZfo7T5-0gXhzptV4YE7I`}
                      alt="Vue satellite de votre adresse"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Vue satellite non disponible</div>';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
                      Carte non disponible
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Right Column - Personalization Panel (Desktop only) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="hidden lg:block lg:col-span-1"
          >
            <Card className="p-6 border-border sticky top-4">
              <h2 className="text-lg font-semibold text-foreground mb-2">
                Personnalisez votre simulation
              </h2>
              <p className="text-sm text-muted-foreground mb-6">
                Modifiez la puissance installée, ajoutez une batterie pour voir l'impact sur vos économies.
              </p>
              
              <div className="space-y-6">
                <PowerSelector
                  selectedPower={selectedPower}
                  onPowerChange={setSelectedPower}
                />
                
                <BatteryToggle
                  hasBattery={hasBattery}
                  onBatteryChange={setHasBattery}
                />
              </div>

            </Card>
          </motion.div>
        </div>

        {/* Social Proof */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center py-8 mt-8"
        >
          <div className="flex items-center justify-center gap-2 text-primary">
            <Users className="w-5 h-5" />
            <span className="font-semibold">+ 200 foyers déjà équipés dans toute La Réunion</span>
          </div>
        </motion.div>

        {/* Process Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <Card className="p-6 border-border">
            <h3 className="text-lg font-semibold text-foreground mb-6 text-center">
              Les étapes de votre projet solaire
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
              {[
                { icon: Phone, label: "Appel", desc: "5 min" },
                { icon: CheckCircle, label: "Étude personnalisée", desc: "Visio ou sur place" },
                { icon: MapPin, label: "Visite technique", desc: "Sur place" },
                { icon: Clock, label: "Démarches admin", desc: "6 semaines min." },
                { icon: Wrench, label: "Installation", desc: "½ journée" },
                { icon: LifeBuoy, label: "Suivi", desc: "25 ans" },
              ].map((step, i) => (
                <div key={i} className="text-center">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                    <step.icon className="w-5 h-5 md:w-6 md:h-6 text-primary" />
                  </div>
                  <p className="font-medium text-foreground text-xs md:text-sm">{step.label}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {[
            { name: "Marie L.", location: "Saint-Denis", text: "Installation impeccable, équipe professionnelle. Je recommande !" },
            { name: "Jean-Pierre M.", location: "Saint-Pierre", text: "Très satisfait de mon installation 6kWc. Facture divisée par 2 !" },
          ].map((testimonial, i) => (
            <Card key={i} className="p-4 border-border">
              <div className="flex gap-1 mb-2">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                ))}
              </div>
              <p className="text-sm text-muted-foreground mb-2">"{testimonial.text}"</p>
              <p className="text-sm font-medium text-foreground">
                {testimonial.name} - {testimonial.location}
              </p>
            </Card>
          ))}
        </motion.div>

      </div>
    </div>
  );
}
