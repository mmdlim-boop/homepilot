import { createClient } from "@/lib/supabase/server";
import PhotoReviewClient from "./PhotoReviewClient";

export default async function PhotosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user!.id).single();

  const { data: pending } = await supabase
    .from("chore_completions")
    .select("*, chores(title_en, id)")
    .eq("admin_reviewed", false)
    .not("photo_url", "is", null)
    .order("created_at", { ascending: false });

  const { data: reviewed } = await supabase
    .from("chore_completions")
    .select("*, chores(title_en)")
    .eq("admin_reviewed", true)
    .not("photo_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(10);

  return <PhotoReviewClient pending={pending || []} reviewed={reviewed || []} />;
}
