import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { curateWeeklyMealPlan, DayCuisineTheme } from "@/lib/anthropic";
import { getMonday, formatDate, DAY_THEMES } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { householdId, useUpIngredients } = await request.json();

    // Get all active recipes
    const { data: recipes } = await supabase
      .from("recipes")
      .select("id, title, cuisine_theme, source_url")
      .eq("household_id", householdId)
      .eq("is_active", true);

    if (!recipes || recipes.length === 0) {
      return NextResponse.json({ error: "No recipes found. Please add recipes in Settings first." }, { status: 400 });
    }

    // Build theme list
    const themes: DayCuisineTheme[] = Object.entries(DAY_THEMES).map(([dayNum, theme]) => ({
      day: dayNum,
      dayName: theme.label,
      theme: theme.theme,
      themeLabel: theme.themeLabel,
      constraints: theme.constraints,
    }));

    // Call Claude
    const selections = await curateWeeklyMealPlan(recipes, themes, useUpIngredients || "");

    // Calculate week start
    const weekStart = formatDate(getMonday());

    // Upsert meal plan
    const mealPlanData = {
      household_id: householdId,
      week_start_date: weekStart,
      status: "pending",
      monday_recipe_id: selections.monday?.[0] || null,
      tuesday_recipe_id: selections.tuesday?.[0] || null,
      wednesday_main_id: selections.wednesday?.[0] || null,
      wednesday_side1_id: selections.wednesday?.[1] || null,
      wednesday_side2_id: selections.wednesday?.[2] || null,
      thursday_recipe_id: selections.thursday?.[0] || null,
      friday_recipe_id: selections.friday?.[0] || null,
      use_up_ingredients: useUpIngredients,
      curated_at: new Date().toISOString(),
    };

    const { data: existing } = await supabase
      .from("meal_plans")
      .select("id")
      .eq("household_id", householdId)
      .eq("week_start_date", weekStart)
      .single();

    let mealPlan;
    if (existing) {
      const { data } = await supabase.from("meal_plans").update(mealPlanData).eq("id", existing.id).select().single();
      mealPlan = data;
    } else {
      const { data } = await supabase.from("meal_plans").insert(mealPlanData).select().single();
      mealPlan = data;
    }

    // Send push to admin
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("household_id", householdId)
      .eq("role", "admin")
      .single();

    if (adminProfile) {
      const { data: sub } = await supabase
        .from("push_subscriptions")
        .select("subscription_json")
        .eq("user_id", adminProfile.id)
        .single();

      if (sub?.subscription_json) {
        const { sendPushNotification } = await import("@/lib/push");
        await sendPushNotification(sub.subscription_json, {
          title: "🍽️ Meal plan ready for review",
          body: "This week's menu has been curated by AI. Tap to approve.",
          url: "/admin/meal-plan",
          tag: "meal-plan",
        });
      }
    }

    return NextResponse.json({ success: true, mealPlan, reasoning: selections.reasoning });
  } catch (error) {
    console.error("Curate error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
