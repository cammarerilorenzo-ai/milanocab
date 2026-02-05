import { createClient } from "npm:@supabase/supabase-js@2";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Helper to send notification email
async function sendRegistrationNotification(
  phone: string,
  name: string | null,
  source: string,
  referrerName: string | null
) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");
  
  if (!RESEND_API_KEY || !ADMIN_EMAIL) {
    console.log("Email notification skipped: missing RESEND_API_KEY or ADMIN_EMAIL");
    return;
  }

  const resend = new Resend(RESEND_API_KEY);
  
  const sourceLabel = source === "qrCode" 
    ? "📱 QR Code" 
    : source === "invita" 
      ? "👥 Invito da utente" 
      : "🔗 Auto-registrazione";

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
      <h2 style="color: #c41e3a;">🚕 Nuovo Utente Registrato</h2>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; margin: 20px 0;">
        <p style="margin: 8px 0;"><strong>📞 Telefono:</strong> ${phone}</p>
        <p style="margin: 8px 0;"><strong>👤 Nome:</strong> ${name || "Non specificato"}</p>
        <p style="margin: 8px 0;"><strong>📍 Fonte:</strong> ${sourceLabel}</p>
        ${referrerName ? `<p style="margin: 8px 0;"><strong>🤝 Invitato da:</strong> ${referrerName}</p>` : ""}
      </div>
      
      <p style="color: #666; font-size: 12px;">
        Notifica automatica da Milano Cab
      </p>
    </div>
  `;

  try {
    await resend.emails.send({
      from: "Milano Cab <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: `🆕 Nuovo utente: ${name || phone}`,
      html: emailHtml,
    });
    console.log("Registration notification email sent successfully");
  } catch (error) {
    console.error("Failed to send notification email:", error);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { referralPhone, newPhone, newName, source } = await req.json();

    // QR code self-registration (no referral needed)
    if (source === "qrCode") {
      if (!newPhone) {
        return new Response(
          JSON.stringify({ success: false, error: "Numero di telefono richiesto" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const normalizedNew = newPhone.replace(/[\s\-\(\)\.]/g, "");
      console.log(`QR code self-registration: phone=${normalizedNew}`);

      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Check if phone already exists
      const { data: existingPhone } = await supabase
        .from("authorized_phones")
        .select("id")
        .eq("phone", normalizedNew)
        .maybeSingle();

      if (existingPhone) {
        console.log("Phone already registered");
        return new Response(
          JSON.stringify({ success: false, error: "Questo numero è già registrato" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Insert new phone without referral (QR code registration)
      const { error: insertError } = await supabase
        .from("authorized_phones")
        .insert({
          phone: normalizedNew,
          name: newName || null,
          referred_by: null, // No referrer for QR code registrations
        });

      if (insertError) {
        console.error("Error inserting new phone:", insertError);
        return new Response(
          JSON.stringify({ success: false, error: "Errore durante la registrazione" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Successfully registered ${normalizedNew} via QR code`);

      // Send notification email
      await sendRegistrationNotification(normalizedNew, newName || null, "qrCode", null);

      return new Response(
        JSON.stringify({
          success: true,
          message: "Registrazione completata con successo",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // User referral registration
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
        referred_by: referralData.id,
      });

    if (insertError) {
      console.error("Error inserting new phone:", insertError);
      return new Response(
        JSON.stringify({ success: false, error: "Errore durante la registrazione" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully registered ${normalizedNew} with referral from ${referralData.name || normalizedReferral}`);

    // Send notification email
    await sendRegistrationNotification(normalizedNew, newName || null, "invita", referralData.name || normalizedReferral);

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
