import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/custom-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { DatePickerWithRange, dateRangePresets } from '@/components/ui/date-range-picker';
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { 
  BarChart, 
  Users, 
  TrendingUp, 
  MousePointer, 
  Settings,
  Plus,
  Edit,
  Eye,
  Activity,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';

interface KPIData {
  totalViews: number;
  totalLeads: number;
  ctaClicks: number;
  conversionRate: number;
  topVariant: string;
}

interface VariantStats {
  variant_id: string;
  variant_name: string;
  views: number;
  leads: number;
  cta_clicks: number;
  conversion_rate: number;
}

export default function Admin() {
  const [kpiData, setKPIData] = useState<KPIData | null>(null);
  const [variantStats, setVariantStats] = useState<VariantStats[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -29), // Last 30 days by default
    to: new Date(),
  });

  useEffect(() => {
    loadDashboardData();
  }, [dateRange]); // Reload when date range changes

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load variants
      const { data: variantsData } = await supabase
        .from('simulator_variants')
        .select('*')
        .order('created_at', { ascending: false });

      setVariants(variantsData || []);

      // Load analytics data for the selected date range
      const startDate = dateRange?.from || addDays(new Date(), -29);
      const endDate = dateRange?.to || new Date();

      // Ensure we have valid dates
      const validStartDate = startDate instanceof Date ? startDate : new Date(startDate);
      const validEndDate = endDate instanceof Date ? endDate : new Date(endDate);

      console.log('Loading data for range:', validStartDate.toISOString(), 'to', validEndDate.toISOString());

      const { count: totalViews } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'page_view')
        .gte('created_at', validStartDate.toISOString())
        .lte('created_at', validEndDate.toISOString());

      // Get total leads
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', validStartDate.toISOString())
        .lte('created_at', validEndDate.toISOString());

      // Get CTA clicks
      const { count: ctaClicks } = await supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'cta_click')
        .gte('created_at', validStartDate.toISOString())
        .lte('created_at', validEndDate.toISOString());

      // Calculate conversion rate
      const conversionRate = totalViews && totalLeads 
        ? (totalLeads / totalViews) * 100 
        : 0;

      // Get variant performance
      const { data: variantPerformance } = await supabase
        .rpc('get_variant_performance', {
          start_date: validStartDate.toISOString()
        });

      const performanceData = variantPerformance || [];
      
      setKPIData({
        totalViews: totalViews || 0,
        totalLeads: totalLeads || 0,
        ctaClicks: ctaClicks || 0,
        conversionRate: Math.round(conversionRate * 100) / 100,
        topVariant: performanceData[0]?.variant_name || 'N/A'
      });

      setVariantStats(performanceData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return "Période non sélectionnée";
    if (!dateRange?.to) return format(dateRange.from, "dd/MM/yyyy");
    return `${format(dateRange.from, "dd/MM/yyyy")} - ${format(dateRange.to, "dd/MM/yyyy")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'Vues totales',
      value: kpiData?.totalViews.toLocaleString() || '0',
      icon: Eye,
      change: '+12%',
      color: 'kpi-blue'
    },
    {
      title: 'Leads générés',
      value: kpiData?.totalLeads.toLocaleString() || '0',
      icon: Users,
      change: '+8%',
      color: 'kpi-green'
    },
    {
      title: 'Clics CTA',
      value: kpiData?.ctaClicks.toLocaleString() || '0',
      icon: MousePointer,
      change: '+15%',
      color: 'kpi-yellow'
    },
    {
      title: 'Taux de conversion',
      value: `${kpiData?.conversionRate || 0}%`,
      icon: TrendingUp,
      change: '+3%',
      color: 'kpi-cyan'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-brand-gradient text-white py-8">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="flex items-center justify-between"
          >
            <div>
              <h1 className="text-h1 font-bold">Dashboard Analytics</h1>
              <p className="text-lg opacity-90 mt-2">
                Période analysée : {formatDateRange()}
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => window.location.href = '/'}
                className="bg-white/20 text-white hover:bg-white/30 border-white/20"
                variant="outline"
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir simulateur
              </Button>
              <Button 
                onClick={() => window.location.href = '/admin/variants/new'}
                className="bg-white/20 text-white hover:bg-white/30 border-white/20"
                variant="outline"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle variante
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Date Range Selector */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mb-8"
        >
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="text-h2 font-bold mb-2">Sélectionner une période</h3>
                <p className="text-muted-foreground">
                  Analysez vos KPIs sur la période de votre choix
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Preset buttons */}
                <div className="flex flex-wrap gap-2">
                  {dateRangePresets.map((preset) => (
                    <Button
                      key={preset.label}
                      variant="outline"
                      size="sm"
                      onClick={() => setDateRange(preset.range)}
                      className={`text-xs ${
                        dateRange?.from?.toDateString() === preset.range.from.toDateString() &&
                        dateRange?.to?.toDateString() === preset.range.to.toDateString()
                          ? 'bg-primary text-primary-foreground'
                          : ''
                      }`}
                    >
                      {preset.label}
                    </Button>
                  ))}
                </div>
                
                {/* Custom date range picker */}
                <div className="flex items-center gap-2">
                  <DatePickerWithRange
                    value={dateRange}
                    onChange={setDateRange}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={loadDashboardData}
                    disabled={loading}
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {kpiCards.map((kpi, index) => (
            <motion.div
              key={index}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 + index * 0.1 }}
            >
              <Card className={`p-6 ${kpi.color} border-0 shadow-lg`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      {kpi.title}
                    </p>
                    <h3 className="text-2xl font-bold text-foreground">
                      {kpi.value}
                    </h3>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {kpi.change}
                    </Badge>
                  </div>
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <kpi.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Content */}
        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="analytics">Vue générale</TabsTrigger>
            <TabsTrigger value="variants-detail">Détail par variante</TabsTrigger>
            <TabsTrigger value="variants">Gestion variantes</TabsTrigger>
            <TabsTrigger value="abtests">Tests A/B</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-h2 font-bold mb-4">Vue d'ensemble des performances</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpiCards.map((kpi, index) => (
                  <Card key={index} className={`p-4 ${kpi.color}`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">
                          {kpi.title}
                        </p>
                        <h3 className="text-2xl font-bold text-foreground">
                          {kpi.value}
                        </h3>
                        <Badge variant="secondary" className="mt-2 text-xs">
                          {kpi.change}
                        </Badge>
                      </div>
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <kpi.icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
            
            <Card className="p-6">
              <h3 className="text-h2 font-bold mb-4">Performance par variante (résumé)</h3>
              <div className="space-y-4">
                {variantStats.length > 0 ? (
                  variantStats.map((variant, index) => (
                    <div
                      key={variant.variant_id}
                      className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
                    >
                      <div>
                        <h4 className="font-semibold">{variant.variant_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {variant.views} vues • {variant.leads} leads
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">
                          {variant.conversion_rate.toFixed(2)}%
                        </div>
                        <div className="text-sm text-muted-foreground">
                          conversion
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Aucune donnée disponible pour le moment
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="variants-detail" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-h2 font-bold mb-6">Analytics détaillées par variante</h3>
              
              {variantStats.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {variantStats.map((variant, index) => (
                    <motion.div
                      key={variant.variant_id}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <Card className="p-6 border-2 hover:border-primary/20 transition-colors">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-foreground">
                              {variant.variant_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Période: {formatDateRange()}
                            </p>
                          </div>
                          <Badge 
                            variant={variant.conversion_rate > 0 ? "default" : "secondary"}
                            className="text-sm"
                          >
                            {variant.conversion_rate.toFixed(2)}% conversion
                          </Badge>
                        </div>
                        
                        {/* KPIs for this variant */}
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="text-center p-3 bg-kpi-blue rounded-lg">
                            <div className="text-2xl font-bold text-foreground">
                              {variant.views.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Vues</div>
                          </div>
                          
                          <div className="text-center p-3 bg-kpi-green rounded-lg">
                            <div className="text-2xl font-bold text-foreground">
                              {variant.leads.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Leads</div>
                          </div>
                          
                          <div className="text-center p-3 bg-kpi-yellow rounded-lg">
                            <div className="text-2xl font-bold text-foreground">
                              {variant.cta_clicks.toLocaleString()}
                            </div>
                            <div className="text-sm text-muted-foreground">Clics CTA</div>
                          </div>
                          
                          <div className="text-center p-3 bg-kpi-cyan rounded-lg">
                            <div className="text-2xl font-bold text-foreground">
                              {variant.conversion_rate.toFixed(2)}%
                            </div>
                            <div className="text-sm text-muted-foreground">Taux conversion</div>
                          </div>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-4 border-t">
                          <div className="text-sm text-muted-foreground">
                            Entonnoir: {variant.views > 0 ? ((variant.cta_clicks / variant.views) * 100).toFixed(1) : 0}% cliquent sur CTA
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const variantData = variants.find(v => v.id === variant.variant_id);
                                if (variantData?.slug) {
                                  window.open(`/${variantData.slug}`, '_blank');
                                }
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Voir
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.location.href = `/admin/variants/${variant.variant_id}/edit`}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Éditer
                            </Button>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h4 className="text-lg font-semibold mb-2">Aucune donnée disponible</h4>
                  <p className="text-muted-foreground mb-4">
                    Aucune activité détectée sur la période sélectionnée
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Tester le simulateur
                  </Button>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="variants" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-h2 font-bold">Gestion des variantes</h3>
                <Button onClick={() => window.location.href = '/admin/variants/new'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouvelle variante
                </Button>
              </div>
              
              <div className="space-y-4">
                {variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div>
                        <h4 className="font-semibold">{variant.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          /{variant.slug} • {Math.round(variant.traffic_split * 100)}% du trafic
                        </p>
                      </div>
                      <Badge variant={variant.is_active ? 'default' : 'secondary'}>
                        {variant.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.location.href = `/admin/variants/${variant.id}/edit`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/${variant.slug}`, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="abtests" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-h2 font-bold">Tests A/B</h3>
                <Button onClick={() => window.location.href = '/admin/abtests/new'}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau test
                </Button>
              </div>
              
              <div className="text-center py-12 text-muted-foreground">
                <BarChart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Fonctionnalité à venir</p>
                <p className="text-sm">Créez et gérez vos tests A/B facilement</p>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}