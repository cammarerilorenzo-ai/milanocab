 import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
 
 const corsHeaders = {
   "Access-Control-Allow-Origin": "*",
   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
 };
 
 serve(async (req) => {
   if (req.method === "OPTIONS") {
     return new Response(null, { headers: corsHeaders });
   }
 
   try {
     const { lat, lon } = await req.json();
 
     if (!lat || !lon) {
       return new Response(
         JSON.stringify({ success: false, error: "Coordinate mancanti" }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
       );
     }
 
    const ORS_API_KEY = Deno.env.get("OPENROUTE_API_KEY");
     if (!ORS_API_KEY) {
      throw new Error("OPENROUTE_API_KEY not configured");
     }
 
     // Use OpenRouteService reverse geocoding for better accuracy
     const response = await fetch(
       `https://api.openrouteservice.org/geocode/reverse?api_key=${ORS_API_KEY}&point.lon=${lon}&point.lat=${lat}&boundary.country=IT&layers=address&size=1`,
       {
         headers: {
           "Accept": "application/json, application/geo+json",
         },
       }
     );
 
     if (!response.ok) {
       throw new Error(`Geocoding failed: ${response.status}`);
     }
 
     const data = await response.json();
 
     if (!data.features || data.features.length === 0) {
       return new Response(
         JSON.stringify({ success: false, error: "Indirizzo non trovato" }),
         { headers: { ...corsHeaders, "Content-Type": "application/json" } }
       );
     }
 
     const feature = data.features[0];
     const props = feature.properties;
 
     // Build precise address
     let address = "";
     
     // Street + house number
     if (props.street) {
       address = props.housenumber 
         ? `${props.street} ${props.housenumber}` 
         : props.street;
     } else if (props.name) {
       address = props.name;
     }
 
     // Add locality
     const locality = props.locality || props.localadmin || props.city || props.county;
     if (locality && address) {
       address = `${address}, ${locality}`;
     } else if (locality) {
       address = locality;
     }
 
     // Fallback to label
     if (!address && props.label) {
       address = props.label;
     }
 
     console.log("Reverse geocode result:", { lat, lon, address, props });
 
     return new Response(
       JSON.stringify({ 
         success: true, 
         address,
         confidence: props.confidence || 0,
         accuracy: props.accuracy || "unknown"
       }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" } }
     );
 
   } catch (error) {
     console.error("Reverse geocode error:", error);
    const errorMessage = error instanceof Error ? error.message : "Errore sconosciuto";
     return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
       { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
     );
   }
 });