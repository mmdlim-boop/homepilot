import { createClient } from "@/lib/supabase/server";
import InstructionsHelperClient from "./InstructionsHelperClient";

export default async function HelperInstructionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, language")
    .eq("id", user!.id)
    .single();

  const { data: instructions } = await supabase
    .from("instructions")
    .select("*")
    .eq("household_id", profile?.household_id)
    .eq("is_active", true)
    .order("sent_at", { ascending: false })
    .limit(20);

  return (
    <InstructionsHelperClient
      instructions={instructions || []}
      lang={profile?.language || "id"}
      userId={user!.id}
    />
  );
}
