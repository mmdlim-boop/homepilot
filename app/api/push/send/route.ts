import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/push";

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, url, tag } = await request.json();

    const supabase = await createServiceClient();
    const { data: sub } = await supabase
      .from("push_subscriptions")
      .select("subscription_json")
      .eq("user_id", userId)
      .single();

    if (!sub?.subscription_json) {
      return NextResponse.json({ error: "No subscription found" }, { status: 404 });
    }

    const result = await sendPushNotification(sub.subscription_json, {
      title,
      body,
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      url: url || "/helper",
      tag: tag || "homepilot",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to send push" }, { status: 500 });
  }
}
