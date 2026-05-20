import { useState, useEffect } from "react";
import { useSimulatorStore } from "@/store/simulator";
import { Button } from "@/components/ui/custom-button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { User, Mail, Phone, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { trackLead } from '@/lib/meta-pixel';
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ContactStepProps {
  variant?: any;
  analytics?: any;
}

const PHONE_PREFIXES = [
  { value: '+262', label: '+262', flag: '🇷🇪', country: 'Réunion' },
  { value: '+33', label: '+33', flag: '🇫🇷', country: 'France' },
];

// Format phone number: 06 92 01 02 03 (pairs of 2 digits)
const formatPhoneNumber = (value: string): string => {
  const digits = value.replace(/\D/g, '');
  
  if (digits.length === 0) return '';
  
  let formatted = '';
  
  // Groups of 2 digits
  for (let i = 0; i < digits.length && i < 10; i += 2) {
    if (i > 0) formatted += ' ';
    formatted += digits.slice(i, Math.min(i + 2, 10));
  }
  
  return formatted;
};

// Extract raw digits from formatted phone (removes leading 0 for international format)
const extractDigits = (value: string): string => {
  const digits = value.replace(/\D/g, '').slice(0, 10);
  // Remove leading 0 for international format
  return digits.startsWith('0') ? digits.slice(1) : digits;
};

// Get raw digits without removing 0 (for validation)
const getRawDigits = (value: string): string => {
  return value.replace(/\D/g, '').slice(0, 10);
};

export function ContactStep({ variant, analytics }: ContactStepProps) {
  const { contact, setContact, calculateResults, results, address } = useSimulatorStore();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phonePrefix, setPhonePrefix] = useState<string>('+262');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Auto-detect location on mount
  useEffect(() => {
    detectLocation();
  }, []);

  const detectLocation = async () => {
    try {
      // Try to detect location using timezone
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      // Check if timezone indicates Réunion
      if (timezone.includes('Reunion') || timezone.includes('Indian/Reunion')) {
        setPhonePrefix('+262');
        return;
      }
      
      // Check if timezone indicates France
      if (timezone.includes('Paris') || timezone.includes('Europe/Paris')) {
        setPhonePrefix('+33');
        return;
      }
      
      // Fallback: check address from simulator store
      if (address?.formatted) {
        if (address.formatted.includes('Réunion') || address.formatted.includes('974')) {
          setPhonePrefix('+262');
        } else if (address.formatted.includes('France')) {
          setPhonePrefix('+33');
        }
      }
    } catch (error) {
      console.log('Location detection failed, using default +262');
    }
  };

  // Update contact phone whenever prefix or number changes
  useEffect(() => {
    const rawDigits = extractDigits(phoneNumber);
    const fullPhone = rawDigits ? `${phonePrefix}${rawDigits}` : '';
    setContact({ ...contact, phone: fullPhone });
  }, [phonePrefix, phoneNumber]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!contact.firstName.trim()) {
      newErrors.firstName = "Le prénom est requis";
    }

    if (!contact.lastName.trim()) {
      newErrors.lastName = "Le nom est requis";
    }

    if (!contact.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/\S+@\S+\.\S+/.test(contact.email)) {
      newErrors.email = "Format d'email invalide";
    }

    const rawDigits = getRawDigits(phoneNumber);
    // Remove leading 0 for validation
    const digitsWithout0 = rawDigits.startsWith('0') ? rawDigits.slice(1) : rawDigits;
    
    if (!rawDigits) {
      newErrors.phone = "Le téléphone est requis";
    } else if (digitsWithout0.length !== 9) {
      newErrors.phone = "Numéro de téléphone invalide (9 chiffres après le 0)";
    } else if (phonePrefix === '+33') {
      // For +33: must start with 6 or 7, but NOT 692 or 693
      const firstDigit = digitsWithout0.charAt(0);
      const firstThree = digitsWithout0.slice(0, 3);
      if (firstDigit !== '6' && firstDigit !== '7') {
        newErrors.phone = "Numéro mobile invalide pour la France (doit commencer par 06 ou 07)";
      } else if (firstThree === '692' || firstThree === '693') {
        newErrors.phone = "Ce numéro correspond à La Réunion, sélectionnez +262";
      }
    } else if (phonePrefix === '+262') {
      // For +262: must start with 692 or 693
      const firstThree = digitsWithout0.slice(0, 3);
      if (firstThree !== '692' && firstThree !== '693') {
        newErrors.phone = "Numéro invalide pour La Réunion (doit commencer par 0692 ou 0693)";
      }
    }

    if (!contact.dataProcessingOptIn) {
      newErrors.dataProcessingOptIn = "Vous devez accepter le traitement des données";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Generate unique event ID for Meta Pixel deduplication with CAPI
      const metaEventId = crypto.randomUUID();
      
      // Track the lead in analytics FIRST
      if (analytics) {
        await analytics.trackLead(contact, results, variant?.id);
        console.log('✅ Lead tracked in analytics with variant:', variant?.id);
      }

      // Track the lead conversion for Meta Pixel with event ID for deduplication
      trackLead(metaEventId);
      console.log('✅ Lead tracked in Meta Pixel with eventID:', metaEventId);
      
      const state = useSimulatorStore.getState();
      
      // Prepare secure submission data
      const submissionData = {
        contactData: {
          firstName: contact.firstName,
          lastName: contact.lastName,
          email: contact.email,
          phone: contact.phone,
          dataProcessingOptIn: contact.dataProcessingOptIn,
          marketingOptIn: contact.marketingOptIn,
        },
        simulationResults: {
          billRange: state.billRange,
          puissanceKWc: state.results?.puissanceKWc || 0,
          economie1an: state.results?.economie1an || 0,
          economie10ans: state.results?.economie10ans || 0,
          reductionPct: state.results?.reductionPct || 0,
          prixNet: state.results?.prixNet || 0,
          equipment: state.equipment,
          address: {
            formatted: state.address.formatted,
            street: state.address.street || '',
            city: state.address.city || '',
            postalCode: state.address.postalCode || '',
          },
          variantId: variant?.id,
          variantName: variant?.name,
        },
        sessionId: analytics?.sessionId || 'no-session',
        variantId: variant?.id,
        // UTM tracking params for CRM
        utmParams: state.utmParams,
        // Meta Pixel event ID for CAPI deduplication
        metaEventId: metaEventId,
      };

      // Submit via secure Edge Function
      const { data, error } = await supabase.functions.invoke('submit-lead', {
        body: submissionData
      });

      if (error) {
        console.error('Submission error:', error);
        
        if (error.message?.includes('Rate limit')) {
          toast({
            title: "Trop de tentatives",
            description: "Veuillez attendre avant de soumettre à nouveau.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erreur de soumission",
            description: "Une erreur est survenue. Veuillez réessayer.",
            variant: "destructive",
          });
        }
        return;
      }

      if (data?.success) {
        toast({
          title: "Estimation envoyée !",
          description: "Vous allez recevoir votre estimation par email.",
        });
        
        // Navigate to results
        navigate('/resultats');
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateContact = (field: keyof typeof contact, value: any) => {
    setContact({ ...contact, [field]: value });
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' });
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatPhoneNumber(rawValue);
    setPhoneNumber(formatted);
    
    // Clear phone error
    if (errors.phone) {
      setErrors({ ...errors, phone: '' });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      <div className="max-w-md w-full mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="text-center space-y-4"
        >
          <Calendar className="w-16 h-16 text-primary mx-auto" />
          <h2 className="text-h2 text-foreground">
            {variant?.content?.contactTitle || "Recevez votre estimation personnalisée"}
          </h2>
          <p className="text-body text-muted-foreground">
            {variant?.content?.contactSubtitle || "Dernière étape : vos coordonnées pour recevoir les résultats"}
          </p>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {/* First name */}
          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Prénom *"
                value={contact.firstName}
                onChange={(e) => updateContact('firstName', e.target.value)}
                className={`pl-10 h-12 ${errors.firstName ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.firstName && (
              <p className="text-small text-destructive">{errors.firstName}</p>
            )}
          </div>

          {/* Last name */}
          <div className="space-y-1">
            <div className="relative">
              <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Nom *"
                value={contact.lastName}
                onChange={(e) => updateContact('lastName', e.target.value)}
                className={`pl-10 h-12 ${errors.lastName ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.lastName && (
              <p className="text-small text-destructive">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-1">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
              <Input
                type="email"
                placeholder="Email *"
                value={contact.email}
                onChange={(e) => updateContact('email', e.target.value)}
                className={`pl-10 h-12 ${errors.email ? 'border-destructive' : ''}`}
              />
            </div>
            {errors.email && (
              <p className="text-small text-destructive">{errors.email}</p>
            )}
          </div>

          {/* Phone with separate prefix */}
          <div className="space-y-1">
            <div className="flex gap-2">
              {/* Prefix selector */}
              <Select value={phonePrefix} onValueChange={setPhonePrefix}>
                <SelectTrigger className={`w-28 h-12 bg-background ${errors.phone ? 'border-destructive' : ''}`}>
                  <SelectValue>
                    {PHONE_PREFIXES.find(p => p.value === phonePrefix)?.flag} {phonePrefix}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background border border-border z-50">
                  {PHONE_PREFIXES.map((prefix) => (
                    <SelectItem key={prefix.value} value={prefix.value}>
                      <span className="flex items-center gap-2">
                        <span>{prefix.flag}</span>
                        <span>{prefix.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Phone number input */}
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="06 92 01 02 03 *"
                  value={phoneNumber}
                  onChange={handlePhoneChange}
                  className={`pl-10 h-12 ${errors.phone ? 'border-destructive' : ''}`}
                  maxLength={14} // "06 92 01 02 03" = 14 chars with spaces
                />
              </div>
            </div>
            {errors.phone && (
              <p className="text-small text-destructive">{errors.phone}</p>
            )}
          </div>
        </motion.div>

        {/* Opt-ins */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          {/* Data processing consent (required) */}
          <div className="space-y-2">
            <label className="flex items-start space-x-3 cursor-pointer">
              <Checkbox
                checked={contact.dataProcessingOptIn}
                onCheckedChange={(checked) => updateContact('dataProcessingOptIn', checked)}
                className={`mt-1 ${errors.dataProcessingOptIn ? 'border-destructive' : ''}`}
              />
              <span className="text-small text-foreground leading-relaxed">
                J'accepte que mes données soient traitées pour recevoir mon estimation et être recontacté par Electro Concept OI *
              </span>
            </label>
            {errors.dataProcessingOptIn && (
              <p className="text-small text-destructive ml-6">{errors.dataProcessingOptIn}</p>
            )}
          </div>

          {/* Marketing consent (optional) */}
          <label className="flex items-start space-x-3 cursor-pointer">
            <Checkbox
              checked={contact.marketingOptIn}
              onCheckedChange={(checked) => updateContact('marketingOptIn', checked)}
              className="mt-1"
            />
            <span className="text-small text-muted-foreground leading-relaxed">
              J'accepte de recevoir des informations commerciales sur les solutions d'énergie renouvelable
            </span>
          </label>
        </motion.div>

        {/* Submit button */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            variant="cta"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full"
          >
            {isSubmitting ? "Calcul en cours..." : "Recevoir mon estimation"}
          </Button>
        </motion.div>

        {/* Legal note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center"
        >
          <p className="text-small text-muted-foreground">
            * Champs obligatoires
          </p>
        </motion.div>
      </div>
    </div>
  );
}
