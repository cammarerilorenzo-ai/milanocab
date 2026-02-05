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

// Fixed airport prices
const AIRPORT_PRICES: Record<string, number> = {
  malpensa: 75,
  "orio al serio": 75,
  bergamo: 75, // Bergamo airport
};

// Fixed airport coordinates (on accessible roads near terminals)
const AIRPORT_COORDS: Record<string, [number, number]> = {
  malpensa: [8.7114, 45.6301],      // Terminal 1 entrance road
  "orio al serio": [9.7016, 45.6694], // Orio al Serio airport road
  bergamo: [9.7016, 45.6694],        // Same as Orio
  linate: [9.2780, 45.4491],          // Linate airport road
};

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

// Check if destination is an airport with fixed price
function getAirportFixedPrice(destination: string): number | null {
  const normalizedDest = destination.toLowerCase();
  
  for (const [keyword, price] of Object.entries(AIRPORT_PRICES)) {
    if (normalizedDest.includes(keyword)) {
      return price;
    }
  }
  
  // Also check for "aeroporto" keyword combined with city names
  if (normalizedDest.includes("aeroporto")) {
    if (normalizedDest.includes("bergamo") || normalizedDest.includes("orio")) {
      return 75;
    }
    if (normalizedDest.includes("malpensa") || normalizedDest.includes("varese")) {
      return 75;
    }
    if (normalizedDest.includes("linate")) {
      return 50; // Linate is closer
    }
  }
  
  return null;
}

// Get fixed coordinates for known airports
function getAirportCoords(destination: string): [number, number] | null {
  const normalizedDest = destination.toLowerCase();
  
  for (const [keyword, coords] of Object.entries(AIRPORT_COORDS)) {
    if (normalizedDest.includes(keyword)) {
      return coords;
    }
  }
  
  // Also check for "aeroporto" keyword combined with city names
  if (normalizedDest.includes("aeroporto")) {
    if (normalizedDest.includes("bergamo") || normalizedDest.includes("orio")) {
      return AIRPORT_COORDS["orio al serio"];
    }
    if (normalizedDest.includes("malpensa") || normalizedDest.includes("varese")) {
      return AIRPORT_COORDS.malpensa;
    }
    if (normalizedDest.includes("linate")) {
      return AIRPORT_COORDS.linate;
    }
  }
  
  return null;
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
  // GeoJSON format (GET request)
  features?: Array<{
    properties: {
      summary: {
        distance: number; // meters
        duration: number; // seconds
      };
    };
  }>;
  // JSON format (POST request)
  routes?: Array<{
    summary: {
      distance: number; // meters
      duration: number; // seconds
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
  
  // Usa focus.point per prioritizzare risultati vicino al centro di Milano
  const milanCenterLat = 45.4642;
  const milanCenterLon = 9.1900;
  
  const url = `${ORS_BASE_URL}/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(normalizedAddress)}&boundary.country=IT&boundary.rect.min_lon=${MILAN_BOUNDS.minLon}&boundary.rect.min_lat=${MILAN_BOUNDS.minLat}&boundary.rect.max_lon=${MILAN_BOUNDS.maxLon}&boundary.rect.max_lat=${MILAN_BOUNDS.maxLat}&focus.point.lat=${milanCenterLat}&focus.point.lon=${milanCenterLon}&size=10`;
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Geocoding failed for "${address}": ${response.status}`);
    return null;
  }
  
  const data: GeocodingResult = await response.json();
  
  if (data.features && data.features.length > 0) {
    // Prima cerca risultati esplicitamente a Milano
    for (const feature of data.features) {
      const [lon, lat] = feature.geometry.coordinates;
      const label = feature.properties.label.toLowerCase();
      
      if (isInMilan(lon, lat) && label.includes("milan")) {
        console.log(`Found address "${address}" at [${lon}, ${lat}] - ${feature.properties.label}`);
        return [lon, lat];
      }
    }
    
    // Se non trova "milan" nel label, prendi il primo risultato dentro i bounds di Milano
    for (const feature of data.features) {
      const [lon, lat] = feature.geometry.coordinates;
      
      if (isInMilan(lon, lat)) {
        console.log(`Found address "${address}" at [${lon}, ${lat}] (in Milan bounds) - ${feature.properties.label}`);
        return [lon, lat];
      }
    }
    
    console.error(`No Milan location found for "${address}". Results were outside Milan bounds.`);
    return null;
  }
  
  return null;
}

// Check if destination contains a specific location (not default to Milan)
function hasSpecificLocation(address: string): boolean {
  const specificLocations = ["malpensa", "orio", "bergamo", "linate", "aeroporto", "monza", "como", "brescia", "varese", "pavia", "lecco", "cremona", "mantova", "lodi", "sondrio", "milano", "milan"];
  const addressLower = address.toLowerCase();
  return specificLocations.some(loc => addressLower.includes(loc));
}

// Geocode an address to coordinates (restricted to Lombardy - for destination)
async function geocodeAddressLombardy(address: string, apiKey: string): Promise<[number, number] | null> {
  // Se non c'è una località specifica, prioritizza Milano
  const shouldPrioritizeMilan = !hasSpecificLocation(address);
  
  const normalizedAddress = shouldPrioritizeMilan 
    ? `${address.trim()}, Milano, Italia`
    : normalizeAddressLombardy(address);
  
  // Usa focus.point per prioritizzare risultati vicino al centro di Milano se non specificato altro
  const milanCenterLat = 45.4642;
  const milanCenterLon = 9.1900;
  
  const focusParams = shouldPrioritizeMilan 
    ? `&focus.point.lat=${milanCenterLat}&focus.point.lon=${milanCenterLon}`
    : '';
  
  const url = `${ORS_BASE_URL}/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(normalizedAddress)}&boundary.country=IT&boundary.rect.min_lon=${LOMBARDY_BOUNDS.minLon}&boundary.rect.min_lat=${LOMBARDY_BOUNDS.minLat}&boundary.rect.max_lon=${LOMBARDY_BOUNDS.maxLon}&boundary.rect.max_lat=${LOMBARDY_BOUNDS.maxLat}${focusParams}&size=10`;
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Geocoding failed for "${address}": ${response.status}`);
    return null;
  }
  
  const data: GeocodingResult = await response.json();
  
  if (data.features && data.features.length > 0) {
    // Se prioritizziamo Milano, cerca prima risultati a Milano
    if (shouldPrioritizeMilan) {
      for (const feature of data.features) {
        const [lon, lat] = feature.geometry.coordinates;
        const label = feature.properties.label.toLowerCase();
        
        if (isInMilan(lon, lat) && label.includes("milan")) {
          console.log(`Found destination "${address}" at [${lon}, ${lat}] (Milan priority) - ${feature.properties.label}`);
          return [lon, lat];
        }
      }
      
      // Fallback: primo risultato dentro Milano
      for (const feature of data.features) {
        const [lon, lat] = feature.geometry.coordinates;
        
        if (isInMilan(lon, lat)) {
          console.log(`Found destination "${address}" at [${lon}, ${lat}] (in Milan bounds) - ${feature.properties.label}`);
          return [lon, lat];
        }
      }
    }
    
    // Per località specifiche o fallback, prendi il primo risultato in Lombardia
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
  const url = `${ORS_BASE_URL}/v2/directions/driving-car`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": apiKey,
    },
    body: JSON.stringify({
      coordinates: [start, end],
      radiuses: [2000, 5000], // Allow snapping to roads within 2km for start, 5km for airports
    }),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`Route calculation failed: ${response.status} - ${errorText}`);
    return null;
  }
  
  const responseText = await response.text();
  console.log(`Route API response: ${responseText.substring(0, 500)}`);
  
  let data: RouteResult;
  try {
    data = JSON.parse(responseText);
  } catch (e) {
    console.error(`Failed to parse route response: ${e}`);
    return null;
  }
  
  // Handle both GeoJSON (features) and JSON (routes) response formats
  let summary: { distance: number; duration: number } | undefined;
  
  if (data.routes && data.routes.length > 0) {
    // JSON format from POST request
    summary = data.routes[0].summary;
  } else if (data.features && data.features.length > 0) {
    // GeoJSON format from GET request
    summary = data.features[0].properties.summary;
  }
  
  if (summary) {
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
    
    // First check if it's a known airport with fixed coords
    let destCoords = getAirportCoords(destination);
    if (destCoords) {
      console.log(`Using fixed airport coordinates for "${destination}": [${destCoords}]`);
    } else {
      // Geocode destination (all Lombardy)
      console.log(`Geocoding destination: "${destination}"`);
      destCoords = await geocodeAddressLombardy(destination, OPENROUTE_API_KEY);
    }

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

    // Check for fixed airport price
    const fixedPrice = getAirportFixedPrice(destination);

    // Generate Google Maps link
    const mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords[1]},${pickupCoords[0]}&destination=${destCoords[1]},${destCoords[0]}`;

    console.log(`Route calculated: ${distanceKm}km, ${durationMin}min, ETA: ${etaMin}min${fixedPrice ? `, Fixed airport price: €${fixedPrice}` : ''}`);

    return new Response(
      JSON.stringify({
        success: true,
        distanceKm,
        durationMin,
        etaMin,
        mapsLink,
        pickupCoords: { lat: pickupCoords[1], lon: pickupCoords[0] },
        destCoords: { lat: destCoords[1], lon: destCoords[0] },
        fixedPrice: fixedPrice, // null if not an airport, price if it is
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
