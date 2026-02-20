import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
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

    // Normalize phone number
    let normalizedPhone = phone.replace(/[\s\-\(\)\.]/g, "");
    if (normalizedPhone.startsWith("+")) {
      // Already has country code
    } else if (normalizedPhone.startsWith("39") && normalizedPhone.length >= 11) {
      normalizedPhone = "+" + normalizedPhone;
    } else if (normalizedPhone.startsWith("55") && normalizedPhone.length >= 12) {
      normalizedPhone = "+" + normalizedPhone;
    } else {
      normalizedPhone = "+39" + normalizedPhone;
    }

    const phoneVariants = [normalizedPhone];
    if (!phone.startsWith("+") && !phone.startsWith("39") && !phone.startsWith("55")) {
      phoneVariants.push("+55" + phone.replace(/[\s\-\(\)\.]/g, ""));
    }

    console.log(`Verifying phone: ${normalizedPhone}`);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Find user in authorized_phones
    let userData = null;
    let findError = null;

    for (const variant of phoneVariants) {
      console.log(`Trying phone variant: ${variant}`);
      const result = await supabase
        .from("authorized_phones")
        .select("id, name, phone, customer_group, referred_by")
        .eq("phone", variant)
        .maybeSingle();

      if (result.error) {
        findError = result.error;
        break;
      }

      if (result.data) {
        userData = result.data;
        break;
      }
    }

    if (findError) {
      console.error("Database error:", findError);
      return new Response(
        JSON.stringify({ success: false, error: "Database error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!userData) {
      console.log("Phone not found in authorized list");
      return new Response(
        JSON.stringify({ success: false, error: "Numero non autorizzato" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if this is the FIRST login (no existing sessions)
    const { data: existingSessions } = await supabase
      .from("auth_sessions")
      .select("token")
      .eq("phone", userData.phone)
      .limit(1);

    const isFirstLogin = !existingSessions || existingSessions.length === 0;

    // Generate session token
    const sessionToken = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // Store session
    const { error: sessionError } = await supabase
      .from("auth_sessions")
      .insert({
        token: sessionToken,
        phone: userData.phone,
        expires_at: expiresAt,
      });

    if (sessionError) {
      console.error("Failed to store session:", sessionError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to create session" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Ensure user_credits row exists for this user
    await supabase
      .from("user_credits")
      .upsert({ phone: userData.phone, balance: 0 }, { onConflict: "phone", ignoreDuplicates: true });

    // === AMBASSADOR REFERRAL CREDIT LOGIC ===
    if (isFirstLogin && userData.referred_by) {
      console.log(`First login for ${userData.phone}, referred_by: ${userData.referred_by}`);

      // Find referrer
      const { data: referrer } = await supabase
        .from("authorized_phones")
        .select("id, name, phone, customer_group")
        .eq("id", userData.referred_by)
        .maybeSingle();

      if (referrer && referrer.customer_group === "ambassador") {
        console.log(`Referrer ${referrer.phone} is Ambassador — crediting €20`);

        // Ensure referrer has a user_credits row
        await supabase
          .from("user_credits")
          .upsert({ phone: referrer.phone, balance: 0 }, { onConflict: "phone", ignoreDuplicates: true });

        // Add transaction record
        await supabase.from("credit_transactions").insert({
          phone: referrer.phone,
          amount: 20,
          reason: `Referral: ${userData.name || userData.phone}`,
        });

        // Update referrer balance
        const { data: currentCredit } = await supabase
          .from("user_credits")
          .select("balance")
          .eq("phone", referrer.phone)
          .single();

        const newBalance = (currentCredit?.balance || 0) + 20;
        await supabase
          .from("user_credits")
          .update({ balance: newBalance })
          .eq("phone", referrer.phone);

        console.log(`Ambassador ${referrer.phone} new balance: €${newBalance}`);
      }
    }

    // Get current user's credit balance
    const { data: creditData } = await supabase
      .from("user_credits")
      .select("balance")
      .eq("phone", userData.phone)
      .maybeSingle();

    const creditBalance = creditData?.balance || 0;

    console.log(`Phone verified successfully for: ${userData.name || normalizedPhone}`);

    return new Response(
      JSON.stringify({
        success: true,
        sessionToken,
        expiresAt,
        user: {
          id: userData.id,
          name: userData.name,
          phone: userData.phone,
          creditBalance,
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
