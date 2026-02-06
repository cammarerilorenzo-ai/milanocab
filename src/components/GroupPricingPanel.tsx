import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Building2, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GroupPricingPanelProps {
  userPhone: string;
}

export function GroupPricingPanel({ userPhone }: GroupPricingPanelProps) {
  const { toast } = useToast();
  const [businessMultiplier, setBusinessMultiplier] = useState<string>("1.00");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBusinessPricing();
  }, []);

  const fetchBusinessPricing = async () => {
    try {
      const { data, error } = await supabase
        .from("group_pricing")
        .select("price_per_km")
        .eq("customer_group", "business")
        .single();

      if (error) throw error;
      
      // price_per_km usato come moltiplicatore (1.5 default = tariffa base, valori diversi = coefficiente)
      const multiplier = data?.price_per_km ?? 1.0;
      setBusinessMultiplier(multiplier.toFixed(2));
    } catch (error) {
      console.error("Error fetching business pricing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const multiplier = parseFloat(businessMultiplier);
    
    if (isNaN(multiplier) || multiplier < 0.5 || multiplier > 2) {
      toast({
        title: "Valore non valido",
        description: "Il coefficiente deve essere tra 0.50 e 2.00",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update_group_pricing",
          phone: userPhone,
          customerGroup: "business",
          price_per_km: multiplier
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || "Errore nell'aggiornamento");
      }

      toast({
        title: "Salvato",
        description: `Coefficiente Business aggiornato a ${multiplier.toFixed(2)}`
      });
    } catch (error) {
      console.error("Error saving business pricing:", error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il coefficiente",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getPercentLabel = () => {
    const multiplier = parseFloat(businessMultiplier);
    if (isNaN(multiplier)) return "";
    const percent = Math.round((multiplier - 1) * 100);
    if (percent > 0) return `+${percent}%`;
    if (percent < 0) return `${percent}%`;
    return "0%";
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-lg space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-foreground">Coefficiente Business</h2>
      </div>

      {/* Input Row */}
      <div className="flex items-center gap-3">
        <Input
          type="number"
          step="0.05"
          min="0.5"
          max="2"
          value={businessMultiplier}
          onChange={(e) => setBusinessMultiplier(e.target.value)}
          className="h-9 w-24 text-center"
        />
        <span className="text-sm font-medium text-foreground min-w-[50px]">
          {getPercentLabel()}
        </span>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-yellow-400 hover:bg-yellow-500 text-black"
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Salva
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
