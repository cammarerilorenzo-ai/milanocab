import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface RideNotificationRequest {
  pickup: string;
  destination: string;
  dateTime: string;
  estimatedPrice: number;
  estimatedKm: number;
  estimatedMin: number;
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

    const { 
      pickup, 
      destination, 
      dateTime, 
      estimatedPrice,
      estimatedKm,
      estimatedMin 
    }: RideNotificationRequest = await req.json();

    // Validate required fields
    if (!pickup || !destination || !dateTime) {
      throw new Error("Missing required fields: pickup, destination, or dateTime");
    }

    // Validate field lengths
    if (pickup.length > 200 || destination.length > 200) {
      throw new Error("Address fields exceed maximum length");
    }

    // Generate Google Maps directions link
    const mapsLink = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(pickup)}&destination=${encodeURIComponent(destination)}`;

    // Format the email content
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
              <a href="${mapsLink}" target="_blank" style="display: block; text-align: center; background: #3b82f6; color: white; text-decoration: none; padding: 16px 24px; border-radius: 12px; font-weight: 600; font-size: 16px;">
                🗺 Apri Percorso su Maps
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
