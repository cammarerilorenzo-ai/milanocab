import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, MapPinOff, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AdminGpsTrackerProps {
  userPhone: string;
}

export function AdminGpsTracker({ userPhone }: AdminGpsTrackerProps) {
  const { toast } = useToast();
  const [isTracking, setIsTracking] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [prevUpdate, setPrevUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<Date | null>(null);

  useEffect(() => {
    startTracking();
    
    return () => {
      stopTracking();
    };
  }, []);

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError("Geolocalizzazione non supportata");
      return;
    }

    setIsTracking(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => updatePosition(position),
      (err) => handleError(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => updatePosition(position),
      (err) => handleError(err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  };

  const updatePosition = async (position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords;
    
    try {
      const { error } = await supabase.functions.invoke("admin-settings", {
        body: {
          action: "update_admin_location",
          phone: userPhone,
          latitude,
          longitude
        }
      });

      if (error) {
        console.error("Error updating GPS:", error);
        return;
      }

      setPrevUpdate(lastUpdateRef.current);
      const now = new Date();
      setLastUpdate(now);
      lastUpdateRef.current = now;
      setError(null);
    } catch (e) {
      console.error("Error updating admin position:", e);
    }
  };

  const handleError = (err: GeolocationPositionError) => {
    let message = "Errore geolocalizzazione";
    switch (err.code) {
      case err.PERMISSION_DENIED:
        message = "Permesso negato";
        break;
      case err.POSITION_UNAVAILABLE:
        message = "Posizione non disponibile";
        break;
      case err.TIMEOUT:
        message = "Timeout";
        break;
    }
    setError(message);
    setIsTracking(false);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isTracking ? (
            <MapPin className="h-5 w-5 text-primary animate-pulse" />
          ) : error ? (
            <MapPinOff className="h-5 w-5 text-destructive" />
          ) : (
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          )}
          <div>
            <p className="text-sm font-medium text-foreground">
              {isTracking ? "GPS Attivo" : error ? "GPS Non Attivo" : "Connessione..."}
            </p>
            {lastUpdate && (
              <p className="text-xs text-muted-foreground">
                Ultimo: {formatTime(lastUpdate)}
                {prevUpdate && (
                  <span className="ml-2 text-muted-foreground/60">
                    · Precedente: {formatTime(prevUpdate)}
                  </span>
                )}
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>
        </div>
        {!isTracking && !error && (
          <button
            onClick={startTracking}
            className="text-xs text-primary hover:underline"
          >
            Riprova
          </button>
        )}
      </div>
    </div>
  );
}
