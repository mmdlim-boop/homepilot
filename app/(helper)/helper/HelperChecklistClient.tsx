"use client";
import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUIString } from "@/lib/ui-strings";
import Link from "next/link";

interface Chore {
  id: string;
  title_en: string;
  time_slot: string | null;
  time_label: string | null;
  days_of_week: number[];
  is_monthly: boolean;
  youtube_url: string | null;
  requires_photo: boolean;
}

interface Completion {
  id: string;
  chore_id: string;
  photo_url: string | null;
  admin_reviewed: boolean;
  admin_note: string | null;
}

interface Instruction {
  id: string;
  message_translated: string | null;
  message_en: string;
  youtube_url: string | null;
  sent_at: string;
  acknowledged_at: string | null;
}

interface Recipe {
  title: string;
  source_url: string | null;
}

export default function HelperChecklistClient({
  chores,
  completions: initialCompletions,
  instructions,
  todayRecipe,
  lang,
  todayStr,
  userId,
  householdId,
  dayNum,
}: {
  chores: Chore[];
  completions: Completion[];
  instructions: Instruction[];
  todayRecipe: Recipe | null;
  lang: string;
  todayStr: string;
  userId: string;
  householdId: string;
  dayNum: number;
}) {
  const [completions, setCompletions] = useState<Completion[]>(initialCompletions);
  const [uploading, setUploading] = useState<string | null>(null);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingPhotoChoreId, setPendingPhotoChoreId] = useState<string | null>(null);
  const supabase = createClient();

  const isCompleted = (choreId: string) => completions.some(c => c.chore_id === choreId);
  const getCompletion = (choreId: string) => completions.find(c => c.chore_id === choreId);

  async function toggleChore(chore: Chore) {
    if (isCompleted(chore.id)) return; // Can't un-complete

    if (chore.requires_photo) {
      setPendingPhotoChoreId(chore.id);
      fileInputRef.current?.click();
      return;
    }

    const { data } = await supabase.from("chore_completions").insert({
      chore_id: chore.id,
      household_id: householdId,
      completed_by: userId,
      date: todayStr,
    }).select().single();

    if (data) setCompletions(prev => [...prev, data]);
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !pendingPhotoChoreId) return;
    setUploading(pendingPhotoChoreId);

    // Upload to Supabase Storage
    const ext = file.name.split(".").pop();
    const path = `chores/${householdId}/${todayStr}/${pendingPhotoChoreId}.${ext}`;
    const { data: uploadData, error } = await supabase.storage.from("chore-photos").upload(path, file, { upsert: true });

    if (error) { setUploading(null); return; }

    const { data: { publicUrl } } = supabase.storage.from("chore-photos").getPublicUrl(path);

    const { data } = await supabase.from("chore_completions").insert({
      chore_id: pendingPhotoChoreId,
      household_id: householdId,
      completed_by: userId,
      date: todayStr,
      photo_url: publicUrl,
    }).select().single();

    if (data) setCompletions(prev => [...prev, data]);
    setUploading(null);
    setPendingPhotoChoreId(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function acknowledgeInstruction(id: string) {
    await supabase.from("instructions").update({ acknowledged_at: new Date().toISOString() }).eq("id", id);
    setAcknowledgedIds(prev => new Set([...prev, id]));
  }

  const grouped: Record<string, Chore[]> = {};
  chores.forEach(c => {
    const label = c.time_label || "General";
    if (!grouped[label]) grouped[label] = [];
    grouped[label].push(c);
  });

  const totalChores = chores.length;
  const doneChores = completions.length;
  const allDone = totalChores > 0 && doneChores >= totalChores;
  const activeInstructions = instructions.filter(i => !acknowledgedIds.has(i.id));

  const dayNames: Record<number, string> = { 0: "Minggu", 1: "Senin", 2: "Selasa", 3: "Rabu", 4: "Kamis", 5: "Jumat", 6: "Sabtu" };
  const dayNamesEn: Record<number, string> = { 0: "Sunday", 1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday" };

  return (
    <div className="space-y-5">
      {/* Date header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">{getUIString("todaysTasks", lang)}</h1>
        <p className="text-gray-500 text-sm mt-0.5">
          {lang === "id" ? dayNames[dayNum] : dayNamesEn[dayNum]}, {new Date(todayStr + "T00:00:00").toLocaleDateString("en-SG", { day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Progress bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {doneChores} / {totalChores} {getUIString("completed", lang)}
          </span>
          {allDone && <span className="text-green-600 font-bold text-sm">🎉 {getUIString("wellDone", lang)}</span>}
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-500"
            style={{ width: totalChores > 0 ? `${(doneChores / totalChores) * 100}%` : "0%" }}
          />
        </div>
        {allDone && <p className="text-center text-green-600 text-sm mt-2 font-medium">{getUIString("allDone", lang)}</p>}
      </div>

      {/* Unread instructions alert */}
      {activeInstructions.length > 0 && (
        <Link href="/helper/instructions" className="block bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📝</span>
            <div>
              <p className="font-semibold text-amber-800 text-sm">
                {activeInstructions.length} {getUIString("newInstruction", lang)}
              </p>
              <p className="text-amber-600 text-xs mt-0.5 truncate">
                {activeInstructions[0]?.message_translated || activeInstructions[0]?.message_en}
              </p>
            </div>
          </div>
        </Link>
      )}

      {/* Today's recipe */}
      {todayRecipe && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🍳</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-orange-500 font-medium uppercase tracking-wide">{getUIString("recipe", lang)}</p>
              <p className="font-semibold text-orange-800 text-sm truncate">{todayRecipe.title}</p>
            </div>
            {todayRecipe.source_url && (
              <a href={todayRecipe.source_url} target="_blank" rel="noopener noreferrer" className="bg-orange-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium shrink-0">
                Lihat →
              </a>
            )}
          </div>
        </div>
      )}

      {/* Chore sections */}
      {Object.entries(grouped).map(([label, groupChores]) => (
        <div key={label}>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {label === "Morning" ? getUIString("morningTasks", lang) :
             label === "Afternoon" ? getUIString("afternoonTasks", lang) : label}
          </h2>
          <div className="space-y-2">
            {groupChores.map(chore => {
              const done = isCompleted(chore.id);
              const completion = getCompletion(chore.id);
              const isUploading = uploading === chore.id;

              return (
                <button
                  key={chore.id}
                  onClick={() => toggleChore(chore)}
                  disabled={done || isUploading}
                  className={`w-full text-left rounded-2xl p-4 shadow-sm border transition-all ${
                    done
                      ? "bg-green-50 border-green-200"
                      : "bg-white border-gray-100 active:scale-98 hover:border-green-200"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Checkbox */}
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${done ? "bg-green-500 border-green-500" : "border-gray-300"}`}>
                      {done && <span className="text-white text-sm">✓</span>}
                      {isUploading && <span className="text-gray-400 text-xs animate-spin">⏳</span>}
                    </div>

                    {/* Task text */}
                    <div className="flex-1 min-w-0">
                      <span className={`text-base font-medium leading-snug ${done ? "line-through text-gray-400" : "text-gray-800"}`}>
                        {chore.title_en}
                      </span>
                      {chore.time_slot && (
                        <p className="text-xs text-gray-400 mt-0.5">{chore.time_slot}</p>
                      )}
                      {chore.is_monthly && (
                        <span className="inline-block text-xs bg-purple-100 text-purple-600 px-2 py-0.5 rounded-full mt-1">Bulanan</span>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {chore.youtube_url && (
                        <a
                          href={chore.youtube_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="bg-red-100 text-red-500 text-xs px-2 py-1 rounded-lg"
                        >
                          📹 Video
                        </a>
                      )}
                      {!done && chore.requires_photo && (
                        <span className="bg-blue-100 text-blue-600 text-xs px-2 py-1 rounded-lg">
                          {getUIString("photoRequired", lang)}
                        </span>
                      )}
                      {done && completion?.photo_url && (
                        <span className={`text-xs px-2 py-1 rounded-lg ${completion.admin_reviewed ? "bg-green-100 text-green-600" : "bg-blue-100 text-blue-600"}`}>
                          {completion.admin_reviewed ? getUIString("employerHasSeen", lang) : "📸 Sent"}
                        </span>
                      )}
                      {done && completion?.admin_note && !completion.admin_reviewed && (
                        <span className="text-xs bg-amber-100 text-amber-600 px-2 py-1 rounded-lg">💬</span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {chores.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">😊</div>
          <p className="text-gray-500">No tasks for today</p>
        </div>
      )}

      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoUpload}
        className="hidden"
      />
    </div>
  );
}
