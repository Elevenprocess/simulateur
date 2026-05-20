import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import { AnalyticsProvider } from "@/contexts/AnalyticsProvider";
import Simulator from "./pages/Simulator";
import Results from "./pages/Results";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import VariantEditor from "./pages/VariantEditor";
import Auth from "./pages/Auth";
import AdminGuard from "./components/AdminGuard";
import NotFound from "./pages/NotFound";

// Component to handle variant params
const AnalyticsProviderWithParams = () => {
  const { variantSlug } = useParams();
  return (
    <AnalyticsProvider variantSlug={variantSlug}>
      <Simulator />
    </AnalyticsProvider>
  );
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route 
            path="/" 
            element={
              <AnalyticsProvider>
                <Simulator />
              </AnalyticsProvider>
            } 
          />
          <Route 
            path="/:variantSlug" 
            element={
              <AnalyticsProviderWithParams />
            } 
          />
          <Route path="/resultats" element={<Results />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/dashboard" element={<AdminGuard><Dashboard /></AdminGuard>} />
          <Route path="/admin" element={<AdminGuard><Admin /></AdminGuard>} />
          <Route path="/admin/variants/:id/edit" element={<AdminGuard><VariantEditor /></AdminGuard>} />
          <Route path="/admin/variants/new" element={<AdminGuard><VariantEditor /></AdminGuard>} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
