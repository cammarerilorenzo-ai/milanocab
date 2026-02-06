import { useState, useEffect } from "react";
import { MapPin, Navigation, Clock, Route, CheckCircle, Loader2, X, RefreshCw, XCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Funzione per capitalizzare correttamente gli indirizzi (title case)
function capitalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

interface RideConfirmationDialogProps {
  open: boolean;
  pickup: string;
  destination: string;
  distanceKm: number;
  durationMin: number;
  price: number;
  pickupCoords: {
    lat: number;
    lon: number;
  };
  destCoords: {
    lat: number;
    lon: number;
  };
  rideId?: string;
  etaMin?: number;
  onClose?: () => void;
}

export function RideConfirmationDialog({
  open,
  pickup,
  destination,
  distanceKm,
  durationMin,
  price,
  pickupCoords,
  destCoords,
  rideId,
  etaMin = 15,
  onClose
}: RideConfirmationDialogProps) {
  const { toast } = useToast();
  const [remainingMinutes, setRemainingMinutes] = useState<number>(etaMin + 2);
  const [rideStatus, setRideStatus] = useState<string>("pending");
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [lastKnownEta, setLastKnownEta] = useState<number | null>(null);

  // Reset remaining minutes when dialog opens
  useEffect(() => {
    if (!open) return;
    setRemainingMinutes(etaMin + 2);
    setLastKnownEta(null);
  }, [open, etaMin]);

  // Local countdown: decrement every 60 seconds
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      setRemainingMinutes(prev => (prev <= 0 ? 0 : prev - 1));
    }, 60000);

    return () => clearInterval(interval);
  }, [open]);

  // Poll for status updates every 10 seconds
  useEffect(() => {
    if (!open || !rideId) return;

    const pollStatus = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("admin-settings", {
          body: { action: "get_ride_status", rideId }
        });
        if (!error && data?.success && data.ride) {
          const newStatus = data.ride.status as string;
          const newEta = data.ride.eta_min as number;
          
          // Only reset countdown when admin actually changed the ETA
          if (newEta != null && newEta !== lastKnownEta) {
            setLastKnownEta(newEta);
            setRemainingMinutes(newEta);
          }
          
          setRideStatus(prev => {
            if (prev !== newStatus) {
              if (newStatus === "confirmed") {
                toast({
                  title: "🚗 Autista in arrivo!",
                  description: `La tua corsa è stata confermata. Arrivo tra ~${newEta || etaMin} minuti`,
                });
              } else if (newStatus === "picked_up") {
                toast({ title: "🎉 Sei a bordo!", description: "Buon viaggio!" });
              } else if (newStatus === "completed") {
                toast({ title: "✅ Corsa completata", description: "Grazie per aver viaggiato con noi!" });
              } else if (newStatus === "cancelled") {
                toast({ title: "Corsa annullata", description: "L'autista non è disponibile al momento", variant: "destructive" });
              }
            }
            return newStatus;
          });
        }
      } catch (err) {
        console.error("Poll status error:", err);
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 10000);

    return () => clearInterval(interval);
  }, [open, rideId, etaMin, toast, lastKnownEta]);

  const checkRideStatus = async () => {
    if (!rideId) return;
    
    setIsCheckingStatus(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "get_ride_status",
          rideId
        }
      });

      if (error) throw error;

      if (data.success && data.ride) {
        setRideStatus(data.ride.status);
        
        if (data.ride.status === "confirmed") {
          toast({
            title: "Corsa confermata! 🎉",
            description: `L'autista è in arrivo tra ~${data.ride.eta_min} minuti`
          });
        } else if (data.ride.status === "picked_up") {
          toast({
            title: "Sei a bordo! 🚗",
            description: "Buon viaggio!"
          });
        } else if (data.ride.status === "completed") {
          toast({
            title: "Corsa completata ✅",
            description: "Grazie per aver viaggiato con noi!"
          });
        } else if (data.ride.status === "cancelled") {
          toast({
            title: "Corsa annullata",
            description: "L'autista non è disponibile al momento",
            variant: "destructive"
          });
        } else {
          toast({
            title: "In attesa",
            description: "La tua richiesta è ancora in attesa di conferma"
          });
        }
      }
    } catch (error) {
      console.error("Error checking status:", error);
      toast({
        title: "Errore",
        description: "Impossibile verificare lo stato",
        variant: "destructive"
      });
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const cancelRide = async () => {
    if (!rideId) return;
    
    setIsCancelling(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "cancel_ride_user",
          rideId
        }
      });

      if (error) throw error;

      if (data.success) {
        setRideStatus("cancelled");
        toast({
          title: "Corsa annullata",
          description: "La tua richiesta è stata cancellata"
        });
        onClose?.();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error("Error cancelling ride:", error);
      toast({
        title: "Errore",
        description: error instanceof Error ? error.message : "Impossibile cancellare la corsa",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };

  // Create Google Maps embed URL with directions - satellite view with higher zoom
  const mapsEmbedUrl = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${pickupCoords.lat},${pickupCoords.lon}&destination=${destCoords.lat},${destCoords.lon}&mode=driving&maptype=satellite&zoom=15`;
  
  const getStatusColor = () => {
    switch (rideStatus) {
      case "confirmed": return "bg-green-500/20 text-green-700 border-green-500/30";
      case "cancelled": return "bg-red-500/20 text-red-700 border-red-500/30";
      default: return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
    }
  };

  const getStatusLabel = () => {
    switch (rideStatus) {
      case "confirmed": return "✅ Confermata";
      case "cancelled": return "❌ Annullata";
      default: return "⏳ In attesa";
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-lg p-0 overflow-hidden" 
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-4 pb-2 bg-primary/10">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-primary" />
            Corsa richiesta con successo!
          </DialogTitle>
        </DialogHeader>

        {/* Map */}
        <div className="relative w-full h-52">
          <iframe src={mapsEmbedUrl} className="w-full h-full border-0" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Percorso della corsa" />
          {/* Logo overlay with trip info */}
          <div className="absolute top-2 left-2 bg-white rounded-lg shadow-md p-2 flex items-center gap-3">
            <img src={logo} alt="Milano Cab" className="h-10 w-auto" />
            <div className="flex items-center gap-1.5 border-l pl-3">
              <Navigation className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Arrivo</span>
              <span className="text-sm font-semibold">
                ~{new Date(Date.now() + remainingMinutes * 60000 + durationMin * 60000).toLocaleTimeString('it-IT', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Countdown and Status */}
        <div className="px-4 pt-3 space-y-3">
          {/* Countdown */}
          <div className="flex items-center justify-between p-3 bg-primary/10 rounded-xl">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">Arrivo autista</span>
            </div>
            <span className="text-xl font-bold text-primary">
              {remainingMinutes > 0 ? `~${remainingMinutes} min` : "In arrivo!"}
            </span>
          </div>

          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`px-3 py-1.5 text-sm font-medium rounded-full border ${getStatusColor()}`}>
              {getStatusLabel()}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={checkRideStatus}
              disabled={isCheckingStatus || rideStatus === "cancelled"}
              className="gap-1.5"
            >
              {isCheckingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Aggiorna stato
            </Button>
          </div>
        </div>

        {/* Trip Details */}
        <div className="p-4 space-y-4">
          {/* Route Info */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Partenza</p>
                <p className="text-sm font-medium">{capitalizeAddress(pickup)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Destinazione</p>
                <p className="text-sm font-medium">{capitalizeAddress(destination)}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2">
              <Route className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{distanceKm} km</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{durationMin} min</span>
            </div>
            <div className="text-lg font-bold text-green-600">
              €{price.toFixed(2)}
            </div>
          </div>

          {/* Cancel Button - only for pending rides */}
          {rideStatus === "pending" && (
            <Button
              variant="destructive"
              className="w-full gap-2"
              onClick={cancelRide}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Annulla corsa
            </Button>
          )}

          {/* Close button for cancelled/confirmed */}
          {rideStatus !== "pending" && onClose && (
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
              Chiudi
            </Button>
          )}

          {/* Info message */}
          <p className="text-sm text-muted-foreground text-center">Per info contatta cabmilan@proton.me</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}