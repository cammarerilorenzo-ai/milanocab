import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ORS_BASE_URL = "https://api.openrouteservice.org";

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

// Normalize address to always include Milano
function normalizeAddress(address: string): string {
  const normalized = address.trim();
  // If address already contains Milano/Milan, return as is
  if (/milan[oi]?/i.test(normalized)) {
    return normalized;
  }
  // Otherwise append Milano
  return `${normalized}, Milano, Italia`;
}

// Geocode an address to coordinates
async function geocodeAddress(address: string, apiKey: string): Promise<[number, number] | null> {
  const normalizedAddress = normalizeAddress(address);
  const url = `${ORS_BASE_URL}/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(normalizedAddress)}&boundary.country=IT&size=1`;
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Geocoding failed for "${address}": ${response.status}`);
    return null;
  }
  
  const data: GeocodingResult = await response.json();
  
  if (data.features && data.features.length > 0) {
    return data.features[0].geometry.coordinates;
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

    // Geocode both addresses
    console.log(`Geocoding pickup: "${pickup}"`);
    const pickupCoords = await geocodeAddress(pickup, OPENROUTE_API_KEY);
    
    console.log(`Geocoding destination: "${destination}"`);
    const destCoords = await geocodeAddress(destination, OPENROUTE_API_KEY);

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
          error: "Impossibile trovare l'indirizzo di destinazione. Prova con un indirizzo più specifico." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Calculate route
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

    // Convert to km and minutes
    const distanceKm = Math.round(route.distance / 100) / 10; // Round to 1 decimal
    const durationMin = Math.round(route.duration / 60);

    // Generate Google Maps link
    const mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords[1]},${pickupCoords[0]}&destination=${destCoords[1]},${destCoords[0]}`;

    console.log(`Route calculated: ${distanceKm}km, ${durationMin}min`);

    return new Response(
      JSON.stringify({
        success: true,
        distanceKm,
        durationMin,
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
