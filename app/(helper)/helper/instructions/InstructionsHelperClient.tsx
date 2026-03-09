"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getUIString } from "@/lib/ui-strings";

interface Instruction {
  id: string;
  message_en: string;
  message_translated: string | null;
  youtube_url: string | null;
  sent_at: string;
  acknowledged_at: string | null;
}

export default function InstructionsHelperClient({
  instructions,
  lang,
  userId,
}: {
  instructions: Instruction[];
  lang: string;
  userId: string;
}) {
  const [list, setList] = useState(instructions);
  const supabase = createClient();

  async function acknowledge(id: string) {
    await supabase.from("instructions").update({ acknowledged_at: new Date().toISOString() }).eq("id", id);
    setList(prev => prev.map(i => i.id === id ? { ...i, acknowledged_at: new Date().toISOString() } : i));
  }

  const unread = list.filter(i => !i.acknowledged_at);
  const read = list.filter(i => i.acknowledged_at);

  return (
    <div className="space-y-5">
      <h1 className="text-xl font-bold text-gray-900">{getUIString("instructions", lang)}</h1>

      {unread.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-3">
            {getUIString("newInstruction", lang)} ({unread.length})
          </h2>
          <div className="space-y-3">
            {unread.map(instr => (
              <div key={instr.id} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
                <p className="text-base font-medium text-gray-800 leading-relaxed">
                  {instr.message_translated || instr.message_en}
                </p>
                {instr.youtube_url && (
                  <a
                    href={instr.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2.5 rounded-xl font-medium text-sm w-full justify-center"
                  >
                    📹 Lihat Video Tutorial
                  </a>
                )}
                <p className="text-xs text-gray-400">
                  {new Date(instr.sent_at).toLocaleString("en-SG")}
                </p>
                <button
                  onClick={() => acknowledge(instr.id)}
                  className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-green-700 transition-colors"
                >
                  ✓ Faham / Understood
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {read.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-3">
            {getUIString("completed", lang)}
          </h2>
          <div className="space-y-2">
            {read.map(instr => (
              <div key={instr.id} className="bg-white border border-gray-100 rounded-2xl p-4 opacity-60">
                <p className="text-sm text-gray-600">
                  {instr.message_translated || instr.message_en}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-gray-300">{new Date(instr.sent_at).toLocaleString("en-SG")}</p>
                  <span className="text-xs text-green-500">✓ Seen</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {list.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-gray-400 text-sm">No instructions yet</p>
        </div>
      )}
    </div>
  );
}
