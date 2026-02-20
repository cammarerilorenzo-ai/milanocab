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
    const body = await req.json();
    const { action, phone: adminPhone } = body;

    if (!adminPhone) {
      return new Response(
        JSON.stringify({ success: false, error: "Phone required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin
    const { data: isAdmin } = await supabase.rpc("is_admin", { check_phone: adminPhone });
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ success: false, error: "Non autorizzato" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── LIST ALL USERS WITH CREDITS ──
    if (action === "list_users_credits") {
      const { data: phones } = await supabase
        .from("authorized_phones")
        .select("id, name, phone, customer_group, referred_by");

      const { data: credits } = await supabase
        .from("user_credits")
        .select("phone, balance");

      const creditMap = new Map((credits || []).map((c: { phone: string; balance: number }) => [c.phone, c.balance]));

      const users = (phones || []).map((p: { id: string; name: string | null; phone: string; customer_group: string | null; referred_by: string | null }) => ({
        id: p.id,
        name: p.name,
        phone: p.phone,
        customer_group: p.customer_group,
        balance: creditMap.get(p.phone) ?? 0,
      }));

      return new Response(
        JSON.stringify({ success: true, users }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── GET BALANCE for a specific phone ──
    if (action === "get_balance") {
      const { targetPhone } = body;
      if (!targetPhone) {
        return new Response(
          JSON.stringify({ success: false, error: "targetPhone required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("phone", targetPhone)
        .maybeSingle();

      return new Response(
        JSON.stringify({ success: true, balance: data?.balance ?? 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── GET TRANSACTIONS for a specific phone ──
    if (action === "get_transactions") {
      const { targetPhone } = body;
      if (!targetPhone) {
        return new Response(
          JSON.stringify({ success: false, error: "targetPhone required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: transactions } = await supabase
        .from("credit_transactions")
        .select("id, amount, reason, created_at")
        .eq("phone", targetPhone)
        .order("created_at", { ascending: false })
        .limit(50);

      return new Response(
        JSON.stringify({ success: true, transactions: transactions || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── ADD CREDIT manually ──
    if (action === "add_credit") {
      const { targetPhone, amount, reason } = body;
      if (!targetPhone || amount === undefined || !reason) {
        return new Response(
          JSON.stringify({ success: false, error: "targetPhone, amount, reason required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const numAmount = Number(amount);
      if (isNaN(numAmount)) {
        return new Response(
          JSON.stringify({ success: false, error: "Amount must be a number" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Upsert credit row
      await supabase
        .from("user_credits")
        .upsert({ phone: targetPhone, balance: 0 }, { onConflict: "phone", ignoreDuplicates: true });

      // Get current balance
      const { data: current } = await supabase
        .from("user_credits")
        .select("balance")
        .eq("phone", targetPhone)
        .single();

      const newBalance = (current?.balance || 0) + numAmount;

      // Update balance
      await supabase
        .from("user_credits")
        .update({ balance: newBalance })
        .eq("phone", targetPhone);

      // Record transaction
      await supabase.from("credit_transactions").insert({
        phone: targetPhone,
        amount: numAmount,
        reason,
      });

      return new Response(
        JSON.stringify({ success: true, newBalance }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── UPDATE CUSTOMER GROUP ──
    if (action === "update_group") {
      const { targetPhone, customerGroup } = body;
      if (!targetPhone || !customerGroup) {
        return new Response(
          JSON.stringify({ success: false, error: "targetPhone and customerGroup required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const allowed = ["private", "business", "ambassador"];
      if (!allowed.includes(customerGroup)) {
        return new Response(
          JSON.stringify({ success: false, error: "Invalid customer group" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error } = await supabase
        .from("authorized_phones")
        .update({ customer_group: customerGroup })
        .eq("phone", targetPhone);

      if (error) {
        return new Response(
          JSON.stringify({ success: false, error: error.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in manage-credits:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
