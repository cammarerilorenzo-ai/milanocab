import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import fiat500Image from "@/assets/fiat500.png";
import trocCabrioImage from "@/assets/troc-cabrio.png";

interface VehicleTypeSelectorProps {
  value: "economy" | "premium";
  onChange: (value: "economy" | "premium") => void;
}

interface VehicleSetting {
  vehicle_type: string;
  is_available: boolean;
}

export function VehicleTypeSelector({ value, onChange }: VehicleTypeSelectorProps) {
  const [availableVehicles, setAvailableVehicles] = useState<VehicleSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicleSettings = async () => {
      try {
        const { data, error } = await supabase.from("vehicle_settings").select("vehicle_type, is_available");

        if (error) throw error;

        setAvailableVehicles(data || []);

        // Se il veicolo selezionato non è disponibile, seleziona il primo disponibile
        const currentAvailable = data?.find((v) => v.vehicle_type === value && v.is_available);
        if (!currentAvailable) {
          const firstAvailable = data?.find((v) => v.is_available);
          if (firstAvailable) {
            onChange(firstAvailable.vehicle_type as "economy" | "premium");
          }
        }
      } catch (error) {
        console.error("Error fetching vehicle settings:", error);
        // Default: mostra tutti i veicoli
        setAvailableVehicles([
          { vehicle_type: "economy", is_available: true },
          { vehicle_type: "premium", is_available: true },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleSettings();
  }, []);

  const isVehicleAvailable = (type: string) => {
    const vehicle = availableVehicles.find((v) => v.vehicle_type === type);
    return vehicle?.is_available ?? true;
  };

  const economyAvailable = isVehicleAvailable("economy");
  const premiumAvailable = isVehicleAvailable("premium");

  // Se nessun veicolo è disponibile
  if (!loading && !economyAvailable && !premiumAvailable) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
        <p className="text-sm text-destructive">Nessun veicolo disponibile al momento</p>
      </div>
    );
  }

  // Se solo un veicolo è disponibile, mostralo come selezionato (senza opzione di scelta)
  if (!loading && economyAvailable !== premiumAvailable) {
    const availableType = economyAvailable ? "economy" : "premium";
    const vehicleInfo = economyAvailable
      ? { image: fiat500Image, name: "Utilitaria", desc: "Comoda e conveniente" }
      : { image: trocCabrioImage, name: "SUV Cabrio", desc: "Spazio e stile" };

    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Veicolo disponibile</p>
        <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-yellow-400 bg-yellow-400/10">
          <img
            src={vehicleInfo.image}
            alt={vehicleInfo.name}
            className={economyAvailable ? "h-14 w-28 object-contain" : "h-20 w-40 object-contain"}
          />
          <div>
            <p className="font-medium text-foreground">{vehicleInfo.name}</p>
            <p className="text-xs text-muted-foreground">{vehicleInfo.desc}</p>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Tipo di veicolo</p>
        <div className="grid grid-cols-2 gap-3">
          <div className="h-32 bg-muted/50 rounded-xl animate-pulse" />
          <div className="h-32 bg-muted/50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Tipo di veicolo</p>
      <div className="grid grid-cols-2 gap-3">
        {/* Economy option */}
        {economyAvailable && (
          <button
            type="button"
            onClick={() => onChange("economy")}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              value === "economy"
                ? "border-yellow-400 bg-yellow-400/10"
                : "border-border bg-card hover:border-yellow-400 hover:bg-yellow-400/10",
            )}
          >
            <div className="h-20 flex items-center justify-center">
              <img src={fiat500Image} alt="Fiat 500" className="h-18 w-36 object-contain" />
            </div>
            <div className="text-center min-h-[32px] flex flex-col justify-center">
              <p className="font-medium text-foreground text-xs">Utilitaria</p>
              <p className="text-[10px] text-muted-foreground">Comoda e conveniente</p>
            </div>
            {value === "economy" && <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-yellow-400" />}
          </button>
        )}

        {/* Premium SUV option */}
        {premiumAvailable && (
          <button
            type="button"
            onClick={() => onChange("premium")}
            className={cn(
              "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
              value === "premium"
                ? "border-yellow-400 bg-yellow-400/10"
                : "border-border bg-card hover:border-yellow-400 hover:bg-yellow-400/10",
            )}
          >
            <div className="h-20 flex items-center justify-center">
              <img src={trocCabrioImage} alt="T-Roc Cabrio" className="h-20 w-40 object-contain" />
            </div>
            <div className="text-center min-h-[32px] flex flex-col justify-center">
              <p className="font-medium text-foreground text-xs">SUV Cabrio</p>
              <p className="text-[10px] text-muted-foreground">Spazio e stile</p>
            </div>
            {value === "premium" && <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-yellow-400" />}
          </button>
        )}
      </div>
    </div>
  );
}
