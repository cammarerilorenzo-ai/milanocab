import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ORS_BASE_URL = "https://api.openrouteservice.org";

interface ConfirmRideRequest {
  token: string;
  adminLat: number;
  adminLon: number;
}

interface RouteResult {
  features: Array<{
    properties: {
      summary: {
        distance: number;
        duration: number;
      };
    };
  }>;
}

// Calculate route between two coordinate pairs
async function calculateRoute(
  startLon: number,
  startLat: number,
  endLon: number,
  endLat: number,
  apiKey: string
): Promise<{ distanceKm: number; durationMin: number } | null> {
  const url = `${ORS_BASE_URL}/v2/directions/driving-car?api_key=${apiKey}&start=${startLon},${startLat}&end=${endLon},${endLat}`;
  
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Route calculation failed: ${response.status}`);
    return null;
  }
  
  const data: RouteResult = await response.json();
  
  if (data.features && data.features.length > 0) {
    const summary = data.features[0].properties.summary;
    return {
      distanceKm: Math.round(summary.distance / 100) / 10,
      durationMin: Math.round(summary.duration / 60),
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

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { token, adminLat, adminLon }: ConfirmRideRequest = await req.json();

    if (!token || typeof adminLat !== "number" || typeof adminLon !== "number") {
      throw new Error("Missing required fields: token, adminLat, adminLon");
    }

    // Validate coordinates are reasonable
    if (adminLat < -90 || adminLat > 90 || adminLon < -180 || adminLon > 180) {
      throw new Error("Invalid coordinates");
    }

    // Get ride request from database
    const { data: rideRequest, error: fetchError } = await supabase
      .from("ride_requests")
      .select("*")
      .eq("confirmation_token", token)
      .eq("status", "pending")
      .single();

    if (fetchError || !rideRequest) {
      console.error("Ride request not found:", fetchError);
      return new Response(
        JSON.stringify({ success: false, error: "Richiesta non trovata o già confermata" }),
        { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Calculate route from admin position to pickup
    console.log(`Calculating ETA from [${adminLon}, ${adminLat}] to [${rideRequest.pickup_lon}, ${rideRequest.pickup_lat}]`);
    const route = await calculateRoute(
      adminLon,
      adminLat,
      rideRequest.pickup_lon,
      rideRequest.pickup_lat,
      OPENROUTE_API_KEY
    );

    if (!route) {
      throw new Error("Impossibile calcolare il tempo di arrivo");
    }

    console.log(`ETA calculated: ${route.durationMin} min, ${route.distanceKm} km`);

    // Update ride request in database
    const { error: updateError } = await supabase
      .from("ride_requests")
      .update({
        status: "confirmed",
        admin_lat: adminLat,
        admin_lon: adminLon,
        eta_min: route.durationMin,
        confirmed_at: new Date().toISOString(),
      })
      .eq("confirmation_token", token);

    if (updateError) {
      console.error("Update error:", updateError);
      throw new Error("Failed to update ride request");
    }

    console.log("Ride confirmed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        etaMin: route.durationMin,
        distanceKm: route.distanceKm,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in confirm-ride function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

// Helper function to escape HTML to prevent XSS
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

Deno.serve(handler);
