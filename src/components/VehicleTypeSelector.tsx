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
  vehicle_type: string;
  is_available: boolean;
  display_name: string | null;
  description: string | null;
  image_url: string | null;
  price_multiplier: number | null;
}

export function VehicleTypeSelector({ value, onChange }: VehicleTypeSelectorProps) {
  const [vehicles, setVehicles] = useState<VehicleSetting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicleSettings = async () => {
      try {
        const { data, error } = await supabase
          .from("vehicle_settings")
          .select("vehicle_type, is_available, display_name, description, image_url, price_multiplier");

        if (error) throw error;

        const availableVehicles = (data || []).filter(v => v.is_available);
        setVehicles(availableVehicles);
        
        // Se il veicolo selezionato non è disponibile, seleziona il primo disponibile
        const currentAvailable = availableVehicles.find(v => v.vehicle_type === value);
        if (!currentAvailable && availableVehicles.length > 0) {
          onChange(availableVehicles[0].vehicle_type);
        }
      } catch (error) {
        console.error("Error fetching vehicle settings:", error);
        // Default: mostra veicoli di fallback
        setVehicles([
          { vehicle_type: "economy", is_available: true, display_name: "Utilitaria", description: "Comoda e conveniente", image_url: null, price_multiplier: 1 },
          { vehicle_type: "premium", is_available: true, display_name: "SUV Cabrio", description: "Spazio e stile", image_url: null, price_multiplier: 1.3 }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicleSettings();
  }, []);

  const getVehicleImage = (vehicle: VehicleSetting) => {
    if (vehicle.image_url) return vehicle.image_url;
    if (vehicle.vehicle_type === "economy") return fiat500Image;
    if (vehicle.vehicle_type === "premium") return trocCabrioImage;
    return null;
  };

  // Se nessun veicolo è disponibile
  if (!loading && vehicles.length === 0) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-center">
        <p className="text-sm text-destructive">Nessun veicolo disponibile al momento</p>
      </div>
    );
  }

  // Se solo un veicolo è disponibile, mostralo come selezionato (senza opzione di scelta)
  if (!loading && vehicles.length === 1) {
    const vehicle = vehicles[0];
    const image = getVehicleImage(vehicle);
    const priceInfo = vehicle.price_multiplier && vehicle.price_multiplier !== 1 
      ? ` (+${Math.round((vehicle.price_multiplier - 1) * 100)}%)` 
      : "";

    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Veicolo disponibile</p>
        <div className="flex flex-col items-center gap-3 p-5 rounded-xl border-2 border-yellow-400 bg-yellow-400/10">
          {image && (
            <img 
              src={image} 
              alt={vehicle.display_name || vehicle.vehicle_type} 
              className="h-28 w-auto object-contain" 
            />
          )}
          <div className="text-center">
            <p className="font-semibold text-foreground text-lg">{vehicle.display_name || vehicle.vehicle_type}</p>
            <p className="text-sm text-muted-foreground">
              {vehicle.description || ""}{priceInfo}
            </p>
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
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Tipo di veicolo</p>
      <div className={cn(
        "grid gap-4",
        vehicles.length === 1 ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"
      )}>
        {vehicles.map((vehicle) => {
          const image = getVehicleImage(vehicle);
          const isSelected = value === vehicle.vehicle_type;
          const priceInfo = vehicle.price_multiplier && vehicle.price_multiplier !== 1 
            ? ` (+${Math.round((vehicle.price_multiplier - 1) * 100)}%)` 
            : "";

          return (
            <button
              key={vehicle.vehicle_type}
              type="button"
              onClick={() => onChange(vehicle.vehicle_type)}
              className={cn(
                "relative flex flex-col items-center gap-4 p-6 rounded-2xl border-2 transition-all",
                isSelected
                  ? "border-yellow-400 bg-yellow-400/10"
                  : "border-border bg-card hover:border-yellow-400 hover:bg-yellow-400/10"
              )}
            >
              {image && (
                <div className="w-full flex items-center justify-center py-2">
                  <img 
                    src={image} 
                    alt={vehicle.display_name || vehicle.vehicle_type} 
                    className="h-32 sm:h-36 w-auto max-w-full object-contain" 
                  />
                </div>
              )}
              <div className="text-center">
                <p className="font-semibold text-foreground text-lg">
                  {vehicle.display_name || vehicle.vehicle_type}
                </p>
                <p className="text-sm text-muted-foreground">
                  {vehicle.description || ""}{priceInfo}
                </p>
              </div>
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-yellow-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
