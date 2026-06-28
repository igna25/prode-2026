import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const from = new Date();
  const to = new Date(Date.now() + 30 * 60 * 1000);

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "SCHEDULED")
    .gte("match_datetime", from.toISOString())
    .lte("match_datetime", to.toISOString());

  if (error) return Response.json({ error: error.message }, { status: 400 });

  const reminders = [];
  for (const match of matches ?? []) {
    const { data: participants } = await supabase
      .from("participants")
      .select("*, predictions!left(id)")
      .eq("predictions.match_id", match.id);

    reminders.push({
      match_id: match.id,
      message: `Faltan 30 min para ${match.team_home} vs ${match.team_away}`,
      recipients: (participants ?? []).filter((participant) => participant.push_subscription)
        .length
    });
  }

  return Response.json({
    ok: true,
    reminders,
    note: "Conectar un proveedor Web Push para enviar las suscripciones listadas."
  });
});
