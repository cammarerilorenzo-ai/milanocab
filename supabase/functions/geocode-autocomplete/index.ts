import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ORS_BASE_URL = "https://api.openrouteservice.org";

// Milan bounding box (approximate)
const MILAN_BOUNDS = {
  minLon: 9.04,
  minLat: 45.39,
  maxLon: 9.28,
  maxLat: 45.54,
};

// Milan center for focus point
const MILAN_CENTER = {
  lat: 45.4642,
  lon: 9.1900,
};

interface AutocompleteRequest {
  query: string;
}

interface GeocodingFeature {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    label: string;
    name: string;
    street?: string;
    housenumber?: string;
    locality?: string;
    region?: string;
  };
}

interface GeocodingResult {
  features: GeocodingFeature[];
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

    const { query }: AutocompleteRequest = await req.json();

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ success: true, suggestions: [] }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Build autocomplete URL with Milan boundaries
    const params = new URLSearchParams({
      api_key: OPENROUTE_API_KEY,
      text: query.trim(),
      "boundary.rect.min_lon": MILAN_BOUNDS.minLon.toString(),
      "boundary.rect.min_lat": MILAN_BOUNDS.minLat.toString(),
      "boundary.rect.max_lon": MILAN_BOUNDS.maxLon.toString(),
      "boundary.rect.max_lat": MILAN_BOUNDS.maxLat.toString(),
      "focus.point.lat": MILAN_CENTER.lat.toString(),
      "focus.point.lon": MILAN_CENTER.lon.toString(),
      "boundary.country": "IT",
      size: "5",
    });

    const url = `${ORS_BASE_URL}/geocode/autocomplete?${params.toString()}`;
    
    console.log(`Autocomplete query: "${query}"`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Autocomplete failed: ${response.status}`);
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data: GeocodingResult = await response.json();

    const suggestions = data.features.map((feature) => ({
      label: feature.properties.label,
      name: feature.properties.name,
      coordinates: {
        lat: feature.geometry.coordinates[1],
        lon: feature.geometry.coordinates[0],
      },
    }));

    console.log(`Found ${suggestions.length} suggestions for "${query}"`);

    return new Response(
      JSON.stringify({ success: true, suggestions }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in geocode-autocomplete function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage, suggestions: [] }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
