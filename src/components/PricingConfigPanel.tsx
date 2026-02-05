import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Percent, Save, RotateCcw } from "lucide-react";

// Default pricing values (matching RideBookingForm.tsx)
const DEFAULT_PRICING = {
  basePrice: 5.0,
  pricePerKm: 1.5,
  pricePerMin: 0.3,
  discountUnder5km: 0.95,
  discountOver5km: 0.50,
  distanceThreshold: 5,
};

interface PricingConfigPanelProps {
  vehicles: Array<{
    id: string;
    vehicle_type: string;
    display_name: string | null;
    price_multiplier: number | null;
  }>;
  onUpdateMultiplier: (vehicleType: string, multiplier: number) => Promise<void>;
}

export function PricingConfigPanel({ vehicles, onUpdateMultiplier }: PricingConfigPanelProps) {
  const { toast } = useToast();
  const [pricing, setPricing] = useState(DEFAULT_PRICING);
  const [vehicleMultipliers, setVehicleMultipliers] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Initialize multipliers from vehicles
  useEffect(() => {
    const multipliers: Record<string, string> = {};
    vehicles.forEach(v => {
      multipliers[v.vehicle_type] = (v.price_multiplier ?? 1).toString();
    });
    setVehicleMultipliers(multipliers);
  }, [vehicles]);

  // Calculate example price for a given multiplier
  const calculateExamplePrice = (multiplier: number) => {
    const km = 10;
    const min = 15;
    const rawPrice = pricing.basePrice + (km * pricing.pricePerKm) + (min * pricing.pricePerMin);
    const discountedPrice = rawPrice * pricing.discountOver5km; // Over 5km discount
    return Math.floor(discountedPrice * multiplier * 2) / 2;
  };

  const handleSaveMultiplier = async (vehicleType: string) => {
    const multiplierStr = vehicleMultipliers[vehicleType];
    const multiplier = parseFloat(multiplierStr);
    
    if (isNaN(multiplier) || multiplier < 0.1 || multiplier > 5) {
      toast({
        title: "Valore non valido",
        description: "Il moltiplicatore deve essere tra 0.1 e 5",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      await onUpdateMultiplier(vehicleType, multiplier);
      toast({
        title: "Salvato",
        description: `Moltiplicatore aggiornato per ${vehicleType}`
      });
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare il moltiplicatore",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getMultiplierLabel = (multiplier: number) => {
    if (multiplier === 1) return "Tariffa base";
    if (multiplier > 1) return `+${Math.round((multiplier - 1) * 100)}%`;
    return `-${Math.round((1 - multiplier) * 100)}%`;
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Configurazione Prezzi</h2>
      </div>

      {/* Base Pricing Info */}
      <div className="p-4 bg-muted/30 rounded-xl border border-border space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
          Formula Base
        </h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Prezzo minimo</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.5"
                min="0"
                value={pricing.basePrice}
                onChange={(e) => setPricing(p => ({ ...p, basePrice: parseFloat(e.target.value) || 0 }))}
                className="h-9"
              />
              <span className="text-sm text-muted-foreground">€</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Prezzo per km</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={pricing.pricePerKm}
                onChange={(e) => setPricing(p => ({ ...p, pricePerKm: parseFloat(e.target.value) || 0 }))}
                className="h-9"
              />
              <span className="text-sm text-muted-foreground">€/km</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Prezzo per minuto</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.1"
                min="0"
                value={pricing.pricePerMin}
                onChange={(e) => setPricing(p => ({ ...p, pricePerMin: parseFloat(e.target.value) || 0 }))}
                className="h-9"
              />
              <span className="text-sm text-muted-foreground">€/min</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Soglia sconto (km)</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="1"
                min="0"
                value={pricing.distanceThreshold}
                onChange={(e) => setPricing(p => ({ ...p, distanceThreshold: parseFloat(e.target.value) || 0 }))}
                className="h-9"
              />
              <span className="text-sm text-muted-foreground">km</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sconto &lt; {pricing.distanceThreshold}km</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={pricing.discountUnder5km}
                onChange={(e) => setPricing(p => ({ ...p, discountUnder5km: parseFloat(e.target.value) || 0 }))}
                className="h-9"
              />
              <span className="text-sm text-muted-foreground">= {Math.round((1 - pricing.discountUnder5km) * 100)}%</span>
            </div>
          </div>
          
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Sconto &gt; {pricing.distanceThreshold}km</Label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={pricing.discountOver5km}
                onChange={(e) => setPricing(p => ({ ...p, discountOver5km: parseFloat(e.target.value) || 0 }))}
                className="h-9"
              />
              <span className="text-sm text-muted-foreground">= {Math.round((1 - pricing.discountOver5km) * 100)}%</span>
            </div>
          </div>
        </div>

        <p className="text-xs text-muted-foreground pt-2 border-t border-border mt-3">
          💡 Nota: Questi valori sono solo di riferimento visivo. Per applicarli, aggiorna il codice di RideBookingForm.tsx
        </p>
      </div>

      {/* Vehicle Multipliers */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Percent className="h-4 w-4 text-yellow-500" />
          Coefficienti per Veicolo
        </h3>
        
        <div className="space-y-3">
          {vehicles.map((vehicle) => {
            const multiplier = parseFloat(vehicleMultipliers[vehicle.vehicle_type] || "1");
            const examplePrice = calculateExamplePrice(multiplier);
            
            return (
              <div
                key={vehicle.id}
                className="flex items-center gap-3 p-3 bg-muted/20 rounded-lg border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {vehicle.display_name || vehicle.vehicle_type}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Esempio 10km/15min: <span className="font-semibold text-foreground">€{examplePrice.toFixed(2)}</span>
                  </p>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-20">
                    <Input
                      type="number"
                      step="0.05"
                      min="0.1"
                      max="5"
                      value={vehicleMultipliers[vehicle.vehicle_type] || "1"}
                      onChange={(e) => setVehicleMultipliers(prev => ({
                        ...prev,
                        [vehicle.vehicle_type]: e.target.value
                      }))}
                      className="h-8 text-center"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground w-16 text-right">
                    {getMultiplierLabel(multiplier)}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleSaveMultiplier(vehicle.vehicle_type)}
                    disabled={isSaving}
                    className="h-8 w-8 p-0 hover:bg-yellow-400/20"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <p className="text-xs text-muted-foreground">
          Coefficiente 1.0 = tariffa base, 0.85 = -15%, 1.30 = +30%
        </p>
      </div>
    </div>
  );
}
