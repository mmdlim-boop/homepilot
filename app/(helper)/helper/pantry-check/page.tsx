"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUIString, DEFAULT_PANTRY_ITEMS } from "@/lib/ui-strings";
import { getMonday, formatDate } from "@/lib/utils";

export default function PantryCheckPage() {
  const [lang, setLang] = useState("id");
  const [householdId, setHouseholdId] = useState("");
  const [userId, setUserId] = useState("");
  const [items, setItems] = useState(DEFAULT_PANTRY_ITEMS.map(name => ({ name, available: false })));
  const [freeText, setFreeText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase.from("profiles").select("household_id, language").eq("id", user.id).single();
      if (!profile?.household_id) return;
      setHouseholdId(profile.household_id);
      setLang(profile.language || "id");

      // Check if already submitted this week
      const weekStart = formatDate(getMonday());
      const { data: existing } = await supabase
        .from("pantry_checks")
        .select("id")
        .eq("household_id", profile.household_id)
        .eq("week_start_date", weekStart)
        .single();
      if (existing) setAlreadySubmitted(true);
    }
    load();
  }, []);

  function toggleItem(name: string) {
    setItems(prev => prev.map(i => i.name === name ? { ...i, available: !i.available } : i));
  }

  async function handleSubmit() {
    setSubmitting(true);
    const weekStart = formatDate(getMonday());
    await supabase.from("pantry_checks").insert({
      household_id: householdId,
      checked_by: userId,
      items_json: items,
      free_text_leftovers: freeText.trim(),
      week_start_date: weekStart,
    });
    setSubmitted(true);
    setSubmitting(false);
  }

  if (alreadySubmitted || submitted) {
    return (
      <div className="space-y-5">
        <h1 className="text-xl font-bold text-gray-900">{getUIString("pantryCheck", lang)}</h1>
        <div className="bg-green-50 rounded-2xl border border-green-200 p-8 text-center">
          <div className="text-5xl mb-4">✅</div>
          <p className="font-bold text-green-800 text-lg">Terima kasih!</p>
          <p className="text-green-600 text-sm mt-2">
            {alreadySubmitted ? "Pantry check sudah dihantar minggu ini." : "Pantry check sudah dihantar. Majikan akan merencanakan menu."}
          </p>
        </div>
      </div>
    );
  }

  const checkedCount = items.filter(i => i.available).length;

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{getUIString("pantryCheckTitle", lang)}</h1>
        <p className="text-gray-500 text-sm mt-1">{getUIString("pantryCheckSubtitle", lang)}</p>
      </div>

      {/* Progress */}
      <div className="bg-green-50 rounded-xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-green-700 font-medium">{checkedCount} items marked as available</span>
        <span className="text-green-500 text-sm">{items.length - checkedCount} items needed</span>
      </div>

      {/* Items list */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
        {items.map(item => (
          <button
            key={item.name}
            onClick={() => toggleItem(item.name)}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-gray-50 transition-colors"
          >
            <div className={`w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${item.available ? "bg-green-500 border-green-500" : "border-gray-300"}`}>
              {item.available && <span className="text-white text-sm font-bold">✓</span>}
            </div>
            <span className={`text-base ${item.available ? "text-gray-800 font-medium" : "text-gray-500"}`}>
              {item.name}
            </span>
            <span className="ml-auto text-sm">{item.available ? getUIString("yes", lang) : ""}</span>
          </button>
        ))}
      </div>

      {/* Free text */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {getUIString("otherLeftovers", lang)}
        </label>
        <textarea
          value={freeText}
          onChange={e => setFreeText(e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          placeholder={lang === "id" ? "Contoh: labu setengah, tahu, sayur kangkung..." : "e.g. half pumpkin, tofu, kangkong..."}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={submitting}
        className="w-full bg-green-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {submitting ? "Menghantar..." : getUIString("submit", lang) + " ✓"}
      </button>
    </div>
  );
}
