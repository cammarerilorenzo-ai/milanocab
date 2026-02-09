import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, Save, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface GroupPricingPanelProps {
  userPhone: string;
}

interface GroupPricing {
  customer_group: string;
  display_name: string;
  base_price: number | null;
  price_per_km: number | null;
  price_per_min: number | null;
  discount_short: number | null;
  discount_long: number | null;
  night_surcharge: number | null;
  airport_malpensa: number | null;
  airport_orio: number | null;
}

const FIELD_LABELS: Record<string, string> = {
  base_price: "Tariffa base (€)",
  price_per_km: "Prezzo/km (€)",
  price_per_min: "Prezzo/min (€)",
  discount_short: "Sconto breve (%)",
  discount_long: "Sconto lungo (%)",
  night_surcharge: "Suppl. notturno (%)",
  airport_malpensa: "Malpensa (€)",
  airport_orio: "Orio (€)",
};

const EDITABLE_FIELDS = Object.keys(FIELD_LABELS) as Array<keyof typeof FIELD_LABELS>;

export function GroupPricingPanel({ userPhone }: GroupPricingPanelProps) {
  const { toast } = useToast();
  const [groups, setGroups] = useState<GroupPricing[]>([]);
  const [editValues, setEditValues] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [savingGroup, setSavingGroup] = useState<string | null>(null);

  useEffect(() => {
    fetchGroupPricing();
  }, []);

  const fetchGroupPricing = async () => {
    try {
      const { data, error } = await supabase
        .from("group_pricing")
        .select("*")
        .order("customer_group");

      if (error) throw error;

      setGroups(data || []);
      // Initialize edit values
      const values: Record<string, Record<string, string>> = {};
      (data || []).forEach((g) => {
        values[g.customer_group] = {};
        EDITABLE_FIELDS.forEach((field) => {
          const val = g[field as keyof GroupPricing];
          values[g.customer_group][field] = val != null ? String(val) : "";
        });
      });
      setEditValues(values);
    } catch (error) {
      console.error("Error fetching group pricing:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (customerGroup: string) => {
    setSavingGroup(customerGroup);
    try {
      const vals = editValues[customerGroup];
      const body: Record<string, unknown> = {
        action: "update_group_pricing",
        phone: userPhone,
        customerGroup,
      };

      EDITABLE_FIELDS.forEach((field) => {
        const v = parseFloat(vals[field]);
        if (!isNaN(v)) body[field] = v;
      });

      const { data, error } = await supabase.functions.invoke("admin-settings", { body });

      if (error || !data.success) {
        throw new Error(data?.error || "Errore nell'aggiornamento");
      }

      toast({
        title: "Salvato",
        description: `Tariffe ${customerGroup === "private" ? "Privati" : "Business"} aggiornate`,
      });
    } catch (error) {
      console.error("Error saving group pricing:", error);
      toast({
        title: "Errore",
        description: "Impossibile salvare le tariffe",
        variant: "destructive",
      });
    } finally {
      setSavingGroup(null);
    }
  };

  const updateField = (group: string, field: string, value: string) => {
    setEditValues((prev) => ({
      ...prev,
      [group]: { ...prev[group], [field]: value },
    }));
  };

  const isPercent = (field: string) =>
    ["discount_short", "discount_long", "night_surcharge"].includes(field);

  if (isLoading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 shadow-lg">
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const renderGroupFields = (group: GroupPricing) => {
    const vals = editValues[group.customer_group] || {};
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {EDITABLE_FIELDS.map((field) => (
            <div key={field} className="space-y-1">
              <Label className="text-xs text-muted-foreground">{FIELD_LABELS[field]}</Label>
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  step={isPercent(field) ? "0.01" : "0.5"}
                  min="0"
                  value={vals[field] || ""}
                  onChange={(e) => updateField(group.customer_group, field, e.target.value)}
                  className="h-8 text-center"
                />
                {isPercent(field) && (
                  <span className="text-xs text-muted-foreground min-w-[40px]">
                    {vals[field] ? `${Math.round(parseFloat(vals[field]) * 100)}%` : ""}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button
          size="sm"
          onClick={() => handleSave(group.customer_group)}
          disabled={savingGroup === group.customer_group}
          className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
        >
          {savingGroup === group.customer_group ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Save className="h-4 w-4 mr-1" />
              Salva {group.display_name}
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-lg space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-emerald-500" />
        <h2 className="text-lg font-semibold text-foreground">Tariffe per Gruppo</h2>
      </div>

      <Tabs defaultValue="private" className="w-full">
        <TabsList className="w-full">
          <TabsTrigger value="private" className="flex-1 gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Privati
          </TabsTrigger>
          <TabsTrigger value="business" className="flex-1 gap-1.5">
            <Building2 className="h-3.5 w-3.5" />
            Business
          </TabsTrigger>
        </TabsList>

        {groups.map((group) => (
          <TabsContent key={group.customer_group} value={group.customer_group}>
            {renderGroupFields(group)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
