"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DAY_NAMES_SHORT } from "@/lib/utils";

interface Chore {
  id: string;
  title_en: string;
  time_slot: string | null;
  time_label: string | null;
  days_of_week: number[];
  is_monthly: boolean;
  youtube_url: string | null;
  requires_photo: boolean;
  sort_order: number;
  is_active: boolean;
}

export default function ChoresPage() {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);
  const [householdId, setHouseholdId] = useState<string>("");
  const supabase = createClient();

  useEffect(() => {
    loadChores();
  }, []);

  async function loadChores() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
    if (!profile?.household_id) return;
    setHouseholdId(profile.household_id);

    const { data } = await supabase
      .from("chores")
      .select("*")
      .eq("household_id", profile.household_id)
      .eq("is_active", true)
      .order("sort_order");
    setChores(data || []);
    setLoading(false);
  }

  async function toggleChore(id: string, field: "requires_photo" | "is_active", value: boolean) {
    await supabase.from("chores").update({ [field]: value }).eq("id", id);
    setChores(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
  }

  const grouped: Record<string, Chore[]> = {};
  chores.forEach(c => {
    const label = c.time_label || "General";
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(c);
  });

  if (loading) return <div className="flex justify-center items-center h-64"><div className="text-gray-400">Loading chores...</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Chore Schedule</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors"
        >
          + Add Chore
        </button>
      </div>

      {Object.entries(grouped).map(([label, groupChores]) => (
        <div key={label}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">{label}</h2>
          <div className="space-y-2">
            {groupChores.map(chore => (
              <div key={chore.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-gray-800 text-sm">{chore.title_en}</span>
                      {chore.is_monthly && (
                        <span className="text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full">Monthly</span>
                      )}
                      {chore.youtube_url && (
                        <span className="text-xs bg-red-100 text-red-500 px-2 py-0.5 rounded-full">📹 Video</span>
                      )}
                    </div>
                    {chore.time_slot && (
                      <span className="text-xs text-gray-400">{chore.time_slot}</span>
                    )}
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {DAY_NAMES_SHORT.map((day, i) => (
                        <span
                          key={i}
                          className={`text-xs px-1.5 py-0.5 rounded ${
                            chore.days_of_week.includes(i)
                              ? "bg-green-100 text-green-700 font-medium"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {day}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={() => setEditingChore(chore)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Edit
                    </button>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <span className="text-xs text-gray-500">📸</span>
                      <div
                        onClick={() => toggleChore(chore.id, "requires_photo", !chore.requires_photo)}
                        className={`w-10 h-5 rounded-full transition-colors relative ${chore.requires_photo ? "bg-blue-500" : "bg-gray-200"}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-transform ${chore.requires_photo ? "translate-x-5" : "translate-x-0.5"}`} />
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {(showAddForm || editingChore) && (
        <ChoreForm
          chore={editingChore}
          householdId={householdId}
          onClose={() => { setShowAddForm(false); setEditingChore(null); }}
          onSaved={() => { setShowAddForm(false); setEditingChore(null); loadChores(); }}
        />
      )}
    </div>
  );
}

function ChoreForm({
  chore,
  householdId,
  onClose,
  onSaved,
}: {
  chore: Chore | null;
  householdId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(chore?.title_en || "");
  const [timeSlot, setTimeSlot] = useState(chore?.time_slot || "");
  const [timeLabel, setTimeLabel] = useState(chore?.time_label || "Morning");
  const [days, setDays] = useState<number[]>(chore?.days_of_week || [1, 2, 3, 4, 5, 6]);
  const [isMonthly, setIsMonthly] = useState(chore?.is_monthly || false);
  const [youtubeUrl, setYoutubeUrl] = useState(chore?.youtube_url || "");
  const [requiresPhoto, setRequiresPhoto] = useState(chore?.requires_photo || false);
  const [saving, setSaving] = useState(false);

  const toggleDay = (day: number) => {
    setDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day].sort());
  };

  async function handleSave() {
    if (!title.trim()) return;
    setSaving(true);
    const payload = {
      title_en: title.trim(),
      time_slot: timeSlot || null,
      time_label: timeLabel,
      days_of_week: days,
      is_monthly: isMonthly,
      youtube_url: youtubeUrl || null,
      requires_photo: requiresPhoto,
      household_id: householdId,
    };
    if (chore) {
      await supabase.from("chores").update(payload).eq("id", chore.id);
    } else {
      await supabase.from("chores").insert({ ...payload, sort_order: 99 });
    }
    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-gray-900">{chore ? "Edit Chore" : "Add Chore"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Task name (English)</label>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="e.g. Clean bathrooms"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time slot</label>
            <input
              value={timeSlot}
              onChange={e => setTimeSlot(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="e.g. 09:00-13:30"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
            <select
              value={timeLabel}
              onChange={e => setTimeLabel(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option>Morning</option>
              <option>Afternoon</option>
              <option>Evening</option>
              <option>General</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Days</label>
          <div className="flex gap-1.5 flex-wrap">
            {DAY_NAMES_SHORT.map((day, i) => (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${days.includes(i) ? "bg-green-600 text-white" : "bg-gray-100 text-gray-500"}`}
              >
                {day}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">YouTube / tutorial URL (optional)</label>
          <input
            value={youtubeUrl}
            onChange={e => setYoutubeUrl(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="https://youtube.com/..."
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Monthly only (deep clean)</label>
          <div onClick={() => setIsMonthly(!isMonthly)} className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${isMonthly ? "bg-purple-500" : "bg-gray-200"}`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${isMonthly ? "translate-x-6" : "translate-x-0.5"}`} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Require photo proof</label>
          <div onClick={() => setRequiresPhoto(!requiresPhoto)} className={`w-12 h-6 rounded-full cursor-pointer transition-colors relative ${requiresPhoto ? "bg-blue-500" : "bg-gray-200"}`}>
            <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${requiresPhoto ? "translate-x-6" : "translate-x-0.5"}`} />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving || !title.trim()}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving..." : chore ? "Save Changes" : "Add Chore"}
        </button>
      </div>
    </div>
  );
}
