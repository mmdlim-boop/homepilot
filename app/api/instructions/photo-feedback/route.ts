import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { completionId, approved, note } = await request.json();

    const { data: completion } = await supabase
      .from("chore_completions")
      .select("*, chores(title_en, household_id)")
      .eq("id", completionId)
      .single();

    if (!completion) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const householdId = (completion.chores as { household_id: string })?.household_id;

    // Find helper
    const { data: helper } = await supabase
      .from("profiles")
      .select("id")
      .eq("household_id", householdId)
      .eq("role", "helper")
      .single();

    if (helper) {
      const { data: sub } = await supabase
        .from("push_subscriptions")
        .select("subscription_json")
        .eq("user_id", helper.id)
        .single();

      if (sub?.subscription_json) {
        await sendPushNotification(sub.subscription_json, {
          title: approved ? "✅ Majikan setuju / Employer approved" : "🔄 Perlu diulang / Needs redo",
          body: note || (approved ? "Bagus! Kerja sudah diperiksa." : "Tolong buat semula."),
          url: "/helper",
          tag: "photo-feedback",
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
