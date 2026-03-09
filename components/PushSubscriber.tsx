"use client";
import { useEffect, useState } from "react";

export default function PushSubscriber() {
  const [status, setStatus] = useState<"idle" | "prompted" | "subscribed" | "denied">("idle");

  useEffect(() => {
    if ("serviceWorker" in navigator && "PushManager" in window) {
      checkSubscription();
    }
  }, []);

  async function checkSubscription() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      setStatus("subscribed");
    } else {
      setStatus("prompted");
    }
  }

  async function subscribe() {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
      });

      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscription: sub }),
      });

      setStatus("subscribed");
    } catch (err) {
      console.error("Push subscription failed:", err);
      setStatus("denied");
    }
  }

  if (status === "prompted") {
    return (
      <div className="fixed bottom-20 left-4 right-4 bg-green-600 text-white rounded-2xl p-4 shadow-xl z-50 max-w-sm mx-auto">
        <p className="font-semibold text-sm mb-1">Enable notifications 🔔</p>
        <p className="text-green-100 text-xs mb-3">Get notified about your daily tasks</p>
        <div className="flex gap-2">
          <button onClick={subscribe} className="flex-1 bg-white text-green-600 py-2 rounded-xl font-semibold text-sm">
            Enable
          </button>
          <button onClick={() => setStatus("denied")} className="text-green-200 text-sm px-3">
            Later
          </button>
        </div>
      </div>
    );
  }

  return null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}
