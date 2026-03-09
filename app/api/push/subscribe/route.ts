import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { subscription } = await request.json();
    if (!subscription) return NextResponse.json({ error: "No subscription" }, { status: 400 });

    await supabase.from("push_subscriptions").upsert({
      user_id: user.id,
      subscription_json: subscription,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to save subscription" }, { status: 500 });
  }
}
