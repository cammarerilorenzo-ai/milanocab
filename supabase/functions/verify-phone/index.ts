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
    const { phone } = await req.json();

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone number required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Normalize phone number - remove spaces and special chars
    let normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, "");
    
    // Handle different country prefixes
    if (normalizedPhone.startsWith("+")) {
      // Already has country code, leave as is
    } else if (normalizedPhone.startsWith("39") && normalizedPhone.length >= 11) {
      // Italian number starting with 39
      normalizedPhone = "+" + normalizedPhone;
    } else if (normalizedPhone.startsWith("55") && normalizedPhone.length >= 12) {
      // Brazilian number starting with 55
      normalizedPhone = "+" + normalizedPhone;
    } else {
      // Default to Italian prefix +39
      normalizedPhone = "+39" + normalizedPhone;
    }
    
    // Try to find the phone in database with multiple prefix attempts
    const phoneVariants = [normalizedPhone];
    
    // If no prefix was provided, also try with +55 (Brazil)
    if (!phone.startsWith("+") && !phone.startsWith("39") && !phone.startsWith("55")) {
      phoneVariants.push("+55" + phone.replace(/[\s\-\(\)\.]/g, ""));
    }

    console.log(`Verifying phone: ${normalizedPhone}`);

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if phone exists in authorized_phones table (try all variants)
    let data = null;
    let error = null;
    
    for (const variant of phoneVariants) {
      console.log(`Trying phone variant: ${variant}`);
      const result = await supabase
        .from("authorized_phones")
        .select("id, name, phone")
        .eq("phone", variant)
        .maybeSingle();
      
      if (result.error) {
        error = result.error;
        break;
      }
      
      if (result.data) {
        data = result.data;
        break;
      }
    }

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!data) {
      console.log("Phone not found in authorized list");
      return new Response(
        JSON.stringify({ success: false, error: "Numero non autorizzato" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate a simple session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    console.log(`Phone verified successfully for: ${data.name || normalizedPhone}`);

    return new Response(
      JSON.stringify({
        success: true,
        sessionToken,
        expiresAt,
        user: {
          id: data.id,
          name: data.name,
          phone: data.phone,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying phone:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
