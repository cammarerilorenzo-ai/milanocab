import { useState, useEffect, useCallback } from "react";
import { Calendar, Clock, MapPin, Navigation, Car, Loader2, Route } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { RideConfirmationDialog } from "@/components/RideConfirmationDialog";
interface RideFormData {
  pickup: string;
  destination: string;
  isScheduled: boolean;
  scheduledDate: string;
  scheduledTime: string;
}
interface RouteEstimate {
  distanceKm: number;
  durationMin: number;
  etaMin: number;
  mapsLink: string;
  price: number;
  isFixedPrice: boolean;
  pickupCoords: {
    lat: number;
    lon: number;
  };
  destCoords: {
    lat: number;
    lon: number;
  };
}

// Pricing configuration
const PRICING = {
  basePrice: 5.0,      // € prezzo minimo
  pricePerKm: 1.5,     // € per km
  pricePerMin: 0.3,    // € per minuto
  discountUnder5km: 0.95,  // 5% sconto sotto i 5km
  discountOver5km: 0.50,   // 50% sconto sopra i 5km
  distanceThreshold: 5     // km soglia per sconto maggiore
};

// Debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}
export function RideBookingForm() {
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [routeEstimate, setRouteEstimate] = useState<RouteEstimate | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmedRide, setConfirmedRide] = useState<{
    pickup: string;
    destination: string;
    routeEstimate: RouteEstimate;
  } | null>(null);
  const [formData, setFormData] = useState<RideFormData>({
    pickup: "",
    destination: "",
    isScheduled: false,
    scheduledDate: "",
    scheduledTime: ""
  });

  // Debounce addresses for API calls
  const debouncedPickup = useDebounce(formData.pickup, 800);
  const debouncedDestination = useDebounce(formData.destination, 800);

  // Calculate route when addresses change
  const calculateRoute = useCallback(async () => {
    if (!debouncedPickup.trim() || !debouncedDestination.trim()) {
      setRouteEstimate(null);
      setRouteError(null);
      return;
    }

    // Minimum address length to avoid unnecessary API calls
    if (debouncedPickup.length < 5 || debouncedDestination.length < 5) {
      return;
    }
    setIsCalculating(true);
    setRouteError(null);
    try {
      // Aggiungi sempre ", Milano" al pickup per assicurare geocodifica corretta
      const pickupAddress = debouncedPickup.trim().toLowerCase().includes("milano") 
        ? debouncedPickup.trim() 
        : `${debouncedPickup.trim()}, Milano`;
      
      // Località che indicano una destinazione specifica (non Milano di default)
      const specificLocations = ["malpensa", "orio", "bergamo", "linate", "aeroporto", "monza", "como", "brescia", "varese", "pavia", "lecco", "cremona", "mantova", "lodi", "sondrio"];
      const destLower = debouncedDestination.trim().toLowerCase();
      const hasSpecificLocation = specificLocations.some(loc => destLower.includes(loc)) || destLower.includes("milano");
      
      const destinationAddress = hasSpecificLocation
        ? debouncedDestination.trim()
        : `${debouncedDestination.trim()}, Milano`;
      
      const {
        data,
        error
      } = await supabase.functions.invoke("calculate-route", {
        body: {
          pickup: pickupAddress,
          destination: destinationAddress
        }
      });
      if (error) throw error;
      if (data.success) {
        // Use fixed price if available, otherwise calculate
        const isFixedPrice = data.fixedPrice !== null && data.fixedPrice !== undefined;
        const calculatedPrice = PRICING.basePrice + data.distanceKm * PRICING.pricePerKm + data.durationMin * PRICING.pricePerMin;
        // Applica sconto 50% se oltre 5km, altrimenti 5%
        const discount = data.distanceKm > PRICING.distanceThreshold ? PRICING.discountOver5km : PRICING.discountUnder5km;
        const rawPrice = isFixedPrice ? data.fixedPrice : calculatedPrice * discount;
        // Round down to nearest 50 cents
        const price = Math.floor(rawPrice * 2) / 2;
        setRouteEstimate({
          distanceKm: data.distanceKm,
          durationMin: data.durationMin,
          etaMin: data.etaMin,
          mapsLink: data.mapsLink,
          price,
          isFixedPrice,
          pickupCoords: data.pickupCoords,
          destCoords: data.destCoords
        });
        setRouteError(null);
      } else {
        setRouteError(data.error);
        setRouteEstimate(null);
      }
    } catch (error) {
      console.error("Error calculating route:", error);
      setRouteError("Errore nel calcolo del percorso");
      setRouteEstimate(null);
    } finally {
      setIsCalculating(false);
    }
  }, [debouncedPickup, debouncedDestination]);
  useEffect(() => {
    calculateRoute();
  }, [calculateRoute]);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.phone) {
      toast({
        title: "Errore",
        description: "Devi essere autenticato per prenotare una corsa",
        variant: "destructive"
      });
      return;
    }
    if (!formData.pickup.trim() || !formData.destination.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci punto di partenza e destinazione",
        variant: "destructive"
      });
      return;
    }
    if (formData.isScheduled) {
      if (!formData.scheduledDate || !formData.scheduledTime) {
        toast({
          title: "Data e ora richieste",
          description: "Inserisci data e ora della corsa programmata",
          variant: "destructive"
        });
        return;
      }

      // Validate minimum 30 minutes advance booking for scheduled rides
      const scheduledDateTime = new Date(`${formData.scheduledDate}T${formData.scheduledTime}`);
      const minBookingTime = new Date(Date.now() + 30 * 60 * 1000);
      if (scheduledDateTime < minBookingTime) {
        toast({
          title: "Orario non valido",
          description: "La prenotazione deve essere almeno 30 minuti in anticipo",
          variant: "destructive"
        });
        return;
      }
    }
    if (!routeEstimate) {
      toast({
        title: "Percorso non calcolato",
        description: "Attendi il calcolo del percorso o verifica gli indirizzi",
        variant: "destructive"
      });
      return;
    }
    setIsLoading(true);
    try {
      const rideDateTime = formData.isScheduled ? `${formData.scheduledDate} - ${formData.scheduledTime}` : "Immediata";
      const {
        data,
        error
      } = await supabase.functions.invoke("send-ride-notification", {
        body: {
          customerPhone: user.phone.replace(/\D/g, ""),
          pickup: formData.pickup.trim(),
          destination: formData.destination.trim(),
          dateTime: rideDateTime,
          estimatedPrice: routeEstimate.price,
          estimatedKm: routeEstimate.distanceKm,
          estimatedMin: routeEstimate.durationMin,
          mapsLink: routeEstimate.mapsLink,
          pickupCoords: routeEstimate.pickupCoords,
          destCoords: routeEstimate.destCoords
        }
      });
      if (error) throw error;

      // Save confirmed ride data and show confirmation dialog
      setConfirmedRide({
        pickup: formData.pickup.trim(),
        destination: formData.destination.trim(),
        routeEstimate: routeEstimate
      });
      setShowConfirmation(true);

      // Reset form
      setFormData({
        pickup: "",
        destination: "",
        isScheduled: false,
        scheduledDate: "",
        scheduledTime: ""
      });
      setRouteEstimate(null);
    } catch (error) {
      console.error("Error submitting ride request:", error);
      toast({
        title: "Errore",
        description: "Impossibile inviare la richiesta. Riprova.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get minimum date (today) for scheduling
  const today = new Date().toISOString().split("T")[0];
  return <form onSubmit={handleSubmit} className="space-y-6">
      {/* Phone */}
      

      {/* Pickup Location */}
      <div className="space-y-2">
        <Label htmlFor="pickup" className="text-sm font-medium text-foreground">
          Punto di partenza
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-500" />
          <Input id="pickup" placeholder="Es: Via Bagutta 14" value={formData.pickup} onChange={e => setFormData({
          ...formData,
          pickup: e.target.value
        })} className="pl-11 h-12 bg-card border-border" maxLength={200} />
        </div>
        <p className="text-xs text-muted-foreground">Solo indirizzi a Milano</p>
      </div>

      {/* Destination */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor="destination" className="text-sm font-medium text-foreground">
            Destinazione
          </Label>
          <span className="text-xs text-muted-foreground">Aggiungi indirizzo e civico</span>
        </div>
        <div className="relative">
          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-yellow-500" />
          <Input id="destination" placeholder="Es: Viale Monterosa 84" value={formData.destination} onChange={e => setFormData({
          ...formData,
          destination: e.target.value
        })} className="pl-11 h-12 bg-card border-border" maxLength={200} />
        </div>
        <p className="text-xs text-muted-foreground mb-2">Qualsiasi destinazione in Lombardia</p>
        
        {/* Airport suggestions */}
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setFormData({
          ...formData,
          destination: "Aeroporto Malpensa"
        })} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-yellow-400/20 hover:bg-yellow-400/30 text-foreground rounded-full border border-yellow-400/30 transition-colors">
            ✈️ Malpensa <span className="line-through text-muted-foreground">€75</span> <span className="font-semibold text-green-600">€65</span>
          </button>
          <button type="button" onClick={() => setFormData({
          ...formData,
          destination: "Aeroporto Orio al Serio"
        })} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-yellow-400/20 hover:bg-yellow-400/30 text-foreground rounded-full border border-yellow-400/30 transition-colors">
            ✈️ Bergamo Orio <span className="line-through text-muted-foreground">€75</span> <span className="font-semibold text-green-600">€65</span>
          </button>
          
        </div>
      </div>

      {/* Route Calculation Status */}
      {isCalculating && <div className="flex items-center gap-2 text-sm text-muted-foreground animate-in fade-in">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Calcolo percorso in corso...</span>
        </div>}

      {routeError && <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive animate-in fade-in">
          {routeError}
        </div>}

      {/* Schedule Toggle */}
      <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <p className="font-medium text-foreground">Programma corsa</p>
            <p className="text-sm text-muted-foreground">
              {formData.isScheduled ? "Minimo 30 min di anticipo" : "Corsa immediata"}
            </p>
          </div>
        </div>
        <Switch checked={formData.isScheduled} onCheckedChange={checked => setFormData({
        ...formData,
        isScheduled: checked,
        scheduledDate: checked ? today : "",
        scheduledTime: ""
      })} />
      </div>

      {/* Scheduled Date/Time - Only visible when scheduled */}
      {formData.isScheduled && <div className="p-4 bg-card rounded-xl border border-border space-y-4 animate-in fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium text-foreground">
                Data
              </Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="date" type="date" min={today} value={formData.scheduledDate} onChange={e => setFormData({
              ...formData,
              scheduledDate: e.target.value
            })} className="pl-11 h-12 bg-card border-border" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium text-foreground">
                Ora
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input id="time" type="time" value={formData.scheduledTime} onChange={e => setFormData({
              ...formData,
              scheduledTime: e.target.value
            })} className="pl-11 h-12 bg-card border-border" required />
              </div>
            </div>
          </div>
        </div>}

      {/* Price Estimate */}
      {routeEstimate && <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">
                {routeEstimate.isFixedPrice ? "Tariffa fissa aeroporto" : "Prezzo stimato"}
              </p>
              <p className="text-2xl font-bold text-green-600">€{routeEstimate.price.toFixed(2)}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-1 justify-end">
                <Route className="h-4 w-4" />
                <span>{routeEstimate.distanceKm} km</span>
              </div>
              <div className="flex items-center gap-1 justify-end">
                <Clock className="h-4 w-4" />
                <span>{routeEstimate.durationMin} min</span>
              </div>
              <div className={`flex items-center gap-1 justify-end mt-1 font-medium ${
                routeEstimate.etaMin < 10 
                  ? 'text-green-600' 
                  : routeEstimate.etaMin <= 20 
                    ? 'text-yellow-600' 
                    : 'text-red-600'
              }`}>
                <Car className="h-4 w-4" />
                <span>Arrivo in ~{routeEstimate.etaMin} min</span>
              </div>
            </div>
          </div>
          
        </div>}

      {/* Submit Button */}
      <Button type="submit" disabled={isLoading || isCalculating || !routeEstimate} className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 transition-all">
        {isLoading ? <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Invio in corso...
          </> : <>
            <Car className="mr-2 h-5 w-5" />
            Richiedi corsa
          </>}
      </Button>

      {/* Confirmation Dialog with Map */}
      {confirmedRide && <RideConfirmationDialog open={showConfirmation} pickup={confirmedRide.pickup} destination={confirmedRide.destination} distanceKm={confirmedRide.routeEstimate.distanceKm} durationMin={confirmedRide.routeEstimate.durationMin} price={confirmedRide.routeEstimate.price} pickupCoords={confirmedRide.routeEstimate.pickupCoords} destCoords={confirmedRide.routeEstimate.destCoords} />}
    </form>;
}