import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referralPhone, newPhone, newName } = await req.json();

    if (!referralPhone || !newPhone) {
      return new Response(
        JSON.stringify({ success: false, error: "Entrambi i numeri sono richiesti" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone numbers - remove spaces and special chars
    const normalizedReferral = referralPhone.replace(/[\s\-\(\)\.]/g, "");
    const normalizedNew = newPhone.replace(/[\s\-\(\)\.]/g, "");

    console.log(`Referral registration: referral=${normalizedReferral}, new=${normalizedNew}`);

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if referral phone exists
    const { data: referralData, error: referralError } = await supabase
      .from("authorized_phones")
      .select("id, name")
      .eq("phone", normalizedReferral)
      .maybeSingle();

    if (referralError) {
      console.error("Database error checking referral:", referralError);
      return new Response(
        JSON.stringify({ success: false, error: "Errore database" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!referralData) {
      console.log("Referral phone not found");
      return new Response(
        JSON.stringify({ success: false, error: "Numero referral non trovato" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if new phone already exists
    const { data: existingPhone } = await supabase
      .from("authorized_phones")
      .select("id")
      .eq("phone", normalizedNew)
      .maybeSingle();

    if (existingPhone) {
      console.log("New phone already registered");
      return new Response(
        JSON.stringify({ success: false, error: "Questo numero è già registrato" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Insert new phone with referral info
    const { error: insertError } = await supabase
      .from("authorized_phones")
      .insert({
        phone: normalizedNew,
        name: newName || null,
      });

    if (insertError) {
      console.error("Error inserting new phone:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Errore durante la registrazione" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully registered ${normalizedNew} with referral from ${referralData.name || normalizedReferral}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Registrazione completata con successo",
        referredBy: referralData.name || normalizedReferral,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in referral registration:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Errore interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
