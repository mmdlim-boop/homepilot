import { createClient } from "@/lib/supabase/server";
import GroceryListClient from "./GroceryListClient";

export default async function GroceryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user!.id).single();

  const { data: latestPlan } = await supabase
    .from("meal_plans")
    .select("id, week_start_date, status")
    .eq("household_id", profile?.household_id)
    .eq("status", "approved")
    .order("week_start_date", { ascending: false })
    .limit(1)
    .single();

  let groceryList = null;
  if (latestPlan) {
    const { data } = await supabase
      .from("grocery_lists")
      .select("*")
      .eq("meal_plan_id", latestPlan.id)
      .single();
    groceryList = data;
  }

  return (
    <GroceryListClient
      groceryList={groceryList}
      mealPlan={latestPlan || null}
      householdId={profile?.household_id || ""}
    />
  );
}
