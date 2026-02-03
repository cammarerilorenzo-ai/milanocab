import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RideNotificationRequest {
  customerEmail: string;
  pickup: string;
  destination: string;
  dateTime: string;
  estimatedPrice: number;
  estimatedKm: number;
  estimatedMin: number;
  mapsLink?: string;
  pickupCoords: { lat: number; lon: number };
  destCoords: { lat: number; lon: number };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL");
    if (!ADMIN_EMAIL) {
      throw new Error("ADMIN_EMAIL is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration is missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { 
      customerEmail,
      pickup, 
      destination, 
      dateTime, 
      estimatedPrice,
      estimatedKm,
      estimatedMin,
      mapsLink: providedMapsLink,
      pickupCoords,
      destCoords
    }: RideNotificationRequest = await req.json();

    // Validate required fields
    if (!customerEmail || !pickup || !destination || !dateTime || !pickupCoords || !destCoords) {
      throw new Error("Missing required fields");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(customerEmail)) {
      throw new Error("Invalid email format");
    }

    // Validate field lengths
    if (pickup.length > 200 || destination.length > 200 || customerEmail.length > 255) {
      throw new Error("Fields exceed maximum length");
    }

    // Use provided maps link or generate one
    const mapsLink = providedMapsLink || `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}`;

    // Save ride request to database
    const { data: rideRequest, error: dbError } = await supabase
      .from("ride_requests")
      .insert({
        customer_email: customerEmail,
        pickup,
        destination,
        pickup_lat: pickupCoords.lat,
        pickup_lon: pickupCoords.lon,
        dest_lat: destCoords.lat,
        dest_lon: destCoords.lon,
        date_time: dateTime,
        estimated_price: estimatedPrice,
        estimated_km: estimatedKm,
        estimated_min: estimatedMin,
        maps_link: mapsLink,
      })
      .select("confirmation_token")
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to save ride request");
    }

    // Generate confirmation link
    const baseUrl = Deno.env.get("SITE_URL") || "https://id-preview--4abd3d56-9cd2-44bd-8207-357fa3262bd8.lovable.app";
    const confirmationLink = `${baseUrl}/confirm-ride/${rideRequest.confirmation_token}`;

    // Format the email content for admin
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Nuova Richiesta Corsa</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <div style="background: linear-gradient(135deg, #3b82f6, #2563eb); padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🚗 Nuova Richiesta Corsa</h1>
            </div>
            <div style="padding: 24px;">
              <div style="margin-bottom: 20px; padding: 16px; background: #fef3c7; border-radius: 12px; border-left: 4px solid #f59e0b;">
                <p style="margin: 0 0 8px 0; color: #92400e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">✉️ Cliente</p>
                <p style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 500;">${escapeHtml(customerEmail)}</p>
              </div>
              <div style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">📍 Partenza</p>
                <p style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 500;">${escapeHtml(pickup)}</p>
              </div>
              <div style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 12px; border-left: 4px solid #22c55e;">
                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">🎯 Destinazione</p>
                <p style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 500;">${escapeHtml(destination)}</p>
              </div>
              <div style="margin-bottom: 20px; padding: 16px; background: #f8fafc; border-radius: 12px;">
                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">🗓 Data e Ora</p>
                <p style="margin: 0; color: #1e293b; font-size: 16px; font-weight: 500;">${escapeHtml(dateTime)}</p>
              </div>
              <div style="margin-bottom: 20px; padding: 16px; background: linear-gradient(135deg, #dbeafe, #e0f2fe); border-radius: 12px; text-align: center;">
                <p style="margin: 0 0 8px 0; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">💰 Prezzo Stimato</p>
                <p style="margin: 0; color: #1e293b; font-size: 28px; font-weight: 700;">€${estimatedPrice.toFixed(2)}</p>
                <p style="margin: 8px 0 0 0; color: #64748b; font-size: 14px;">~${estimatedKm} km • ~${estimatedMin} min</p>
              </div>
              <a href="${mapsLink}" target="_blank" style="display: block; text-align: center; background: #64748b; color: white; text-decoration: none; padding: 12px 24px; border-radius: 12px; font-weight: 600; font-size: 14px; margin-bottom: 12px;">
                🗺 Visualizza Percorso
              </a>
              <a href="${confirmationLink}" target="_blank" style="display: block; text-align: center; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; text-decoration: none; padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                ✅ Conferma e Invia Tempo di Attesa
              </a>
            </div>
            <div style="padding: 16px 24px; background: #f8fafc; text-align: center;">
              <p style="margin: 0; color: #94a3b8; font-size: 12px;">RideNow - Sistema di Prenotazione Corse</p>
            </div>
          </div>
        </body>
      </html>
    `;

    // Send email via Resend API
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "RideNow <onboarding@resend.dev>",
        to: [ADMIN_EMAIL],
        subject: `🚗 Nuova richiesta corsa - €${estimatedPrice.toFixed(2)}`,
        html: emailHtml,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      throw new Error(`Resend API error: ${JSON.stringify(errorData)}`);
    }

    const emailResult = await emailResponse.json();
    console.log("Ride notification email sent successfully:", emailResult);

    return new Response(JSON.stringify({ success: true, emailId: emailResult.id }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: unknown) {
    console.error("Error in send-ride-notification function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
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

serve(handler);
