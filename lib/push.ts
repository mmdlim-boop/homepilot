import webpush from "web-push";

export async function sendPushNotification(
  subscription: webpush.PushSubscription,
  payload: {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    tag?: string;
  }
) {
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT || "mailto:admin@homepilot.app",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
    process.env.VAPID_PRIVATE_KEY!
  );
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return { success: true };
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    console.error("Push notification error:", err);
    return { success: false, error: err.message };
  }
}
