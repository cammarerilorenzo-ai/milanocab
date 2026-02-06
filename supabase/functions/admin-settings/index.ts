import { createClient } from "npm:@supabase/supabase-js@2";

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

    const { action, phone, vehicleType, isAvailable, displayName, description, imageBase64, priceMultiplier, basePrice, settingKey, settingValue } = await req.json();

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

      // Get service status
      const { data: serviceStatus } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "service_enabled")
        .single();

      return new Response(
        JSON.stringify({ 
          success: true, 
          vehicles,
          serviceEnabled: serviceStatus?.value === "true"
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "update_app_setting") {
      if (!settingKey || settingValue === undefined) {
        return new Response(
          JSON.stringify({ success: false, error: "Parametri mancanti" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const { error } = await supabase
        .from("app_settings")
        .update({ value: settingValue, updated_at: new Date().toISOString() })
        .eq("key", settingKey);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: `Impostazione ${settingKey} aggiornata` }),
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

    if (action === "add_vehicle") {
      // Validate required fields
      if (!vehicleType || !displayName || !description) {
        return new Response(
          JSON.stringify({ success: false, error: "Campi obbligatori mancanti" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      let imageUrl = null;

      // Upload image if provided
      if (imageBase64) {
        const base64Data = imageBase64.split(",")[1] || imageBase64;
        const imageBuffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
        const fileName = `${vehicleType}-${Date.now()}.png`;

        const { error: uploadError } = await supabase.storage
          .from("vehicle-images")
          .upload(fileName, imageBuffer, {
            contentType: "image/png",
            upsert: true
          });

        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error("Errore nel caricamento dell'immagine");
        }

        const { data: urlData } = supabase.storage
          .from("vehicle-images")
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      // Insert new vehicle
      const { data: newVehicle, error } = await supabase
        .from("vehicle_settings")
        .insert({
          vehicle_type: vehicleType,
          display_name: displayName,
          description: description,
          image_url: imageUrl,
          price_multiplier: priceMultiplier || 1.0,
          is_available: true
        })
        .select()
        .single();

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, vehicle: newVehicle }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "update_pricing") {
      // Update price multiplier and base price for a vehicle
      if (!vehicleType) {
        return new Response(
          JSON.stringify({ success: false, error: "Campi obbligatori mancanti" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const updateData: { updated_at: string; price_multiplier?: number; base_price?: number } = {
        updated_at: new Date().toISOString()
      };

      if (priceMultiplier !== undefined) updateData.price_multiplier = priceMultiplier;
      if (basePrice !== undefined) updateData.base_price = basePrice;

      const { error } = await supabase
        .from("vehicle_settings")
        .update(updateData)
        .eq("vehicle_type", vehicleType);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: `Prezzi di ${vehicleType} aggiornati` }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "delete_vehicle") {
      // Delete vehicle image from storage first
      const { data: vehicle } = await supabase
        .from("vehicle_settings")
        .select("image_url")
        .eq("vehicle_type", vehicleType)
        .single();

      if (vehicle?.image_url) {
        const fileName = vehicle.image_url.split("/").pop();
        if (fileName) {
          await supabase.storage.from("vehicle-images").remove([fileName]);
        }
      }

      const { error } = await supabase
        .from("vehicle_settings")
        .delete()
        .eq("vehicle_type", vehicleType);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: `${vehicleType} eliminato` }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (action === "update_group_pricing") {
      const { 
        customerGroup, 
        base_price, 
        price_per_km, 
        price_per_min, 
        discount_short, 
        discount_long, 
        night_surcharge, 
        airport_malpensa, 
        airport_orio 
      } = await req.json().catch(() => ({}));

      if (!customerGroup) {
        return new Response(
          JSON.stringify({ success: false, error: "Gruppo cliente mancante" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (base_price !== undefined) updateData.base_price = base_price;
      if (price_per_km !== undefined) updateData.price_per_km = price_per_km;
      if (price_per_min !== undefined) updateData.price_per_min = price_per_min;
      if (discount_short !== undefined) updateData.discount_short = discount_short;
      if (discount_long !== undefined) updateData.discount_long = discount_long;
      if (night_surcharge !== undefined) updateData.night_surcharge = night_surcharge;
      if (airport_malpensa !== undefined) updateData.airport_malpensa = airport_malpensa;
      if (airport_orio !== undefined) updateData.airport_orio = airport_orio;

      const { error } = await supabase
        .from("group_pricing")
        .update(updateData)
        .eq("customer_group", customerGroup);

      if (error) throw error;

      return new Response(
        JSON.stringify({ success: true, message: `Tariffe ${customerGroup} aggiornate` }),
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

Deno.serve(handler);
