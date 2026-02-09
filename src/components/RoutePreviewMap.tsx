import { MapPin, Navigation, Route, Clock, Car } from "lucide-react";
import logo from "@/assets/logo.png";

interface RoutePreviewMapProps {
  pickupCoords: { lat: number; lon: number };
  destCoords: { lat: number; lon: number };
  pickup: string;
  destination: string;
  distanceKm: number;
  durationMin: number;
}

function capitalizeAddress(address: string): string {
  return address
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function RoutePreviewMap({
  pickupCoords,
  destCoords,
  pickup,
  destination,
  distanceKm,
  durationMin,
}: RoutePreviewMapProps) {
  const mapsEmbedUrl = `https://www.google.com/maps/embed/v1/directions?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&origin=${pickupCoords.lat},${pickupCoords.lon}&destination=${destCoords.lat},${destCoords.lon}&mode=driving&maptype=satellite&zoom=13`;

  return (
    <div className="rounded-xl overflow-hidden border border-border animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Map */}
      <div className="relative w-full h-44">
        <iframe
          src={mapsEmbedUrl}
          className="w-full h-full border-0"
          allowFullScreen
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Anteprima percorso"
        />
        {/* Logo overlay to cover Google's itinerary box */}
        <div className="absolute top-0 left-0 bg-white/95 backdrop-blur-sm rounded-br-lg p-1.5 shadow-md">
          <img src={logo} alt="Milano Cab" className="h-10 w-auto" />
        </div>
      </div>

      {/* Route details overlay */}
      <div className="p-3 bg-card/95 backdrop-blur-sm space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="truncate">{capitalizeAddress(pickup)}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Navigation className="h-4 w-4 text-accent flex-shrink-0" />
          <span className="truncate">{capitalizeAddress(destination)}</span>
        </div>
        <div className="flex items-center gap-3 pt-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Route className="h-3.5 w-3.5" /> {distanceKm} km
          </span>
          <span className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {durationMin} min
          </span>
        </div>
      </div>
    </div>
  );
}
