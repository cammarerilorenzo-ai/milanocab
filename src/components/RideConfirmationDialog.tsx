import { MapPin, Navigation, Clock, Route, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface RideConfirmationDialogProps {
  open: boolean;
  onClose: () => void;
  pickup: string;
  destination: string;
  distanceKm: number;
  durationMin: number;
  price: number;
  pickupCoords: { lat: number; lon: number };
  destCoords: { lat: number; lon: number };
}

export function RideConfirmationDialog({
  open,
  onClose,
  pickup,
  destination,
  distanceKm,
  durationMin,
  price,
  pickupCoords,
  destCoords,
}: RideConfirmationDialogProps) {
  // Create Google Maps embed URL with directions
  const mapsEmbedUrl = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${pickupCoords.lat},${pickupCoords.lon}&destination=${destCoords.lat},${destCoords.lon}&mode=driving`;

  // Create Google Maps link for external navigation
  const mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.lat},${pickupCoords.lon}&destination=${destCoords.lat},${destCoords.lon}`;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 bg-primary/10">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-primary" />
            Corsa richiesta con successo!
          </DialogTitle>
        </DialogHeader>

        {/* Map */}
        <div className="relative w-full h-64">
          <iframe
            src={mapsEmbedUrl}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Percorso della corsa"
          />
          {/* Logo overlay with extended white box to cover the Google box */}
          <div className="absolute top-2 left-2 bg-white rounded-lg shadow-md p-1 pr-48">
            <img src={logo} alt="Milano Cab" className="h-10 w-auto" />
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
                <p className="text-sm font-medium">{pickup}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Navigation className="h-5 w-5 text-accent mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs text-muted-foreground">Destinazione</p>
                <p className="text-sm font-medium">{destination}</p>
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
            <div className="text-lg font-bold text-primary">
              €{price.toFixed(2)}
            </div>
          </div>

          {/* Info message */}
          <p className="text-sm text-muted-foreground text-center">
            Ti contatteremo a breve su WhatsApp per confermare la corsa
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => window.open(mapsLink, "_blank")}
            >
              🗺️ Apri in Maps
            </Button>
            <Button className="flex-1" onClick={onClose}>
              Chiudi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
