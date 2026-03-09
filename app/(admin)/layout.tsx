import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, household_id")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");
  if (profile.role !== "admin") redirect("/helper");

  // Redirect to onboarding if no household yet
  if (!profile.household_id) redirect("/onboarding");

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNav displayName={profile.display_name || user.email || "Admin"} />
      <main className="max-w-5xl mx-auto px-4 py-6 pb-8">
        {children}
      </main>
    </div>
  );
}
