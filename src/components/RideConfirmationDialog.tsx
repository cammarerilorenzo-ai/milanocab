import { MapPin, Navigation, Clock, Route, CheckCircle } from "lucide-react";
import logo from "@/assets/logo.png";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
}
export function RideConfirmationDialog({
  open,
  pickup,
  destination,
  distanceKm,
  durationMin,
  price,
  pickupCoords,
  destCoords
}: RideConfirmationDialogProps) {
  // Create Google Maps embed URL with directions - satellite view with higher zoom
  const mapsEmbedUrl = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${pickupCoords.lat},${pickupCoords.lon}&destination=${destCoords.lat},${destCoords.lon}&mode=driving&maptype=satellite&zoom=15`;
  return <Dialog open={open} onOpenChange={() => {}}>
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
        <div className="relative w-full h-64">
          <iframe src={mapsEmbedUrl} className="w-full h-full border-0" allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade" title="Percorso della corsa" />
          {/* Logo overlay with trip info */}
          <div className="absolute top-2 left-2 bg-white rounded-lg shadow-md p-2 flex items-center gap-3">
            <img src={logo} alt="Milano Cab" className="h-10 w-auto" />
            <div className="flex items-center gap-1.5 border-l pl-3">
              <Navigation className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs text-muted-foreground">Arrivo</span>
              <span className="text-sm font-semibold">
                ~{new Date(Date.now() + 15 * 60000 + durationMin * 60000).toLocaleTimeString('it-IT', {
                hour: '2-digit',
                minute: '2-digit'
              })}
              </span>
            </div>
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

          {/* Info message */}
          <p className="text-sm text-muted-foreground text-center">Per info contatta cabmilan@proton.me</p>
        </div>
      </DialogContent>
    </Dialog>;
}