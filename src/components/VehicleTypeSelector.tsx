import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import fiat500Image from "@/assets/fiat500.png";
import trocCabrioImage from "@/assets/troc-cabrio.png";

interface VehicleTypeSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

interface VehicleSetting {
  id: string;
  vehicle_type: string;
  display_name: string | null;
  description: string | null;
  image_url: string | null;
  is_available: boolean;
  price_multiplier: number | null;
}

// Fallback images for known vehicle types
const fallbackImages: Record<string, string> = {
  economy: fiat500Image,
  premium: trocCabrioImage,
};

// Independent image styles per vehicle type
const vehicleImageStyles: Record<string, string> = {
  economy: "h-14 w-28",
  premium: "h-20 w-40",
};

export function VehicleTypeSelector({ value, onChange }: VehicleTypeSelectorProps) {
  const [vehicles, setVehicles] = useState<VehicleSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicleSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("vehicle_settings")
          .select("*")
          .eq("is_available", true)
          .order("vehicle_type");

        if (error) throw error;

        const availableVehicles = data || [];
        setVehicles(availableVehicles);

        // Se il veicolo selezionato non è più disponibile, seleziona il primo disponibile
        const currentStillAvailable = availableVehicles.find((v) => v.vehicle_type === value);
        if (!currentStillAvailable && availableVehicles.length > 0) {
          onChange(availableVehicles[0].vehicle_type);
        }
      } catch (error) {
        console.error("Error fetching vehicle settings:", error);
        // Default fallback
        setVehicles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleSettings();
  }, []);

  const getVehicleImage = (vehicle: VehicleSetting): string | null => {
    if (vehicle.image_url) return vehicle.image_url;
    return fallbackImages[vehicle.vehicle_type] || null;
  };

  const getImageStyle = (vehicleType: string): string => {
    return vehicleImageStyles[vehicleType] || "h-16 w-32";
  };

  // Loading state
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

  // Nessun veicolo disponibile
  if (vehicles.length === 0) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
        <p className="text-sm text-destructive">Nessun veicolo disponibile al momento</p>
      </div>
    );
  }

  // Solo un veicolo disponibile - mostralo senza opzione di scelta
  if (vehicles.length === 1) {
    const vehicle = vehicles[0];
    const image = getVehicleImage(vehicle);

    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Veicolo disponibile</p>
        <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-yellow-400 bg-yellow-400/10">
          {image && (
            <img
              src={image}
              alt={vehicle.display_name || vehicle.vehicle_type}
              className={cn(getImageStyle(vehicle.vehicle_type), "object-contain")}
            />
          )}
          <div>
            <p className="font-medium text-foreground">{vehicle.display_name || vehicle.vehicle_type}</p>
            <p className="text-xs text-muted-foreground">{vehicle.description || ""}</p>
          </div>
        </div>
      </div>
    );
  }

  // Più veicoli disponibili - mostra griglia di selezione
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Tipo di veicolo</p>
      <div className={cn(
        "grid gap-3",
        vehicles.length === 2 ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-3"
      )}>
        {vehicles.map((vehicle) => {
          const image = getVehicleImage(vehicle);
          const isSelected = value === vehicle.vehicle_type;

          return (
            <button
              key={vehicle.id}
              type="button"
              onClick={() => onChange(vehicle.vehicle_type)}
              className={cn(
                "relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                isSelected
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-border bg-card hover:border-yellow-400 hover:bg-yellow-400/10"
              )}
            >
              <div className="h-20 flex items-center justify-center">
                {image && (
                  <img
                    src={image}
                    alt={vehicle.display_name || vehicle.vehicle_type}
                    className={cn(getImageStyle(vehicle.vehicle_type), "object-contain")}
                  />
                )}
              </div>
              <div className="text-center min-h-[32px] flex flex-col justify-center">
                <p className="font-medium text-foreground text-xs">
                  {vehicle.display_name || vehicle.vehicle_type}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {vehicle.description || ""}
                </p>
              </div>
              {isSelected && (
                <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-yellow-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
