// Edge function for route calculation
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ORS_BASE_URL = "https://api.openrouteservice.org";

// Fallback base location (driver's starting point)
const FALLBACK_BASE_LOCATION = "Via Manfredo Fanti 2, Milano, Italia";
const ETA_BUFFER_MINUTES = 3; // Buffer time to add to ETA

// Fixed airport prices
const AIRPORT_PRICES: Record<string, number> = {
  malpensa: 65,
  "orio al serio": 65,
  bergamo: 65, // Bergamo airport
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
      name?: string;
      street?: string;
      housenumber?: string;
      layer?: string; // "address", "street", "venue", "locality", etc.
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

// Extract street part from address (remove city/country suffixes)
function extractStreetPart(address: string): string {
  // Remove ", Milano", ", Italia", etc.
  return address.trim().replace(/,\s*(milano|milan|italia|lombardia|mi|it).*$/i, '').trim();
}

// Extract street name keywords from user input for matching
function extractStreetKeywords(address: string): string[] {
  const streetPart = extractStreetPart(address).toLowerCase();
  const cleaned = streetPart.replace(/\d+/g, '').trim();
  return cleaned.split(/\s+/).filter(w => w.length > 2 && !['via', 'viale', 'corso', 'piazza', 'piazzale', 'largo', 'vicolo', 'strada'].includes(w));
}

// Check if a geocoding result matches the searched street
function resultMatchesStreet(feature: GeocodingResult['features'][0], keywords: string[]): boolean {
  const label = feature.properties.label.toLowerCase();
  const name = (feature.properties.name || '').toLowerCase();
  const street = (feature.properties.street || '').toLowerCase();
  const layer = feature.properties.layer || '';
  
  const isStreetLevel = ['address', 'street', 'venue'].includes(layer);
  
  const matchCount = keywords.filter(kw => 
    label.includes(kw) || name.includes(kw) || street.includes(kw)
  ).length;
  
  return isStreetLevel && matchCount > 0;
}

// Common Milan street name corrections (joined words that should be separated)
const STREET_NAME_CORRECTIONS: Record<string, string> = {
  'montenero': 'Monte Nero',
  'montegrappa': 'Monte Grappa',
  'montenapoleone': 'Monte Napoleone',
  'monterosa': 'Monte Rosa',
  'monteceneri': 'Monte Ceneri',
  'montebianco': 'Monte Bianco',
  'montesanto': 'Monte Santo',
  'santagostino': "Sant'Agostino",
  'santambrogio': "Sant'Ambrogio",
  'santangelo': "Sant'Angelo",
  'portaromana': 'Porta Romana',
  'portavenezia': 'Porta Venezia',
  'portagenova': 'Porta Genova',
  'portanuova': 'Porta Nuova',
  'portagaribaldi': 'Porta Garibaldi',
  'portaticinese': 'Porta Ticinese',
  'portavigentina': 'Porta Vigentina',
  'portavolta': 'Porta Volta',
  'buonosaires': 'Buenos Aires',
  'buenosaires': 'Buenos Aires',
};

// Fix common street name misspellings/joined words
function fixStreetName(address: string): string {
  let fixed = address;
  const addressLower = address.toLowerCase();
  
  for (const [wrong, correct] of Object.entries(STREET_NAME_CORRECTIONS)) {
    if (addressLower.includes(wrong)) {
      const regex = new RegExp(wrong, 'gi');
      fixed = fixed.replace(regex, correct);
    }
  }
  
  return fixed;
}

// Text-based geocoding
async function geocodeText(
  searchText: string,
  apiKey: string,
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
  focusLat?: number,
  focusLon?: number
): Promise<GeocodingResult | null> {
  let url = `${ORS_BASE_URL}/geocode/search?api_key=${apiKey}&text=${encodeURIComponent(searchText)}&boundary.country=IT&boundary.rect.min_lon=${bounds.minLon}&boundary.rect.min_lat=${bounds.minLat}&boundary.rect.max_lon=${bounds.maxLon}&boundary.rect.max_lat=${bounds.maxLat}&size=10`;
  
  if (focusLat !== undefined && focusLon !== undefined) {
    url += `&focus.point.lat=${focusLat}&focus.point.lon=${focusLon}`;
  }
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Text geocoding failed: ${response.status}`);
    return null;
  }
  
  return await response.json();
}

// Pick best result from geocoding data
function pickBestResult(
  data: GeocodingResult,
  keywords: string[],
  boundsCheck: (lon: number, lat: number) => boolean,
  label: string
): [number, number] | null {
  if (!data.features || data.features.length === 0) return null;
  
  console.log(`${label}: ${data.features.length} results, keywords: [${keywords.join(', ')}]`);
  
  for (const f of data.features) {
    console.log(`  - [${f.geometry.coordinates}] layer=${f.properties.layer} name="${f.properties.name}" label="${f.properties.label}"`);
  }
  
  // Priority 1: street-level match with keyword match
  for (const feature of data.features) {
    const [lon, lat] = feature.geometry.coordinates;
    if (boundsCheck(lon, lat) && resultMatchesStreet(feature, keywords)) {
      console.log(`${label}: SELECTED street match at [${lon}, ${lat}] - ${feature.properties.label}`);
      return [lon, lat];
    }
  }
  
  // Priority 2: any address/street layer result
  for (const feature of data.features) {
    const [lon, lat] = feature.geometry.coordinates;
    const layer = feature.properties.layer || '';
    if (boundsCheck(lon, lat) && ['address', 'street', 'venue'].includes(layer)) {
      console.log(`${label}: SELECTED layer=${layer} at [${lon}, ${lat}] - ${feature.properties.label}`);
      return [lon, lat];
    }
  }
  
  return null;
}

// Geocode with retry: first try corrected name, then original
async function geocodeWithRetry(
  address: string,
  locality: string,
  apiKey: string,
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number },
  boundsCheck: (lon: number, lat: number) => boolean,
  logPrefix: string
): Promise<[number, number] | null> {
  const fixedAddress = fixStreetName(address);
  const keywords = extractStreetKeywords(fixedAddress);
  
  // Try with corrected name + locality
  const searchText1 = `${fixedAddress.trim()}, ${locality}, Italia`;
  console.log(`${logPrefix}: trying "${searchText1}"`);
  const data1 = await geocodeText(searchText1, apiKey, bounds, 45.4642, 9.1900);
  if (data1) {
    const result = pickBestResult(data1, keywords, boundsCheck, `${logPrefix} corrected`);
    if (result) return result;
  }
  
  // If the address was corrected, also try original
  if (fixedAddress !== address) {
    const originalKeywords = extractStreetKeywords(address);
    const searchText2 = `${address.trim()}, ${locality}, Italia`;
    console.log(`${logPrefix}: trying original "${searchText2}"`);
    const data2 = await geocodeText(searchText2, apiKey, bounds, 45.4642, 9.1900);
    if (data2) {
      const result = pickBestResult(data2, originalKeywords, boundsCheck, `${logPrefix} original`);
      if (result) return result;
    }
  }
  
  return null;
}

// Geocode an address to coordinates (restricted to Milan - for pickup)
async function geocodeAddressMilan(address: string, apiKey: string): Promise<[number, number] | null> {
  const result = await geocodeWithRetry(address, 'Milano', apiKey, MILAN_BOUNDS, isInMilan, 'Pickup');
  if (!result) {
    console.error(`No Milan street-level result for pickup "${address}".`);
  }
  return result;
}

// Check if destination contains a specific non-Milan location
function hasNonMilanLocation(address: string): boolean {
  const nonMilanLocations = ["malpensa", "orio", "bergamo", "linate", "aeroporto", "monza", "como", "brescia", "varese", "pavia", "lecco", "cremona", "mantova", "lodi", "sondrio", "rho", "sesto", "cinisello", "cologno", "segrate", "assago", "san donato", "corsico", "buccinasco", "rozzano", "opera", "bollate", "arese", "lainate", "pero"];
  const addressLower = address.toLowerCase();
  return nonMilanLocations.some(loc => addressLower.includes(loc));
}

// Geocode an address to coordinates (destination)
async function geocodeAddressLombardy(address: string, apiKey: string): Promise<[number, number] | null> {
  const isNonMilan = hasNonMilanLocation(address);
  const bounds = isNonMilan ? LOMBARDY_BOUNDS : MILAN_BOUNDS;
  const boundsCheck = isNonMilan ? isInLombardy : isInMilan;
  const locality = isNonMilan ? 'Lombardia' : 'Milano';
  
  const result = await geocodeWithRetry(address, locality, apiKey, bounds, boundsCheck, 'Dest');
  if (!result) {
    console.error(`No location found for destination "${address}".`);
  }
  return result;
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

    // Get admin GPS position from database, fallback to fixed address
    let baseCoords: [number, number] | null = null;
    
    try {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      
      // Fetch admin GPS position from app_settings
      const { data: latData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "admin_lat")
        .single();
      
      const { data: lonData } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "admin_lon")
        .single();
      
      if (latData?.value && lonData?.value) {
        const lat = parseFloat(latData.value);
        const lon = parseFloat(lonData.value);
        if (!isNaN(lat) && !isNaN(lon)) {
          baseCoords = [lon, lat]; // ORS uses [lon, lat]
          console.log(`Using admin GPS position: [${lon}, ${lat}]`);
        }
      }
    } catch (e) {
      console.error("Error fetching admin GPS position:", e);
    }
    
    // Fallback to geocoding fixed address
    if (!baseCoords) {
      console.log(`Geocoding fallback base location: "${FALLBACK_BASE_LOCATION}"`);
      baseCoords = await geocodeAddressMilan(FALLBACK_BASE_LOCATION, OPENROUTE_API_KEY);
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

    // Calculate the actual route from pickup to destination
    console.log(`Calculating route from pickup [${pickupCoords}] to destination [${destCoords}]`);
    const route = await calculateRoute(pickupCoords, destCoords, OPENROUTE_API_KEY);
    
    if (!route) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Impossibile calcolare il percorso. Riprova." 
        }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
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

Deno.serve(handler);
