import { useState, useEffect } from "react";
import { MapPin, Navigation, Clock, Route, Check, X, Loader2, Phone, UserCheck, Flag, Plus, Minus, Star } from "lucide-react";
import { format } from "date-fns";
import { RideReviewDialog } from "./RideReviewDialog";
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
  confirmed_at?: string | null;
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
    case "picked_up":
      return "bg-blue-500/20 text-blue-700 border-blue-500/30";
    case "completed":
      return "bg-primary/20 text-primary border-primary/30 hover:bg-yellow-400/30";
    case "cancelled":
      return "bg-red-500/20 text-red-700 border-red-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case "pending":
      return "In attesa di conferma";
    case "confirmed":
      return "Confermata";
    case "picked_up":
      return "In corso";
    case "completed":
      return "Completata";
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
  const [isPickingUp, setIsPickingUp] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isAdjustingEta, setIsAdjustingEta] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [remainingMinutes, setRemainingMinutes] = useState<number | null>(null);
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);

  // Elapsed time for pending/confirmed
  useEffect(() => {
    if (ride.status === "pending" || ride.status === "confirmed") {
      const refTime = ride.status === "confirmed" && ride.confirmed_at
        ? new Date(ride.confirmed_at).getTime()
        : new Date(ride.created_at).getTime();
      
      const update = () => setElapsedMinutes(Math.floor((Date.now() - refTime) / 60000));
      update();
      const interval = setInterval(update, 60000);
      return () => clearInterval(interval);
    }
  }, [ride.status, ride.confirmed_at, ride.created_at]);

  // Countdown timer for ETA
  useEffect(() => {
    if (ride.status === "confirmed" && ride.eta_min) {
      // Calculate remaining minutes based on confirmed_at time
      const confirmedAt = ride.confirmed_at ? new Date(ride.confirmed_at).getTime() : Date.now();
      const elapsedMinutes = Math.floor((Date.now() - confirmedAt) / 60000);
      const initialRemaining = Math.max(0, ride.eta_min - elapsedMinutes);
      setRemainingMinutes(initialRemaining);

      const interval = setInterval(() => {
        setRemainingMinutes(prev => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1;
        });
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [ride.status, ride.eta_min, ride.confirmed_at]);

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

  const handlePickUp = async () => {
    setIsPickingUp(true);
    try {
      const { error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update_ride_status",
          phone: userPhone,
          rideId: ride.id,
          status: "picked_up"
        }
      });

      if (error) throw error;

      toast({
        title: "Cliente a bordo",
        description: "Corsa in corso"
      });
      onStatusChange?.();
    } catch (error) {
      console.error("Error picking up:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare lo stato",
        variant: "destructive"
      });
    } finally {
      setIsPickingUp(false);
    }
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    try {
      const { error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update_ride_status",
          phone: userPhone,
          rideId: ride.id,
          status: "completed"
        }
      });

      if (error) throw error;

      toast({
        title: "Corsa completata",
        description: "La corsa è stata terminata con successo"
      });
      onStatusChange?.();
    } catch (error) {
      console.error("Error completing ride:", error);
      toast({
        title: "Errore",
        description: "Impossibile completare la corsa",
        variant: "destructive"
      });
    } finally {
      setIsCompleting(false);
    }
  };

  const adjustEta = async (delta: number) => {
    if (!remainingMinutes && remainingMinutes !== 0) return;
    const newEta = Math.max(0, remainingMinutes + delta);
    
    setIsAdjustingEta(true);
    try {
      const { error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update_eta",
          phone: userPhone,
          rideId: ride.id,
          etaMin: newEta
        }
      });

      if (error) throw error;

      setRemainingMinutes(newEta);
    } catch (error) {
      console.error("Error adjusting ETA:", error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare l'ETA",
        variant: "destructive"
      });
    } finally {
      setIsAdjustingEta(false);
    }
  };

  const isUserRide = userPhone && ride.customer_phone.includes(userPhone.replace(/\D/g, ""));
  const showAdminControls = isAdmin && ride.status === "pending";
  const showPickUpButton = isAdmin && ride.status === "confirmed";
  const showCompleteButton = isAdmin && ride.status === "picked_up";

  return (
    <Card className="overflow-hidden border-border bg-card/95 backdrop-blur-sm">
      <CardContent className="p-4 space-y-3">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(ride.status)}`}>
            {getStatusLabel(ride.status)}
          </span>
          <span className="text-xs text-muted-foreground">
            {ride.status === "pending" && `⏳ ${elapsedMinutes} min`}
            {ride.status === "confirmed" && `✅ ${elapsedMinutes} min`}
            {ride.status === "completed" && format(new Date(ride.confirmed_at || ride.created_at), "dd/MM/yyyy HH:mm")}
            {ride.status !== "pending" && ride.status !== "confirmed" && ride.status !== "completed" && formatDateTime(ride.date_time)}
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
        {ride.status === "confirmed" && ride.eta_min != null && (
          <div className="flex items-center justify-between py-2 px-3 bg-green-500/10 rounded-lg">
            {isAdmin ? (
              <>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => adjustEta(-1)}
                  disabled={isAdjustingEta || (remainingMinutes ?? 0) <= 0}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <p className="text-sm text-green-700 font-medium">
                  🚗 ~{remainingMinutes ?? ride.eta_min} min
                </p>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  onClick={() => adjustEta(1)}
                  disabled={isAdjustingEta}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <p className="text-sm text-green-700 font-medium w-full text-center">
                {ride.eta_min > 0
                  ? `🚗 In arrivo tra ~${ride.eta_min} min`
                  : "🚗 In arrivo!"}
              </p>
            )}
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

        {/* Pick Up Button - for confirmed rides */}
        {showPickUpButton && (
          <Button
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700"
            onClick={handlePickUp}
            disabled={isPickingUp}
          >
            {isPickingUp ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <UserCheck className="h-4 w-4 mr-1" />
                Conferma Pick-up
              </>
            )}
          </Button>
        )}

        {/* Complete Ride Button - for picked up rides */}
        {showCompleteButton && (
          <Button
            size="sm"
            className="w-full"
            onClick={handleComplete}
            disabled={isCompleting}
          >
            {isCompleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Flag className="h-4 w-4 mr-1" />
                Termina Corsa
              </>
            )}
          </Button>
        )}

        {/* User cancel button for pending rides */}
        {!isAdmin && ride.status === "pending" && (
          <div className="flex flex-col gap-2 pt-2">
            <p className="text-xs text-center text-muted-foreground">
              In attesa di conferma...
            </p>
            <Button
              size="sm"
              variant="destructive"
              className="w-full"
              onClick={async () => {
                setIsCancelling(true);
                try {
                  const { data, error } = await supabase.functions.invoke("admin-settings", {
                    body: {
                      action: "cancel_ride_user",
                      rideId: ride.id,
                      phone: userPhone
                    }
                  });
                  if (error) throw error;
                  if (data?.success) {
                    toast({ title: "Corsa annullata", description: "La richiesta è stata annullata" });
                    onStatusChange?.();
                  } else {
                    throw new Error(data?.error || "Errore");
                  }
                } catch (error) {
                  console.error("Error cancelling ride:", error);
                  toast({ title: "Errore", description: "Impossibile annullare la corsa", variant: "destructive" });
                } finally {
                  setIsCancelling(false);
                }
              }}
              disabled={isCancelling}
            >
              {isCancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <><X className="h-4 w-4 mr-1" />Annulla corsa</>}
            </Button>
          </div>
        )}

        {/* Review prompt for completed rides (client only) */}
        {!isAdmin && ride.status === "completed" && !reviewSubmitted && (
          showReview ? (
            <RideReviewDialog
              rideId={ride.id}
              onClose={() => {
                setShowReview(false);
                setReviewSubmitted(true);
              }}
            />
          ) : (
            <div className="flex items-center justify-between pt-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={() => setShowReview(true)}
              >
                <Star className="h-4 w-4 mr-1" />
                Lascia una recensione
              </Button>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
}
