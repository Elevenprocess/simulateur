import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VariantContent {
  heroTitle?: string;
  heroSubtitle?: string;
  ownershipQuestion?: string;
  billQuestion?: string;
  equipmentTitle?: string;
  equipmentSubtitle?: string;
  contactTitle?: string;
  contactSubtitle?: string;
}

interface SimulatorVariant {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  traffic_split: number;
  content: VariantContent;
}

interface AnalyticsContextType {
  currentVariant: SimulatorVariant | null;
  variantContent: VariantContent;
  loading: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const useAnalyticsContext = () => {
  const context = useContext(AnalyticsContext);
  if (context === undefined) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
};

interface AnalyticsProviderProps {
  children: React.ReactNode;
  variantSlug?: string;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({ 
  children, 
  variantSlug 
}) => {
  const [currentVariant, setCurrentVariant] = useState<SimulatorVariant | null>(null);
  const [loading, setLoading] = useState(true);

  // Default content fallback
  const defaultContent: VariantContent = {
    heroTitle: "Votre simulation solaire gratuite en 1 minute",
    heroSubtitle: "Découvrez vos économies avec le solaire à La Réunion",
    ownershipQuestion: "Êtes-vous propriétaire de votre logement ?",
    billQuestion: "Quel est le montant de votre facture d'électricité mensuelle ?",
    equipmentTitle: "Quels équipements possédez-vous ?",
    equipmentSubtitle: "Sélectionnez tous vos équipments électriques",
    contactTitle: "Récupérez votre simulation personnalisée",
    contactSubtitle: "Dernière étape pour recevoir vos résultats détaillés"
  };

  useEffect(() => {
    const loadVariant = async () => {
      try {
        let query = supabase
          .from('simulator_variants')
          .select('*')
          .eq('is_active', true);

        if (variantSlug) {
          query = query.eq('slug', variantSlug);
        } else {
          // Load original variant or the one with highest traffic split
          query = query.order('traffic_split', { ascending: false });
        }

        const { data, error } = await query.single();

        if (error || !data) {
          console.warn('Failed to load variant, using default:', error);
          // Set a default variant if none found
          setCurrentVariant({
            id: 'default',
            name: 'Default',
            slug: 'original',
            is_active: true,
            traffic_split: 1,
            content: defaultContent
          });
        } else {
          // Safely cast the content from Json to VariantContent
          const variantContent = typeof data.content === 'object' && data.content 
            ? { ...defaultContent, ...data.content as Record<string, any> }
            : defaultContent;
          
          setCurrentVariant({
            ...data,
            content: variantContent
          });
        }
      } catch (error) {
        console.error('Error loading variant:', error);
        // Fallback to default
        setCurrentVariant({
          id: 'default',
          name: 'Default',
          slug: 'original',
          is_active: true,
          traffic_split: 1,
          content: defaultContent
        });
      } finally {
        setLoading(false);
      }
    };

    loadVariant();
  }, [variantSlug]);

  const variantContent = currentVariant?.content || defaultContent;

  return (
    <AnalyticsContext.Provider
      value={{
        currentVariant,
        variantContent,
        loading
      }}
    >
      {children}
    </AnalyticsContext.Provider>
  );
};