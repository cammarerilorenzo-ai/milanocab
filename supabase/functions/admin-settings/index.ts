import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, phone, vehicleType, isAvailable } = await req.json();

    // Verify admin access
    const { data: isAdmin } = await supabase.rpc("is_admin", { check_phone: phone });
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Accesso non autorizzato" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "get_settings") {
      // Get vehicle settings
      const { data: vehicles, error } = await supabase
        .from("vehicle_settings")
        .select("*")
        .order("vehicle_type");

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, vehicles }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "update_vehicle") {
      // Update vehicle availability
      const { error } = await supabase
        .from("vehicle_settings")
        .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
        .eq("vehicle_type", vehicleType);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: `${vehicleType} aggiornato` }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Azione non valida" }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: unknown) {
    console.error("Error in admin-settings:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
