import { Button } from "@/components/ui/custom-button";
import { Card } from "@/components/ui/card";
import { BarChart3, Users, Settings, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  const features = [
    {
      title: "Analytics en temps réel",
      description: "Suivez les performances de votre simulateur avec des KPIs détaillés",
      icon: BarChart3,
      href: "/admin",
      color: "kpi-blue"
    },
    {
      title: "Gestion des variantes",
      description: "Créez et modifiez facilement les différentes versions de votre simulateur",
      icon: Settings,
      href: "/admin/variants/new",
      color: "kpi-green"
    },
    {
      title: "Tests A/B",
      description: "Optimisez vos conversions avec des tests comparatifs avancés",
      icon: Users,
      href: "/admin",
      color: "kpi-yellow"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-brand-gradient text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-4"
          >
            <h1 className="text-h1 font-bold">
              Centre de Contrôle
            </h1>
            <p className="text-lg opacity-90">
              Gérez et optimisez votre simulateur solaire
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 bg-primary text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-h2 font-bold">Voir le Simulateur</h3>
                  <p className="text-white/90">Version actuelle en production</p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/'}
                  className="bg-white/20 text-white hover:bg-white/30"
                  variant="outline"
                >
                  Ouvrir <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 bg-secondary text-white border-0 shadow-lg hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-h2 font-bold">Dashboard Analytics</h3>
                  <p className="text-white/90">KPIs et performances détaillées</p>
                </div>
                <Button 
                  onClick={() => window.location.href = '/admin'}
                  className="bg-white/20 text-white hover:bg-white/30"
                  variant="outline"
                >
                  Accéder <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Features Grid */}
        <div>
          <h2 className="text-h2 font-bold text-foreground mb-6 text-center">
            Outils disponibles
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className={`p-6 ${feature.color} border-0 shadow-lg hover:shadow-xl transition-all hover:scale-105 cursor-pointer`}
                      onClick={() => window.location.href = feature.href}>
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-white/10 rounded-full flex items-center justify-center">
                      <feature.icon className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {feature.description}
                      </p>
                    </div>
                    <Button variant="outline" size="sm" className="mt-4">
                      Accéder <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Quick Stats Preview */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-center"
        >
          <Card className="p-8 bg-muted/50">
            <h3 className="text-h2 font-bold text-foreground mb-4">
              Système opérationnel
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium">Analytics actives</p>
              </div>
              <div>
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium">A/B Testing prêt</p>
              </div>
              <div>
                <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2"></div>
                <p className="text-sm font-medium">Tracking des leads</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}