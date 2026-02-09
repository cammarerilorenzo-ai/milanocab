import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Percent, Save, Loader2, Moon, Ruler, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DiscountLogicPanelProps {
  userPhone: string;
}

interface PricingSetting {
  key: string;
  value: string;
  description: string | null;
}

const SETTING_GROUPS = [
  {
    title: "Sconti per distanza",
    icon: Ruler,
    fields: [
      { key: "discount_under_3km", label: "Sconto corsa breve", suffix: "fattore", hint: "0.80 = -20%" },
      { key: "discount_3to5km", label: "Sconto corsa media", suffix: "fattore", hint: "0.92 = -8%" },
      { key: "discount_over_5km", label: "Sconto corsa lunga", suffix: "fattore", hint: "0.85 = -15%" },
    ],
  },
  {
    title: "Soglie distanza",
    icon: Ruler,
    fields: [
      { key: "distance_threshold_low", label: "Soglia bassa", suffix: "km", hint: "Limite per corsa breve" },
      { key: "distance_threshold_high", label: "Soglia alta", suffix: "km", hint: "Limite per corsa media" },
    ],
  },
  {
    title: "Fascia notturna",
    icon: Moon,
    fields: [
      { key: "night_start_hour", label: "Inizio notturno", suffix: "ora", hint: "0-23" },
      { key: "night_end_hour", label: "Fine notturno", suffix: "ora", hint: "0-23" },
      { key: "night_surcharge_multiplier", label: "Supplemento notturno", suffix: "fattore", hint: "1.30 = +30%" },
    ],
  },
  {
    title: "Extra",
    icon: Clock,
    fields: [
      { key: "vwtroc_eta_extra", label: "ETA extra VW T-Roc", suffix: "min", hint: "Minuti aggiuntivi" },
    ],
  },
];

const ALL_KEYS = SETTING_GROUPS.flatMap(g => g.fields.map(f => f.key));

export function DiscountLogicPanel({ userPhone }: DiscountLogicPanelProps) {
  const { toast } = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value, description")
        .in("key", ALL_KEYS);

      if (error) throw error;

      const vals: Record<string, string> = {};
      (data || []).forEach((s: PricingSetting) => {
        vals[s.key] = s.value;
      });
      setValues(vals);
    } catch (error) {
      console.error("Error fetching pricing settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Save each setting individually via admin-settings
      for (const key of ALL_KEYS) {
        if (values[key] !== undefined) {
          const { data, error } = await supabase.functions.invoke("admin-settings", {
            body: {
              action: "update_app_setting",
              phone: userPhone,
              settingKey: key,
              settingValue: values[key],
            },
          });
          if (error || !data.success) {
            throw new Error(data?.error || `Errore aggiornamento ${key}`);
          }
        }
      }

      toast({
        title: "Salvato",
        description: "Logiche di scontistica aggiornate",
      });
    } catch (error) {
      console.error("Error saving pricing settings:", error);
      toast({
        title: "Errore",
        description: "Impossibile salvare le impostazioni",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatPercent = (val: string) => {
    const n = parseFloat(val);
    if (isNaN(n)) return "";
    if (n < 1) return `−${Math.round((1 - n) * 100)}%`;
    if (n > 1) return `+${Math.round((n - 1) * 100)}%`;
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
    <div className="bg-card rounded-2xl border border-border p-6 shadow-lg space-y-5">
      <div className="flex items-center gap-2">
        <Percent className="h-5 w-5 text-orange-500" />
        <h2 className="text-lg font-semibold text-foreground">Logiche di Scontistica</h2>
      </div>

      {SETTING_GROUPS.map((group) => {
        const Icon = group.icon;
        return (
          <div key={group.title} className="space-y-3">
            <div className="flex items-center gap-1.5">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-muted-foreground">{group.title}</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {group.fields.map((field) => (
                <div key={field.key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{field.label}</Label>
                  <div className="flex items-center gap-1.5">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={values[field.key] || ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="h-8 text-center"
                    />
                    <span className="text-xs text-muted-foreground min-w-[45px]">
                      {field.suffix === "fattore"
                        ? formatPercent(values[field.key] || "")
                        : field.suffix}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70">{field.hint}</p>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <Button
        size="sm"
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-yellow-400 hover:bg-yellow-500 text-black"
      >
        {isSaving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            <Save className="h-4 w-4 mr-1" />
            Salva Scontistica
          </>
        )}
      </Button>
    </div>
  );
}
