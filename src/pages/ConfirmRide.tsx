import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MapPin, Loader2, CheckCircle, XCircle, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type ConfirmationStatus = "loading" | "requesting-location" | "calculating" | "success" | "error" | "already-confirmed";

export default function ConfirmRide() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<ConfirmationStatus>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [etaMin, setEtaMin] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("Token non valido");
      return;
    }
    // Initial state - ready to request location
    setStatus("requesting-location");
  }, [token]);

  const handleConfirm = async () => {
    if (!token) return;

    setStatus("calculating");

    try {
      // Request geolocation
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocalizzazione non supportata dal browser"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            switch (error.code) {
              case error.PERMISSION_DENIED:
                reject(new Error("Permesso di geolocalizzazione negato. Abilita la posizione nelle impostazioni."));
                break;
              case error.POSITION_UNAVAILABLE:
                reject(new Error("Posizione non disponibile"));
                break;
              case error.TIMEOUT:
                reject(new Error("Timeout nella richiesta della posizione"));
                break;
              default:
                reject(new Error("Errore nella geolocalizzazione"));
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
      });

      const adminLat = position.coords.latitude;
      const adminLon = position.coords.longitude;

      // Call confirm-ride edge function
      const { data, error } = await supabase.functions.invoke("confirm-ride", {
        body: {
          token,
          adminLat,
          adminLon,
        },
      });

      if (error) throw error;

      if (data.success) {
        setEtaMin(data.etaMin);
        setDistanceKm(data.distanceKm);
        setStatus("success");
        // Auto-open WhatsApp
        if (data.whatsappLink) {
          window.open(data.whatsappLink, "_blank");
        }
      } else {
        if (data.error?.includes("già confermata") || data.error?.includes("non trovata")) {
          setStatus("already-confirmed");
        } else {
          throw new Error(data.error || "Errore nella conferma");
        }
      }
    } catch (error) {
      console.error("Confirm error:", error);
      setStatus("error");
      setErrorMessage(error instanceof Error ? error.message : "Errore sconosciuto");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 p-6 text-center">
            <h1 className="text-2xl font-bold text-primary-foreground">
              {status === "success" ? "✅ Corsa Confermata" : "🚗 Conferma Corsa"}
            </h1>
          </div>

          <div className="p-6">
            {status === "loading" && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-muted-foreground">Caricamento...</p>
              </div>
            )}

            {status === "requesting-location" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Navigation className="h-10 w-10 text-primary" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Condividi la tua posizione
                  </h2>
                  <p className="text-muted-foreground">
                    Per calcolare il tempo di arrivo al cliente, abbiamo bisogno della tua posizione attuale.
                  </p>
                </div>

                <Button
                  onClick={handleConfirm}
                  className="w-full h-14 text-lg font-semibold bg-primary hover:bg-primary/90"
                >
                  <MapPin className="mr-2 h-5 w-5" />
                  Conferma con la mia posizione
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  La posizione verrà utilizzata solo per calcolare il tempo di arrivo.
                </p>
              </div>
            )}

            {status === "calculating" && (
              <div className="text-center py-8">
                <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
                <p className="mt-4 text-foreground font-medium">Calcolo tempo di arrivo...</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Stiamo calcolando il percorso e inviando la conferma al cliente
                </p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-12 w-12 text-green-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">
                    Corsa confermata!
                  </h2>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl text-center">
                  <p className="text-sm text-green-700 uppercase tracking-wide mb-2">
                    Tempo di arrivo stimato
                  </p>
                  <p className="text-5xl font-bold text-green-700">{etaMin} min</p>
                  {distanceKm && (
                    <p className="text-sm text-green-600 mt-2">
                      Distanza: {distanceKm} km
                    </p>
                  )}
                </div>

                <p className="text-center text-muted-foreground text-sm">
                  WhatsApp si è aperto automaticamente per contattare il cliente.
                </p>
              </div>
            )}

            {status === "already-confirmed" && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-12 w-12 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Corsa già confermata
                </h2>
                <p className="text-muted-foreground">
                  Questa richiesta di corsa è già stata confermata o non esiste più.
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <XCircle className="h-12 w-12 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                  Errore
                </h2>
                <p className="text-muted-foreground mb-4">{errorMessage}</p>
                <Button onClick={handleConfirm} variant="outline">
                  Riprova
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
