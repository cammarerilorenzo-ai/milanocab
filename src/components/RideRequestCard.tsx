import { useState } from "react";
import { MapPin, Navigation, Clock, Route, Check, X, Loader2, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface RideRequest {
  id: string;
  pickup: string;
  destination: string;
  customer_phone: string;
  customer_name?: string | null;
  referral_name?: string | null;
  date_time: string;
  estimated_price: number;
  estimated_km: number;
  estimated_min: number;
  status: string;
  pickup_lat: number;
  pickup_lon: number;
  dest_lat: number;
  dest_lon: number;
  confirmation_token: string;
  created_at: string;
  eta_min?: number | null;
}

interface RideRequestCardProps {
  ride: RideRequest;
  isAdmin: boolean;
  userPhone?: string;
  onStatusChange?: () => void;
}

function capitalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function formatDateTime(dateTime: string): string {
  if (dateTime === "Immediata") return "Subito";
  return dateTime;
}

function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-500/20 text-yellow-700 border-yellow-500/30";
    case "confirmed":
      return "bg-green-500/20 text-green-700 border-green-500/30";
    case "cancelled":
      return "bg-red-500/20 text-red-700 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "In attesa";
    case "confirmed":
      return "Confermata";
    case "cancelled":
      return "Rifiutata";
    default:
      return status;
  }
}

export function RideRequestCard({ ride, isAdmin, userPhone, onStatusChange }: RideRequestCardProps) {
  const { toast } = useToast();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const handleConfirm = async () => {
    if (!navigator.geolocation) {
      toast({
        title: "Errore",
        description: "Geolocalizzazione non supportata",
        variant: "destructive"
      });
      return;
    }

    setIsConfirming(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { data, error } = await supabase.functions.invoke("confirm-ride", {
            body: {
              token: ride.confirmation_token,
              adminLat: position.coords.latitude,
              adminLon: position.coords.longitude
            }
          });

          if (error) throw error;

          if (data.success) {
            toast({
              title: "Corsa confermata",
              description: `ETA: ${data.etaMin} minuti`
            });
            
            // Open WhatsApp link
            if (data.whatsappLink) {
              window.open(data.whatsappLink, "_blank");
            }
            
            onStatusChange?.();
          } else {
            throw new Error(data.error);
          }
        } catch (error) {
          console.error("Error confirming ride:", error);
          toast({
            title: "Errore",
            description: "Impossibile confermare la corsa",
            variant: "destructive"
          });
        } finally {
          setIsConfirming(false);
        }
      },
      (error) => {
        setIsConfirming(false);
        toast({
          title: "Errore GPS",
          description: "Abilita la geolocalizzazione per confermare",
          variant: "destructive"
        });
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      const { error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update_ride_status",
          phone: userPhone,
          rideId: ride.id,
          status: "cancelled"
        }
      });

      if (error) throw error;

      toast({
        title: "Corsa rifiutata",
        description: "La richiesta è stata annullata"
      });
      onStatusChange?.();
    } catch (error) {
      console.error("Error rejecting ride:", error);
      toast({
        title: "Errore",
        description: "Impossibile rifiutare la corsa",
        variant: "destructive"
      });
    } finally {
      setIsRejecting(false);
    }
  };

  const isUserRide = userPhone && ride.customer_phone.includes(userPhone.replace(/\D/g, ""));
  const showAdminControls = isAdmin && ride.status === "pending";

  return (
    <Card className="overflow-hidden border-border bg-card/95 backdrop-blur-sm">
      <CardContent className="p-4 space-y-3">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(ride.status)}`}>
            {getStatusLabel(ride.status)}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(ride.date_time)}
          </span>
        </div>

        {/* Route Info */}
        <div className="space-y-2">
          <div className="flex items-start gap-2">
            <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Partenza</p>
              <p className="text-sm font-medium truncate">{capitalizeAddress(ride.pickup)}</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Navigation className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground">Destinazione</p>
              <p className="text-sm font-medium truncate">{capitalizeAddress(ride.destination)}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-2">
          <div className="flex items-center gap-1.5">
            <Route className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{ride.estimated_km} km</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{ride.estimated_min} min</span>
          </div>
          <span className="font-bold text-green-600">€{Number(ride.estimated_price).toFixed(2)}</span>
        </div>

        {/* ETA for confirmed rides */}
        {ride.status === "confirmed" && ride.eta_min && (
          <div className="text-center py-2 bg-green-500/10 rounded-lg">
            <p className="text-sm text-green-700 font-medium">
              🚗 In arrivo tra ~{ride.eta_min} minuti
            </p>
          </div>
        )}

        {/* Admin customer info */}
        {isAdmin && (
          <div className="space-y-1 text-xs border-t border-border pt-2">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span className="font-medium">{ride.customer_name || "—"}</span>
              <span className="text-muted-foreground/70">({ride.customer_phone})</span>
            </div>
            {ride.referral_name && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded">REF</span>
                <span>{ride.referral_name}</span>
              </div>
            )}
          </div>
        )}

        {/* Admin Controls */}
        {showAdminControls && (
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={handleConfirm}
              disabled={isConfirming || isRejecting}
            >
              {isConfirming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Accetta
                </>
              )}
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={handleReject}
              disabled={isConfirming || isRejecting}
            >
              {isRejecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <X className="h-4 w-4 mr-1" />
                  Rifiuta
                </>
              )}
            </Button>
          </div>
        )}

        {/* User waiting message */}
        {!isAdmin && ride.status === "pending" && isUserRide && (
          <p className="text-xs text-center text-muted-foreground">
            In attesa di conferma...
          </p>
        )}
      </CardContent>
    </Card>
  );
}
