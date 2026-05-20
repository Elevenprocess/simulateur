import { useSimulatorStore } from "@/store/simulator";
import { Button } from "@/components/ui/custom-button";
import { EQUIPMENT_OPTIONS, EquipmentType } from "@/config/constants";
import { Checkbox } from "@/components/ui/checkbox";
import { Settings, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import * as LucideIcons from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
interface EquipmentStepProps {
  variant?: any;
  analytics?: any;
}

export function EquipmentStep({ variant, analytics }: EquipmentStepProps) {
  const { equipment, setEquipment, setStep } = useSimulatorStore();
  const isMobile = useIsMobile();

  const handleEquipmentToggle = (equipmentId: EquipmentType) => {
    const newEquipment = equipment.includes(equipmentId)
      ? equipment.filter(id => id !== equipmentId)
      : [...equipment, equipmentId];
    
    analytics?.trackButtonClick(
      `Equipment: ${EQUIPMENT_OPTIONS.find(e => e.id === equipmentId)?.label}`, 
      { step: 'equipment', action: equipment.includes(equipmentId) ? 'remove' : 'add', equipment: equipmentId }, 
      variant?.id
    );
    
    setEquipment(newEquipment);
  };

  const handleContinue = () => {
    analytics?.trackButtonClick('Continuer', { step: 'equipment', selectedCount: equipment.length }, variant?.id);
    setStep(5);
  };

  const getIcon = (iconName: string) => {
    const IconComponent = (LucideIcons as any)[iconName];
    return IconComponent ? <IconComponent className="w-5 h-5 text-primary" /> : null;
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
          <Settings className="w-16 h-16 text-primary mx-auto" />
          <h2 className="text-h2 text-foreground">
            {variant?.content?.equipmentTitle || "Quels équipements électriques avez-vous ?"}
          </h2>
          <p className="text-body text-muted-foreground">
            {variant?.content?.equipmentSubtitle || "Cette information nous aide à mieux évaluer votre consommation"}
          </p>
        </motion.div>

        {/* Equipment options */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-3"
        >
          {isMobile ? (
            <div className="relative">
              <Carousel opts={{ align: "start" }}>
                <CarouselContent>
                  {EQUIPMENT_OPTIONS.map((option, index) => (
                    <CarouselItem key={option.id} className="basis-[85%]">
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.3 + index * 0.05 }}
                      >
                        <label className="flex items-center space-x-3 p-5 rounded-xl border border-border hover:border-primary/50 cursor-pointer transition-colors group">
                          <Checkbox
                            checked={equipment.includes(option.id)}
                            onCheckedChange={() => handleEquipmentToggle(option.id)}
                            className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          />
                          <div className="flex items-center space-x-4 flex-1">
                            <div className="p-3 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              {getIcon(option.icon)}
                            </div>
                            <span className="text-body font-medium">{option.label}</span>
                          </div>
                        </label>
                      </motion.div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="-left-6" />
                <CarouselNext className="-right-6" />
              </Carousel>
            </div>
          ) : (
            <>
              {EQUIPMENT_OPTIONS.map((option, index) => (
                <motion.div
                  key={option.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 + index * 0.05 }}
                >
                  <label className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:border-primary/50 cursor-pointer transition-colors group">
                    <Checkbox
                      checked={equipment.includes(option.id)}
                      onCheckedChange={() => handleEquipmentToggle(option.id)}
                      className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    
                    <div className="flex items-center space-x-3 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                        {getIcon(option.icon)}
                      </div>
                      <span className="text-body font-medium">{option.label}</span>
                    </div>
                  </label>
                </motion.div>
              ))}
            </>
          )}
        </motion.div>

        {/* Optional message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <p className="text-small text-muted-foreground">
            Vous pouvez ne sélectionner aucun équipement et continuer
          </p>
        </motion.div>

        {/* Continue button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <Button
            variant="cta"
            onClick={handleContinue}
            className="w-full"
          >
            Continuer
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </motion.div>

        {/* Equipment count */}
        {equipment.length > 0 && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <p className="text-small text-primary font-medium">
              {equipment.length} équipement{equipment.length > 1 ? 's' : ''} sélectionné{equipment.length > 1 ? 's' : ''}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}