import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ORS_BASE_URL = "https://api.openrouteservice.org";

// Base location (driver's starting point)
const BASE_LOCATION = "Via Manfredo Fanti 2, Milano, Italia";
const ETA_BUFFER_MINUTES = 3; // Buffer time to add to ETA

// Milan bounding box (approximate city limits) - for pickup only
const MILAN_BOUNDS = {
  minLat: 45.40,
  maxLat: 45.54,
  minLon: 9.04,
  maxLon: 9.30,
};

// Lombardy bounding box - for destinations
const LOMBARDY_BOUNDS = {
  minLat: 44.68,
  maxLat: 46.64,
  minLon: 8.50,
  maxLon: 11.43,
};

// Check if coordinates are within Milan
function isInMilan(lon: number, lat: number): boolean {
  return (
    lat >= MILAN_BOUNDS.minLat &&
    lat <= MILAN_BOUNDS.maxLat &&
    lon >= MILAN_BOUNDS.minLon &&
    lon <= MILAN_BOUNDS.maxLon
  );
}

// Check if coordinates are within Lombardy
function isInLombardy(lon: number, lat: number): boolean {
  return (
    lat >= LOMBARDY_BOUNDS.minLat &&
    lat <= LOMBARDY_BOUNDS.maxLat &&
    lon >= LOMBARDY_BOUNDS.minLon &&
    lon <= LOMBARDY_BOUNDS.maxLon
  );
}

interface RouteRequest {
  pickup: string;
  destination: string;
}

interface GeocodingResult {
  features: Array<{
    geometry: {
      coordinates: [number, number]; // [lon, lat]
    };
    properties: {
      label: string;
    };
  }>;
}

interface RouteResult {
  features: Array<{
    properties: {
      summary: {
        distance: number; // meters
        duration: number; // seconds
      };
    };
  }>;
}

// Normalize address for Milan (pickup)
function normalizeAddressMilan(address: string): string {
  const normalized = address.trim();
  if (/milan[oi]?/i.test(normalized)) {
    return normalized;
  }
  return `${normalized}, Milano, Italia`;
}

// Normalize address for Lombardy (destination)
function normalizeAddressLombardy(address: string): string {
  const normalized = address.trim();
  if (/lombard/i.test(normalized) || /italia/i.test(normalized)) {
    return normalized;
  }
  return `${normalized}, Lombardia, Italia`;
}

// Geocode an address to coordinates (restricted to Milan - for pickup)
async function geocodeAddressMilan(address: string, apiKey: string): Promise<[number, number] | null> {
  const normalizedAddress = normalizeAddressMilan(address);
  
  const url = `${ORS_BASE_URL}/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(normalizedAddress)}&boundary.country=IT&boundary.rect.min_lon=${MILAN_BOUNDS.minLon}&boundary.rect.min_lat=${MILAN_BOUNDS.minLat}&boundary.rect.max_lon=${MILAN_BOUNDS.maxLon}&boundary.rect.max_lat=${MILAN_BOUNDS.maxLat}&size=5`;
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Geocoding failed for "${address}": ${response.status}`);
    return null;
  }
  
  const data: GeocodingResult = await response.json();
  
  if (data.features && data.features.length > 0) {
    for (const feature of data.features) {
      const [lon, lat] = feature.geometry.coordinates;
      const label = feature.properties.label.toLowerCase();
      
      if (isInMilan(lon, lat) && label.includes("milan")) {
        console.log(`Found address "${address}" at [${lon}, ${lat}] - ${feature.properties.label}`);
        return [lon, lat];
      }
    }
    
    console.error(`No Milan location found for "${address}". Results were outside Milan bounds.`);
    return null;
  }
  
  return null;
}

// Geocode an address to coordinates (restricted to Lombardy - for destination)
async function geocodeAddressLombardy(address: string, apiKey: string): Promise<[number, number] | null> {
  const normalizedAddress = normalizeAddressLombardy(address);
  
  const url = `${ORS_BASE_URL}/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(normalizedAddress)}&boundary.country=IT&boundary.rect.min_lon=${LOMBARDY_BOUNDS.minLon}&boundary.rect.min_lat=${LOMBARDY_BOUNDS.minLat}&boundary.rect.max_lon=${LOMBARDY_BOUNDS.maxLon}&boundary.rect.max_lat=${LOMBARDY_BOUNDS.maxLat}&size=5`;
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Geocoding failed for "${address}": ${response.status}`);
    return null;
  }
  
  const data: GeocodingResult = await response.json();
  
  if (data.features && data.features.length > 0) {
    for (const feature of data.features) {
      const [lon, lat] = feature.geometry.coordinates;
      
      if (isInLombardy(lon, lat)) {
        console.log(`Found destination "${address}" at [${lon}, ${lat}] - ${feature.properties.label}`);
        return [lon, lat];
      }
    }
    
    console.error(`No Lombardy location found for "${address}". Results were outside Lombardy bounds.`);
    return null;
  }
  
  return null;
}

// Calculate route between two coordinate pairs
async function calculateRoute(
  start: [number, number],
  end: [number, number],
  apiKey: string
): Promise<{ distance: number; duration: number } | null> {
  const url = `${ORS_BASE_URL}/v2/directions/driving-car?api_key=${apiKey}&start=${start[0]},${start[1]}&end=${end[0]},${end[1]}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Route calculation failed: ${response.status}`);
    return null;
  }
  
  const data: RouteResult = await response.json();
  
  if (data.features && data.features.length > 0) {
    const summary = data.features[0].properties.summary;
    return {
      distance: summary.distance, // meters
      duration: summary.duration, // seconds
    };
  }
  
  return null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENROUTE_API_KEY = Deno.env.get("OPENROUTE_API_KEY");
    if (!OPENROUTE_API_KEY) {
      throw new Error("OPENROUTE_API_KEY is not configured");
    }

    const { pickup, destination }: RouteRequest = await req.json();

    if (!pickup || !destination) {
      throw new Error("Missing required fields: pickup or destination");
    }

    // Geocode pickup (Milan only)
    console.log(`Geocoding pickup: "${pickup}"`);
    const pickupCoords = await geocodeAddressMilan(pickup, OPENROUTE_API_KEY);
    
    // Geocode destination (all Lombardy)
    console.log(`Geocoding destination: "${destination}"`);
    const destCoords = await geocodeAddressLombardy(destination, OPENROUTE_API_KEY);

    if (!pickupCoords) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Impossibile trovare l'indirizzo di partenza. Prova con un indirizzo più specifico." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!destCoords) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Impossibile trovare l'indirizzo di destinazione. Prova con un indirizzo in Lombardia." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Geocode base location for ETA calculation
    console.log(`Geocoding base location: "${BASE_LOCATION}"`);
    const baseCoords = await geocodeAddressMilan(BASE_LOCATION, OPENROUTE_API_KEY);

    // Calculate route from pickup to destination
    console.log(`Calculating route from [${pickupCoords}] to [${destCoords}]`);
    const route = await calculateRoute(pickupCoords, destCoords, OPENROUTE_API_KEY);

    if (!route) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Impossibile calcolare il percorso tra gli indirizzi specificati." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Calculate ETA from base to pickup (driver arrival time)
    let etaMin = ETA_BUFFER_MINUTES; // Default buffer if base geocoding fails
    if (baseCoords) {
      console.log(`Calculating ETA from base [${baseCoords}] to pickup [${pickupCoords}]`);
      const etaRoute = await calculateRoute(baseCoords, pickupCoords, OPENROUTE_API_KEY);
      if (etaRoute) {
        etaMin = Math.round(etaRoute.duration / 60) + ETA_BUFFER_MINUTES;
        console.log(`ETA calculated: ${etaMin} min (including ${ETA_BUFFER_MINUTES} min buffer)`);
      }
    }

    // Convert to km and minutes
    const distanceKm = Math.round(route.distance / 100) / 10; // Round to 1 decimal
    const durationMin = Math.round(route.duration / 60);

    // Generate Google Maps link
    const mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords[1]},${pickupCoords[0]}&destination=${destCoords[1]},${destCoords[0]}`;

    console.log(`Route calculated: ${distanceKm}km, ${durationMin}min, ETA: ${etaMin}min`);

    return new Response(
      JSON.stringify({
        success: true,
        distanceKm,
        durationMin,
        etaMin,
        mapsLink,
        pickupCoords: { lat: pickupCoords[1], lon: pickupCoords[0] },
        destCoords: { lat: destCoords[1], lon: destCoords[0] },
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in calculate-route function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
