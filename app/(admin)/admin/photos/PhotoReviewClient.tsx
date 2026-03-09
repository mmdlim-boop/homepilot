"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";

interface Completion {
  id: string;
  photo_url: string;
  date: string;
  admin_reviewed: boolean;
  admin_note: string | null;
  chores: { title_en: string } | null;
  created_at: string;
}

export default function PhotoReviewClient({
  pending,
  reviewed,
}: {
  pending: Completion[];
  reviewed: Completion[];
}) {
  const [pendingList, setPendingList] = useState(pending);
  const [note, setNote] = useState<Record<string, string>>({});
  const [approving, setApproving] = useState<string | null>(null);
  const supabase = createClient();

  async function handleApprove(id: string, approved: boolean) {
    setApproving(id);
    await supabase.from("chore_completions").update({
      admin_reviewed: true,
      admin_note: approved ? "Looks good! ✓" : (note[id] || "Please redo this task."),
    }).eq("id", id);

    // Send notification to helper via API
    await fetch("/api/instructions/photo-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completionId: id, approved, note: note[id] }),
    });

    setPendingList(prev => prev.filter(p => p.id !== id));
    setApproving(null);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Photo Reviews</h1>

      {pendingList.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">📸</div>
          <p className="text-gray-500">No photos pending review</p>
        </div>
      ) : (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pending Review ({pendingList.length})
          </h2>
          <div className="space-y-4">
            {pendingList.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Photo */}
                <div className="relative aspect-video bg-gray-100">
                  <Image
                    src={item.photo_url}
                    alt="Chore photo"
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <p className="font-medium text-gray-800">{item.chores?.title_en || "Chore"}</p>
                    <p className="text-xs text-gray-400">{new Date(item.created_at).toLocaleString("en-SG")}</p>
                  </div>
                  <input
                    value={note[item.id] || ""}
                    onChange={e => setNote(prev => ({ ...prev, [item.id]: e.target.value }))}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Optional feedback note to helper..."
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(item.id, true)}
                      disabled={approving === item.id}
                      className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleApprove(item.id, false)}
                      disabled={approving === item.id}
                      className="flex-1 bg-red-50 text-red-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-red-100 disabled:opacity-50 transition-colors"
                    >
                      ✗ Needs Redo
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Recently Reviewed</h2>
          <div className="grid grid-cols-2 gap-3">
            {reviewed.map(item => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="relative aspect-video bg-gray-100">
                  <Image src={item.photo_url} alt="Reviewed photo" fill className="object-cover" />
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">✓</div>
                </div>
                <div className="p-2">
                  <p className="text-xs text-gray-600 truncate">{item.chores?.title_en}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
