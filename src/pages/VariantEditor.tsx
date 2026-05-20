import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';

interface VariantData {
  id?: string;
  name: string;
  slug: string;
  is_active: boolean;
  traffic_split: number;
  content: {
    heroTitle: string;
    heroSubtitle: string;
    ownershipQuestion: string;
    billQuestion: string;
    equipmentTitle: string;
    equipmentSubtitle: string;
    contactTitle: string;
    contactSubtitle: string;
  };
}

export default function VariantEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [variant, setVariant] = useState<VariantData>({
    name: '',
    slug: '',
    is_active: true,
    traffic_split: 0,
    content: {
      heroTitle: "Votre simulation solaire gratuite en 1 minute",
      heroSubtitle: "Découvrez vos économies avec le solaire à La Réunion",
      ownershipQuestion: "Êtes-vous propriétaire de votre logement ?",
      billQuestion: "Quel est le montant de votre facture d'électricité mensuelle ?",
      equipmentTitle: "Quels équipements possédez-vous ?",
      equipmentSubtitle: "Sélectionnez tous vos équipments électriques",
      contactTitle: "Récupérez votre simulation personnalisée",
      contactSubtitle: "Dernière étape pour recevoir vos résultats détaillés"
    }
  });

  const isEditing = id !== 'new';

  useEffect(() => {
    if (isEditing) {
      loadVariant();
    }
  }, [id]);

  const loadVariant = async () => {
    if (!id || id === 'new') return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('simulator_variants')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      // Safely cast the content from Json to VariantContent
      const variantContent = typeof data.content === 'object' && data.content 
        ? { ...variant.content, ...data.content as Record<string, any> }
        : variant.content;
      
      setVariant({
        ...data,
        traffic_split: data.traffic_split * 100, // Convert from decimal to percentage
        content: variantContent
      });
    } catch (error) {
      console.error('Error loading variant:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la variante",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Generate slug from name if not provided
      if (!variant.slug) {
        variant.slug = variant.name
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '');
      }

      if (isEditing) {
        const { error } = await supabase
          .from('simulator_variants')
          .update({
            name: variant.name,
            slug: variant.slug,
            is_active: variant.is_active,
            traffic_split: variant.traffic_split / 100, // Convert percentage to decimal
            content: variant.content
          })
          .eq('id', id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('simulator_variants')
          .insert({
            name: variant.name,
            slug: variant.slug,
            is_active: variant.is_active,
            traffic_split: variant.traffic_split / 100, // Convert percentage to decimal
            content: variant.content
          });

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: `Variante ${isEditing ? 'modifiée' : 'créée'} avec succès`
      });

      navigate('/admin');
    } catch (error) {
      console.error('Error saving variant:', error);
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder la variante",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updateContent = (field: keyof typeof variant.content, value: string) => {
    setVariant(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-brand-gradient text-white py-6">
        <div className="max-w-4xl mx-auto px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center space-x-4"
          >
            <Button
              variant="ghost"
              onClick={() => navigate('/admin')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-h1 font-bold">
                {isEditing ? 'Modifier la variante' : 'Nouvelle variante'}
              </h1>
              <p className="text-lg opacity-90">
                {isEditing ? `Éditez "${variant.name}"` : 'Créez une nouvelle variante du simulateur'}
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6">
              <h3 className="text-h2 font-bold mb-4">Configuration</h3>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Nom de la variante</Label>
                  <Input
                    id="name"
                    value={variant.name}
                    onChange={(e) => setVariant(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Version avec CTA jaune"
                  />
                </div>

                <div>
                  <Label htmlFor="slug">Slug URL</Label>
                  <Input
                    id="slug"
                    value={variant.slug}
                    onChange={(e) => setVariant(prev => ({ ...prev, slug: e.target.value }))}
                    placeholder="Ex: version-cta-jaune"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    URL: /{variant.slug || 'votre-slug'}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={variant.is_active}
                    onCheckedChange={(checked) => setVariant(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="active">Variante active</Label>
                </div>

                <div>
                  <Label>Part du trafic: {variant.traffic_split}%</Label>
                  <Slider
                    value={[variant.traffic_split]}
                    onValueChange={(values) => setVariant(prev => ({ ...prev, traffic_split: values[0] }))}
                    max={100}
                    step={5}
                    className="mt-2"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button onClick={handleSave} disabled={loading} className="flex-1">
                    <Save className="w-4 h-4 mr-2" />
                    Sauvegarder
                  </Button>
                  {variant.slug && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(`/${variant.slug}`, '_blank')}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/admin'}
                  >
                    Dashboard
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Content Editor */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="p-6">
              <h3 className="text-h2 font-bold mb-4">Contenu du simulateur</h3>
              <div className="space-y-6">
                {/* Hero Section */}
                <div>
                  <h4 className="font-semibold mb-3">Section d'accueil</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="heroTitle">Titre principal</Label>
                      <Input
                        id="heroTitle"
                        value={variant.content.heroTitle}
                        onChange={(e) => updateContent('heroTitle', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="heroSubtitle">Sous-titre</Label>
                      <Textarea
                        id="heroSubtitle"
                        value={variant.content.heroSubtitle}
                        onChange={(e) => updateContent('heroSubtitle', e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                {/* Ownership Question */}
                <div>
                  <h4 className="font-semibold mb-3">Question propriétaire</h4>
                  <div>
                    <Label htmlFor="ownershipQuestion">Question</Label>
                    <Input
                      id="ownershipQuestion"
                      value={variant.content.ownershipQuestion}
                      onChange={(e) => updateContent('ownershipQuestion', e.target.value)}
                    />
                  </div>
                </div>

                {/* Bill Question */}
                <div>
                  <h4 className="font-semibold mb-3">Question facture</h4>
                  <div>
                    <Label htmlFor="billQuestion">Question</Label>
                    <Input
                      id="billQuestion"
                      value={variant.content.billQuestion}
                      onChange={(e) => updateContent('billQuestion', e.target.value)}
                    />
                  </div>
                </div>

                {/* Equipment Section */}
                <div>
                  <h4 className="font-semibold mb-3">Section équipements</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="equipmentTitle">Titre</Label>
                      <Input
                        id="equipmentTitle"
                        value={variant.content.equipmentTitle}
                        onChange={(e) => updateContent('equipmentTitle', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="equipmentSubtitle">Sous-titre</Label>
                      <Input
                        id="equipmentSubtitle"
                        value={variant.content.equipmentSubtitle}
                        onChange={(e) => updateContent('equipmentSubtitle', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Contact Section */}
                <div>
                  <h4 className="font-semibold mb-3">Section contact</h4>
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="contactTitle">Titre</Label>
                      <Input
                        id="contactTitle"
                        value={variant.content.contactTitle}
                        onChange={(e) => updateContent('contactTitle', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="contactSubtitle">Sous-titre</Label>
                      <Input
                        id="contactSubtitle"
                        value={variant.content.contactSubtitle}
                        onChange={(e) => updateContent('contactSubtitle', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}