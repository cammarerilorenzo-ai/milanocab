import { useState } from "react";
import { Calendar, Clock, MapPin, Navigation, Car, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RideFormData {
  pickup: string;
  destination: string;
  isScheduled: boolean;
  scheduledDate: string;
  scheduledTime: string;
}

// Pricing configuration
const PRICING = {
  basePrice: 5.0, // € prezzo minimo
  pricePerKm: 1.5, // € per km
  pricePerMin: 0.3, // € per minuto
  estimatedKmPerAddress: 8, // stima km media (senza Google Maps)
  estimatedMinPerKm: 2, // minuti per km stimati
};

export function RideBookingForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RideFormData>({
    pickup: "",
    destination: "",
    isScheduled: false,
    scheduledDate: "",
    scheduledTime: "",
  });

  // Calculate estimated price based on inputs
  const calculateEstimatedPrice = () => {
    if (!formData.pickup || !formData.destination) return null;
    
    // Stima basata sulla lunghezza degli indirizzi (euristica semplice)
    const addressComplexity = (formData.pickup.length + formData.destination.length) / 20;
    const estimatedKm = Math.max(PRICING.estimatedKmPerAddress, addressComplexity * 3);
    const estimatedMin = estimatedKm * PRICING.estimatedMinPerKm;
    
    const price = PRICING.basePrice + 
      (estimatedKm * PRICING.pricePerKm) + 
      (estimatedMin * PRICING.pricePerMin);
    
    return {
      price: Math.round(price * 100) / 100,
      estimatedKm: Math.round(estimatedKm),
      estimatedMin: Math.round(estimatedMin),
    };
  };

  const estimate = calculateEstimatedPrice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.pickup.trim() || !formData.destination.trim()) {
      toast({
        title: "Campi obbligatori",
        description: "Inserisci punto di partenza e destinazione",
        variant: "destructive",
      });
      return;
    }

    if (formData.isScheduled && (!formData.scheduledDate || !formData.scheduledTime)) {
      toast({
        title: "Data e ora richieste",
        description: "Per una corsa programmata, inserisci data e ora",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const rideDateTime = formData.isScheduled 
        ? `${formData.scheduledDate} - ${formData.scheduledTime}`
        : "Immediata";

      const { data, error } = await supabase.functions.invoke("send-ride-notification", {
        body: {
          pickup: formData.pickup.trim(),
          destination: formData.destination.trim(),
          dateTime: rideDateTime,
          estimatedPrice: estimate?.price || 0,
          estimatedKm: estimate?.estimatedKm || 0,
          estimatedMin: estimate?.estimatedMin || 0,
        },
      });

      if (error) throw error;

      toast({
        title: "Richiesta inviata! 🚗",
        description: "Ti contatteremo a breve per confermare la corsa",
      });

      // Reset form
      setFormData({
        pickup: "",
        destination: "",
        isScheduled: false,
        scheduledDate: "",
        scheduledTime: "",
      });
    } catch (error) {
      console.error("Error submitting ride request:", error);
      toast({
        title: "Errore",
        description: "Impossibile inviare la richiesta. Riprova.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get minimum date (today) and time for scheduling
  const today = new Date().toISOString().split("T")[0];
  const now = new Date().toTimeString().slice(0, 5);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Pickup Location */}
      <div className="space-y-2">
        <Label htmlFor="pickup" className="text-sm font-medium text-foreground">
          Punto di partenza
        </Label>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
          <Input
            id="pickup"
            placeholder="Inserisci indirizzo di partenza"
            value={formData.pickup}
            onChange={(e) => setFormData({ ...formData, pickup: e.target.value })}
            className="pl-11 h-12 bg-card border-border"
            maxLength={200}
          />
        </div>
      </div>

      {/* Destination */}
      <div className="space-y-2">
        <Label htmlFor="destination" className="text-sm font-medium text-foreground">
          Destinazione
        </Label>
        <div className="relative">
          <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-accent" />
          <Input
            id="destination"
            placeholder="Inserisci destinazione"
            value={formData.destination}
            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
            className="pl-11 h-12 bg-card border-border"
            maxLength={200}
          />
        </div>
      </div>

      {/* Scheduled Ride Toggle */}
      <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <div>
            <p className="font-medium text-foreground">Programma corsa</p>
            <p className="text-sm text-muted-foreground">Prenota per dopo</p>
          </div>
        </div>
        <Switch
          checked={formData.isScheduled}
          onCheckedChange={(checked) => setFormData({ ...formData, isScheduled: checked })}
        />
      </div>

      {/* Scheduled Date/Time */}
      {formData.isScheduled && (
        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium text-foreground">
              Data
            </Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="date"
                type="date"
                min={today}
                value={formData.scheduledDate}
                onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                className="pl-11 h-12 bg-card border-border"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="time" className="text-sm font-medium text-foreground">
              Ora
            </Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="time"
                type="time"
                value={formData.scheduledTime}
                onChange={(e) => setFormData({ ...formData, scheduledTime: e.target.value })}
                className="pl-11 h-12 bg-card border-border"
              />
            </div>
          </div>
        </div>
      )}

      {/* Price Estimate */}
      {estimate && (
        <div className="p-4 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl border border-primary/20 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Prezzo stimato</p>
              <p className="text-2xl font-bold text-foreground">€{estimate.price.toFixed(2)}</p>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <p>~{estimate.estimatedKm} km</p>
              <p>~{estimate.estimatedMin} min</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isLoading || !formData.pickup || !formData.destination}
        className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-lg shadow-primary/25 transition-all"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Invio in corso...
          </>
        ) : (
          <>
            <Car className="mr-2 h-5 w-5" />
            Richiedi corsa
          </>
        )}
      </Button>
    </form>
  );
}
