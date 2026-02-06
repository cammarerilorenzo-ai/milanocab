import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Users, Building2, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface GroupPricing {
  id: string;
  customer_group: "private" | "business";
  display_name: string;
  base_price: number | null;
  price_per_km: number | null;
  price_per_min: number | null;
  discount_short: number | null;
  discount_long: number | null;
  night_surcharge: number | null;
  airport_malpensa: number | null;
  airport_orio: number | null;
  is_active: boolean;
}

interface GroupPricingPanelProps {
  userPhone: string;
}

export function GroupPricingPanel({ userPhone }: GroupPricingPanelProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupPricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [savingGroup, setSavingGroup] = useState<string | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, Partial<GroupPricing>>>({});

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("group_pricing")
        .select("*")
        .order("customer_group");

      if (error) throw error;
      setGroups(data || []);
      
      // Initialize edited values
      const initial: Record<string, Partial<GroupPricing>> = {};
      (data || []).forEach(g => {
        initial[g.customer_group] = { ...g };
      });
      setEditedValues(initial);
    } catch (error) {
      console.error("Error fetching group pricing:", error);
      toast({
        title: "Errore",
        description: "Impossibile caricare le tariffe gruppi",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleValueChange = (group: string, field: keyof GroupPricing, value: string) => {
    const numValue = parseFloat(value) || 0;
    setEditedValues(prev => ({
      ...prev,
      [group]: {
        ...prev[group],
        [field]: numValue
      }
    }));
  };

  const handleSaveGroup = async (customerGroup: string) => {
    setSavingGroup(customerGroup);
    
    try {
      const values = editedValues[customerGroup];
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update_group_pricing",
          phone: userPhone,
          customerGroup,
          ...values
        }
      });

      if (error || !data.success) {
        throw new Error(data?.error || "Errore nell'aggiornamento");
      }

      toast({
        title: "Salvato",
        description: `Tariffe ${customerGroup === "private" ? "Privati" : "Business"} aggiornate`
      });

      // Refresh data
      fetchGroups();
    } catch (error) {
      console.error("Error saving group pricing:", error);
      toast({
        title: "Errore",
        description: "Impossibile salvare le tariffe",
        variant: "destructive"
      });
    } finally {
      setSavingGroup(null);
    }
  };

  const getGroupIcon = (group: string) => {
    return group === "private" ? Users : Building2;
  };

  const getGroupColor = (group: string) => {
    return group === "private" ? "text-blue-500" : "text-emerald-500";
  };

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Tariffe per Tipologia Cliente</h2>
      </div>

      <p className="text-xs text-muted-foreground">
        Configura tariffe differenziate per clienti privati e business.
      </p>

      {/* Groups */}
      <div className="space-y-6">
        {groups.map((group) => {
          const Icon = getGroupIcon(group.customer_group);
          const iconColor = getGroupColor(group.customer_group);
          const values = editedValues[group.customer_group] || group;
          const isSaving = savingGroup === group.customer_group;

          return (
            <div
              key={group.id}
              className="p-4 bg-muted/30 rounded-xl border border-border space-y-4"
            >
              {/* Group Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                  <h3 className="font-medium text-foreground">{group.display_name}</h3>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleSaveGroup(group.customer_group)}
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

              {/* Pricing Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Tariffa base (€)</Label>
                  <Input
                    type="number"
                    step="0.5"
                    min="0"
                    value={values.base_price ?? 5}
                    onChange={(e) => handleValueChange(group.customer_group, "base_price", e.target.value)}
                    className="h-9"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">€/km</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    value={values.price_per_km ?? 1.5}
                    onChange={(e) => handleValueChange(group.customer_group, "price_per_km", e.target.value)}
                    className="h-9"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">€/min</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    value={values.price_per_min ?? 0.3}
                    onChange={(e) => handleValueChange(group.customer_group, "price_per_min", e.target.value)}
                    className="h-9"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Suppl. notturno (%)</Label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    value={values.night_surcharge ?? 0.3}
                    onChange={(e) => handleValueChange(group.customer_group, "night_surcharge", e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Discounts */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Sconto breve (&lt;5km)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={values.discount_short ?? 0.05}
                    onChange={(e) => handleValueChange(group.customer_group, "discount_short", e.target.value)}
                    className="h-9"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Sconto lungo (&gt;5km)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={values.discount_long ?? 0.15}
                    onChange={(e) => handleValueChange(group.customer_group, "discount_long", e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

              {/* Airport Rates */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Malpensa (€)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={values.airport_malpensa ?? 65}
                    onChange={(e) => handleValueChange(group.customer_group, "airport_malpensa", e.target.value)}
                    className="h-9"
                  />
                </div>
                
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Orio al Serio (€)</Label>
                  <Input
                    type="number"
                    step="1"
                    min="0"
                    value={values.airport_orio ?? 65}
                    onChange={(e) => handleValueChange(group.customer_group, "airport_orio", e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground border-t border-border pt-4">
        💡 Le tariffe Business offrono sconti maggiori per fidelizzare i clienti aziendali.
      </p>
    </div>
  );
}
