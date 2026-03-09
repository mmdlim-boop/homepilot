"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGE_OPTIONS } from "@/lib/utils";

interface Instruction {
  id: string;
  message_en: string;
  message_translated: string | null;
  language: string;
  youtube_url: string | null;
  sent_at: string;
  acknowledged_at: string | null;
}

export default function InstructionsPage() {
  const [instructions, setInstructions] = useState<Instruction[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [helperLanguage, setHelperLanguage] = useState("id");
  const [householdId, setHouseholdId] = useState("");
  const supabase = createClient();

  useEffect(() => {
    loadData();
    // Real-time subscription
    const sub = supabase
      .channel("instructions")
      .on("postgres_changes", { event: "*", schema: "public", table: "instructions" }, () => loadData())
      .subscribe();
    return () => { sub.unsubscribe(); };
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
    if (!profile?.household_id) return;
    setHouseholdId(profile.household_id);

    // Get helper's language
    const { data: helper } = await supabase
      .from("profiles")
      .select("language")
      .eq("household_id", profile.household_id)
      .eq("role", "helper")
      .single();
    if (helper?.language) setHelperLanguage(helper.language);

    const { data } = await supabase
      .from("instructions")
      .select("*")
      .eq("household_id", profile.household_id)
      .eq("is_active", true)
      .order("sent_at", { ascending: false })
      .limit(20);
    setInstructions(data || []);
    setLoading(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);

    const response = await fetch("/api/instructions/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        householdId,
        messageEn: message.trim(),
        youtubeUrl: youtubeUrl.trim() || null,
        language: helperLanguage,
      }),
    });

    if (response.ok) {
      setMessage("");
      setYoutubeUrl("");
      setSent(true);
      setTimeout(() => setSent(false), 3000);
      loadData();
    }
    setSending(false);
  }

  const langLabel = LANGUAGE_OPTIONS.find(l => l.value === helperLanguage)?.label || "Bahasa";

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Send Instruction</h1>

      {/* Send form */}
      <form onSubmit={handleSend} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Message (in English — will be translated to {langLabel} for helper)
          </label>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            placeholder="e.g. Please clean under the sofa cushions today. Pay special attention to the corners."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tutorial video link (optional)
          </label>
          <input
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="https://youtube.com/watch?v=..."
          />
          <p className="text-xs text-gray-400 mt-1">Helper will see a video button with the instruction</p>
        </div>

        {sent && (
          <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-xl">
            ✓ Instruction sent and translated to {langLabel}
          </div>
        )}

        <button
          type="submit"
          disabled={sending || !message.trim()}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {sending ? "Translating & Sending..." : "📤 Send to Helper"}
        </button>
      </form>

      {/* Past instructions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Sent Instructions</h2>
        {loading ? (
          <div className="text-gray-400 text-center py-8">Loading...</div>
        ) : instructions.length === 0 ? (
          <div className="text-gray-400 text-center py-8 bg-white rounded-2xl border border-gray-100">No instructions sent yet</div>
        ) : (
          <div className="space-y-3">
            {instructions.map(instr => (
              <div key={instr.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-gray-800 flex-1">{instr.message_en}</p>
                  <span className={`text-xs px-2 py-1 rounded-full shrink-0 ${instr.acknowledged_at ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600"}`}>
                    {instr.acknowledged_at ? "Seen ✓" : "Unread"}
                  </span>
                </div>
                {instr.message_translated && instr.message_translated !== instr.message_en && (
                  <p className="text-xs text-gray-400 mt-2 italic border-t border-gray-50 pt-2">
                    {langLabel}: {instr.message_translated}
                  </p>
                )}
                {instr.youtube_url && (
                  <a href={instr.youtube_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-red-500 mt-2">
                    📹 Video attached
                  </a>
                )}
                <p className="text-xs text-gray-300 mt-2">
                  {new Date(instr.sent_at).toLocaleString("en-SG")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
