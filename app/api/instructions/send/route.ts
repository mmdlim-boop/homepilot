import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getCachedTranslation } from "@/lib/translations";
import { sendPushNotification } from "@/lib/push";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { householdId, messageEn, youtubeUrl, language } = await request.json();

    // Translate the message
    const messageTranslated = await getCachedTranslation(messageEn, language || "id");

    // Save instruction
    const { data: instruction } = await supabase.from("instructions").insert({
      household_id: householdId,
      sent_by: user.id,
      message_en: messageEn,
      message_translated: messageTranslated,
      language: language || "id",
      youtube_url: youtubeUrl || null,
    }).select().single();

    // Find helper's push subscription
    const { data: helperProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("household_id", householdId)
      .eq("role", "helper")
      .single();

    if (helperProfile) {
      const { data: sub } = await supabase
        .from("push_subscriptions")
        .select("subscription_json")
        .eq("user_id", helperProfile.id)
        .single();

      if (sub?.subscription_json) {
        await sendPushNotification(sub.subscription_json, {
          title: "📝 Petunjuk Baru / New Instruction",
          body: messageTranslated.substring(0, 100) + (messageTranslated.length > 100 ? "..." : ""),
          url: "/helper/instructions",
          tag: "instruction",
        });
      }
    }

    return NextResponse.json({ success: true, instruction });
  } catch (error) {
    console.error("Error sending instruction:", error);
    return NextResponse.json({ error: "Failed to send instruction" }, { status: 500 });
  }
}
