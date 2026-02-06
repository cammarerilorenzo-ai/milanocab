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
  const [businessMultiplier, setBusinessMultiplier] = useState<string>("0.90");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchBusinessPricing();
  }, []);

  const fetchBusinessPricing = async () => {
    try {
      const { data, error } = await supabase
        .from("group_pricing")
        .select("discount_long")
        .eq("customer_group", "business")
        .single();

      if (error) throw error;
      
      // discount_long rappresenta lo sconto, quindi il coefficiente è 1 - discount
      const multiplier = 1 - (data?.discount_long ?? 0.15);
      setBusinessMultiplier(multiplier.toFixed(2));
    } catch (error) {
      console.error("Error fetching business pricing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const multiplier = parseFloat(businessMultiplier);
    
    if (isNaN(multiplier) || multiplier < 0.5 || multiplier > 1) {
      toast({
        title: "Valore non valido",
        description: "Il coefficiente deve essere tra 0.50 e 1.00",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Il discount_long è l'inverso del coefficiente (1 - multiplier)
      const discountLong = 1 - multiplier;
      
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update_group_pricing",
          phone: userPhone,
          customerGroup: "business",
          discount_long: discountLong
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

  const getDiscountLabel = () => {
    const multiplier = parseFloat(businessMultiplier);
    if (isNaN(multiplier)) return "";
    const discount = Math.round((1 - multiplier) * 100);
    return discount > 0 ? `-${discount}%` : "Nessuno sconto";
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
          max="1"
          value={businessMultiplier}
          onChange={(e) => setBusinessMultiplier(e.target.value)}
          className="h-9 w-24 text-center"
        />
        <span className="text-sm text-muted-foreground min-w-[80px]">
          = {getDiscountLabel()}
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

      <p className="text-xs text-muted-foreground">
        Sconto applicato ai clienti Business (0.85 = -15%)
      </p>
    </div>
  );
}
