import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { generateGroceryList } from "@/lib/anthropic";
import { makeRedmartUrl, makeLazadaUrl } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServiceClient();
    const { mealPlanId, householdId } = await request.json();

    // Get meal plan with all recipes
    const { data: mealPlan } = await supabase
      .from("meal_plans")
      .select(`
        *,
        monday_recipe:monday_recipe_id(title, ingredients_json, steps_en, source_url),
        tuesday_recipe:tuesday_recipe_id(title, ingredients_json, steps_en, source_url),
        wednesday_main:wednesday_main_id(title, ingredients_json, steps_en, source_url),
        wednesday_side1:wednesday_side1_id(title, ingredients_json, steps_en, source_url),
        wednesday_side2:wednesday_side2_id(title, ingredients_json, steps_en, source_url),
        thursday_recipe:thursday_recipe_id(title, ingredients_json, steps_en, source_url),
        friday_recipe:friday_recipe_id(title, ingredients_json, steps_en, source_url)
      `)
      .eq("id", mealPlanId)
      .single();

    if (!mealPlan) return NextResponse.json({ error: "Meal plan not found" }, { status: 404 });

    // Collect all recipes
    const recipes = [
      mealPlan.monday_recipe,
      mealPlan.tuesday_recipe,
      mealPlan.wednesday_main,
      mealPlan.wednesday_side1,
      mealPlan.wednesday_side2,
      mealPlan.thursday_recipe,
      mealPlan.friday_recipe,
    ].filter(Boolean) as Array<{
      title: string;
      ingredients_json?: Array<{ name: string; qty?: string; is_pantry?: boolean }>;
      steps_en?: string;
      source_url?: string;
    }>;

    // Generate grocery list via Claude
    const rawItems = await generateGroceryList(recipes);

    // Add RedMart and Lazada URLs
    const itemsWithUrls = rawItems.map(item => ({
      ...item,
      redmart_url: makeRedmartUrl(item.name),
      lazada_url: makeLazadaUrl(item.name),
      have_confirmed: false,
    }));

    // Save grocery list
    const { data: existing } = await supabase
      .from("grocery_lists")
      .select("id")
      .eq("meal_plan_id", mealPlanId)
      .single();

    if (existing) {
      await supabase.from("grocery_lists").update({ items_json: itemsWithUrls }).eq("id", existing.id);
    } else {
      await supabase.from("grocery_lists").insert({
        meal_plan_id: mealPlanId,
        household_id: householdId,
        items_json: itemsWithUrls,
      });
    }

    return NextResponse.json({ success: true, itemCount: itemsWithUrls.length });
  } catch (error) {
    console.error("Grocery list error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
