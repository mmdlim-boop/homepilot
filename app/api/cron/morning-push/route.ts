import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushNotification } from "@/lib/push";
import { getCachedTranslation } from "@/lib/translations";

// Vercel cron: runs every day at 6:25am Singapore time (UTC+8 = 22:25 UTC previous day)
// Set in vercel.json: "crons": [{"path": "/api/cron/morning-push", "schedule": "25 22 * * *"}]

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Get Singapore day of week
    const now = new Date();
    const sgDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Singapore" }));
    const dayNum = sgDate.getDay();
    const todayStr = sgDate.toISOString().split("T")[0];

    // Get all active households with helpers
    const { data: helpers } = await supabase
      .from("profiles")
      .select("id, household_id, language")
      .eq("role", "helper");

    if (!helpers || helpers.length === 0) {
      return NextResponse.json({ message: "No helpers found" });
    }

    let notificationsSent = 0;

    for (const helper of helpers) {
      // Get helper's push subscription
      const { data: sub } = await supabase
        .from("push_subscriptions")
        .select("subscription_json")
        .eq("user_id", helper.id)
        .single();

      if (!sub?.subscription_json) continue;

      // Count today's chores
      const { data: chores } = await supabase
        .from("chores")
        .select("id, title_en")
        .eq("household_id", helper.household_id)
        .eq("is_active", true)
        .contains("days_of_week", [dayNum]);

      const choreCount = chores?.length || 0;

      // Get household's meal planning day
      const { data: household } = await supabase
        .from("households")
        .select("meal_plan_day")
        .eq("id", helper.household_id)
        .single();

      const isMealPlanDay = household?.meal_plan_day === dayNum;

      // Translate notification
      const lang = helper.language || "id";
      const baseTitle = `Selamat pagi! ${choreCount} tugas hari ini 🌅`;
      const baseBody = isMealPlanDay
        ? "Jangan lupa semak dapur hari ini untuk perancangan menu minggu depan!"
        : `Ketuk untuk lihat tugas hari ini.`;

      const [title, body] = await Promise.all([
        lang === "id" ? Promise.resolve(baseTitle) : getCachedTranslation(baseTitle, lang),
        lang === "id" ? Promise.resolve(baseBody) : getCachedTranslation(baseBody, lang),
      ]);

      await sendPushNotification(sub.subscription_json, {
        title,
        body,
        url: "/helper",
        tag: "morning-tasks",
      });
      notificationsSent++;

      // Also send pantry check notification if it's meal plan day
      if (isMealPlanDay) {
        const pantryTitle = lang === "id" ? "🥫 Cek Dapur" : "🥫 Pantry Check";
        const pantryBody = lang === "id"
          ? "Tolong semak bahan apa yang tinggal di dapur untuk rancangan menu."
          : "Please check what's left in the pantry for meal planning.";

        setTimeout(async () => {
          await sendPushNotification(sub.subscription_json, {
            title: pantryTitle,
            body: pantryBody,
            url: "/helper/pantry-check",
            tag: "pantry-check",
          });
        }, 2000);
      }
    }

    return NextResponse.json({ success: true, notificationsSent });
  } catch (error) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
