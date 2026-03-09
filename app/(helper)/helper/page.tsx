import { createClient } from "@/lib/supabase/server";
import HelperChecklistClient from "./HelperChecklistClient";
import { getDayOfWeek } from "@/lib/utils";

export default async function HelperDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, language, display_name")
    .eq("id", user!.id)
    .single();

  const lang = profile?.language || "id";
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayNum = getDayOfWeek(today);

  // Get today's chores
  const { data: chores } = await supabase
    .from("chores")
    .select("*")
    .eq("household_id", profile?.household_id)
    .eq("is_active", true)
    .order("sort_order");

  const todaysChores = (chores || []).filter((c) => {
    if (c.is_monthly) {
      // Show monthly chores only on first occurrence of the day in the month
      const dayOfMonth = today.getDate();
      if (c.days_of_week.includes(dayNum)) {
        return dayOfMonth <= 7; // First week of month
      }
      return false;
    }
    if (c.days_of_week && c.days_of_week.length > 0) {
      return c.days_of_week.includes(dayNum);
    }
    return true;
  });

  // Get today's completions
  const { data: completions } = await supabase
    .from("chore_completions")
    .select("id, chore_id, photo_url, admin_reviewed, admin_note")
    .eq("date", todayStr)
    .in("chore_id", todaysChores.map(c => c.id));

  // Get unread instructions
  const { data: instructions } = await supabase
    .from("instructions")
    .select("id, message_translated, message_en, youtube_url, sent_at, acknowledged_at")
    .eq("household_id", profile?.household_id)
    .eq("is_active", true)
    .is("acknowledged_at", null)
    .order("sent_at", { ascending: false });

  // Today's recipe (from approved meal plan)
  const { data: mealPlan } = await supabase
    .from("meal_plans")
    .select("*, monday_recipe:monday_recipe_id(title,source_url), tuesday_recipe:tuesday_recipe_id(title,source_url), wednesday_main:wednesday_main_id(title,source_url), thursday_recipe:thursday_recipe_id(title,source_url), friday_recipe:friday_recipe_id(title,source_url)")
    .eq("household_id", profile?.household_id)
    .eq("status", "approved")
    .order("week_start_date", { ascending: false })
    .limit(1)
    .single();

  const dayRecipeMap: Record<number, { title: string; source_url: string | null } | null> = {
    1: mealPlan?.monday_recipe as { title: string; source_url: string | null } | null,
    2: mealPlan?.tuesday_recipe as { title: string; source_url: string | null } | null,
    3: mealPlan?.wednesday_main as { title: string; source_url: string | null } | null,
    4: mealPlan?.thursday_recipe as { title: string; source_url: string | null } | null,
    5: mealPlan?.friday_recipe as { title: string; source_url: string | null } | null,
  };
  const todayRecipe = dayRecipeMap[dayNum] || null;

  return (
    <HelperChecklistClient
      chores={todaysChores}
      completions={completions || []}
      instructions={instructions || []}
      todayRecipe={todayRecipe}
      lang={lang}
      todayStr={todayStr}
      userId={user!.id}
      householdId={profile?.household_id || ""}
      dayNum={dayNum}
    />
  );
}
