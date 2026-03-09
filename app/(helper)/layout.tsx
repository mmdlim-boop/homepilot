import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import HelperNav from "@/components/HelperNav";
import PushSubscriber from "@/components/PushSubscriber";

export default async function HelperLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, language, household_id")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "helper") redirect("/admin");

  const lang = profile.language || "id";

  return (
    <div className="min-h-screen bg-gray-50 helper-view">
      <header className="bg-green-600 text-white px-4 py-4 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <span className="text-lg">🏠</span>
          </div>
          <div>
            <span className="font-bold text-white">HomePilot</span>
            {profile.display_name && (
              <span className="text-green-200 text-xs ml-2">{profile.display_name}</span>
            )}
          </div>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-5 pb-24">
        {children}
      </main>
      <HelperNav lang={lang} />
      <PushSubscriber />
    </div>
  );
}
