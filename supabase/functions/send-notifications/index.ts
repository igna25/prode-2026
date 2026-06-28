import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import webPush from "https://esm.sh/web-push@3.6.7";

const VAPID_PUBLIC_KEY = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@prode2026.app";

webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

Deno.serve(async () => {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const from = new Date();
  const to = new Date(Date.now() + 30 * 60 * 1000);

  const { data: matches, error: matchError } = await supabase
    .from("matches")
    .select("*")
    .eq("status", "SCHEDULED")
    .gte("match_datetime", from.toISOString())
    .lte("match_datetime", to.toISOString());

  if (matchError) return Response.json({ error: matchError.message }, { status: 400 });
  if (!matches?.length) return Response.json({ ok: true, sent: 0, matches: 0 });

  let totalSent = 0;
  let totalFailed = 0;

  for (const match of matches) {
    const { data: participants } = await supabase
      .from("participants")
      .select("id, push_subscription")
      .not("push_subscription", "is", null);

    if (!participants?.length) continue;

    const payload = JSON.stringify({
      title: "Prode Mundialista 2026",
      body: `Faltan 30 min para ${match.team_home} vs ${match.team_away} revisa tu predicción!`,
      icon: "/icons/icon.svg",
      badge: "/icons/icon.svg",
      data: { url: "/" }
    });

    for (const participant of participants) {
      const subscription = participant.push_subscription as unknown as webPush.PushSubscription;
      if (!subscription?.endpoint) continue;

      try {
        await webPush.sendNotification(subscription, payload);
        totalSent++;
      } catch (err) {
        totalFailed++;
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase
            .from("participants")
            .update({ push_subscription: null })
            .eq("id", participant.id);
        }
      }
    }
  }

  return Response.json({
    ok: true,
    matches: matches.length,
    sent: totalSent,
    failed: totalFailed
  });
});
