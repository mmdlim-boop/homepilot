"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { DAY_NAMES_FULL, DAY_THEMES, CUISINE_THEME_LABELS, getMonday, formatDate } from "@/lib/utils";

interface Recipe {
  id: string;
  title: string;
  cuisine_theme: string;
  source_url: string | null;
}

interface MealPlan {
  id: string;
  week_start_date: string;
  status: string;
  monday_recipe_id: string | null;
  tuesday_recipe_id: string | null;
  wednesday_main_id: string | null;
  wednesday_side1_id: string | null;
  wednesday_side2_id: string | null;
  thursday_recipe_id: string | null;
  friday_recipe_id: string | null;
  use_up_ingredients: string | null;
}

const WEEK_DAYS = [1, 2, 3, 4, 5] as const;
const PLAN_FIELDS: Record<number, string[]> = {
  1: ["monday_recipe_id"],
  2: ["tuesday_recipe_id"],
  3: ["wednesday_main_id", "wednesday_side1_id", "wednesday_side2_id"],
  4: ["thursday_recipe_id"],
  5: ["friday_recipe_id"],
};

export default function MealPlanPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan | null>(null);
  const [useUpIngredients, setUseUpIngredients] = useState("");
  const [curating, setCurating] = useState(false);
  const [approving, setApproving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [householdId, setHouseholdId] = useState("");
  const [recipeSelections, setRecipeSelections] = useState<Record<string, string>>({});
  const [pantryCheck, setPantryCheck] = useState<{ items_json: Array<{name: string; available: boolean}>; free_text_leftovers: string } | null>(null);
  const supabase = createClient();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
    if (!profile?.household_id) return;
    setHouseholdId(profile.household_id);

    const { data: recs } = await supabase.from("recipes").select("id, title, cuisine_theme, source_url").eq("household_id", profile.household_id).eq("is_active", true).order("title");
    setRecipes(recs || []);

    // Current week's plan
    const weekStart = formatDate(getMonday());
    const { data: plan } = await supabase
      .from("meal_plans")
      .select("*")
      .eq("household_id", profile.household_id)
      .gte("week_start_date", weekStart)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    setMealPlan(plan || null);
    if (plan) {
      setRecipeSelections({
        monday_recipe_id: plan.monday_recipe_id || "",
        tuesday_recipe_id: plan.tuesday_recipe_id || "",
        wednesday_main_id: plan.wednesday_main_id || "",
        wednesday_side1_id: plan.wednesday_side1_id || "",
        wednesday_side2_id: plan.wednesday_side2_id || "",
        thursday_recipe_id: plan.thursday_recipe_id || "",
        friday_recipe_id: plan.friday_recipe_id || "",
      });
      setUseUpIngredients(plan.use_up_ingredients || "");
    }

    // Latest pantry check
    const { data: pantry } = await supabase
      .from("pantry_checks")
      .select("items_json, free_text_leftovers")
      .eq("household_id", profile.household_id)
      .order("submitted_at", { ascending: false })
      .limit(1)
      .single();
    if (pantry) {
      setPantryCheck(pantry);
      if (!plan) {
        const available = pantry.items_json.filter((i: {available: boolean}) => i.available).map((i: {name: string}) => i.name);
        const all = [...available, pantry.free_text_leftovers].filter(Boolean).join(", ");
        setUseUpIngredients(all);
      }
    }

    setLoading(false);
  }

  async function handleCurate() {
    setCurating(true);
    const response = await fetch("/api/meal-plan/curate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ householdId, useUpIngredients }),
    });
    const data = await response.json();
    if (data.mealPlan) {
      setMealPlan(data.mealPlan);
      setRecipeSelections({
        monday_recipe_id: data.mealPlan.monday_recipe_id || "",
        tuesday_recipe_id: data.mealPlan.tuesday_recipe_id || "",
        wednesday_main_id: data.mealPlan.wednesday_main_id || "",
        wednesday_side1_id: data.mealPlan.wednesday_side1_id || "",
        wednesday_side2_id: data.mealPlan.wednesday_side2_id || "",
        thursday_recipe_id: data.mealPlan.thursday_recipe_id || "",
        friday_recipe_id: data.mealPlan.friday_recipe_id || "",
      });
    }
    setCurating(false);
  }

  async function handleApprove() {
    if (!mealPlan) return;
    setApproving(true);
    await supabase.from("meal_plans").update({
      ...recipeSelections,
      status: "approved",
      approved_at: new Date().toISOString(),
    }).eq("id", mealPlan.id);

    // Generate grocery list
    await fetch("/api/meal-plan/grocery", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealPlanId: mealPlan.id, householdId }),
    });

    setMealPlan(prev => prev ? { ...prev, status: "approved" } : null);
    setApproving(false);
  }

  const getRecipeName = (id: string | null) => {
    if (!id) return null;
    return recipes.find(r => r.id === id)?.title || "Unknown";
  };

  if (loading) return <div className="flex justify-center items-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Weekly Meal Plan</h1>

      {/* Pantry check summary */}
      {pantryCheck && (
        <div className="bg-green-50 rounded-2xl p-4 border border-green-100">
          <p className="text-sm font-semibold text-green-800 mb-1">Helper&apos;s Pantry Report</p>
          <p className="text-sm text-green-700">
            Available: {pantryCheck.items_json.filter(i => i.available).map(i => i.name).join(", ") || "Nothing marked"}
          </p>
          {pantryCheck.free_text_leftovers && (
            <p className="text-sm text-green-600 mt-1">Also: {pantryCheck.free_text_leftovers}</p>
          )}
        </div>
      )}

      {/* Use-up ingredients */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          Ingredients to use up this week
        </label>
        <textarea
          value={useUpIngredients}
          onChange={e => setUseUpIngredients(e.target.value)}
          rows={2}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
          placeholder="e.g. half a pumpkin, some tofu, pak choy..."
        />
        <button
          onClick={handleCurate}
          disabled={curating}
          className="mt-3 w-full bg-orange-500 text-white py-3 rounded-xl font-semibold hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {curating ? "✨ Curating with AI..." : "✨ Curate This Week's Meals with AI"}
        </button>
      </div>

      {/* Meal plan grid */}
      {mealPlan && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              Week of {new Date(mealPlan.week_start_date + "T00:00:00").toLocaleDateString("en-SG", { day: "numeric", month: "long" })}
            </h2>
            {mealPlan.status === "approved" && (
              <span className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">✓ Approved</span>
            )}
          </div>

          {WEEK_DAYS.map(dayNum => {
            const theme = DAY_THEMES[dayNum];
            const fields = PLAN_FIELDS[dayNum];
            const themeRecipes = recipes.filter(r => {
              if (dayNum === 3) return r.cuisine_theme === "chinese_main" || r.cuisine_theme === "chinese_side";
              return r.cuisine_theme === theme.theme;
            });

            return (
              <div key={dayNum} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center text-sm font-bold text-orange-600">
                    {DAY_NAMES_FULL[dayNum].substring(0, 1)}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800 text-sm">{DAY_NAMES_FULL[dayNum]}</span>
                    <span className="text-xs text-gray-400 ml-2">{theme.themeLabel}{theme.constraints ? ` — ${theme.constraints}` : ""}</span>
                  </div>
                </div>
                {fields.map((field, fi) => (
                  <div key={field} className={fi > 0 ? "mt-2" : ""}>
                    {dayNum === 3 && <p className="text-xs text-gray-400 mb-1">{fi === 0 ? "Main dish" : `Side dish ${fi}`}</p>}
                    <select
                      value={recipeSelections[field] || ""}
                      onChange={e => setRecipeSelections(prev => ({ ...prev, [field]: e.target.value }))}
                      disabled={mealPlan.status === "approved"}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white disabled:bg-gray-50 disabled:text-gray-500"
                    >
                      <option value="">— Select a recipe —</option>
                      {themeRecipes.map(r => (
                        <option key={r.id} value={r.id}>{r.title}</option>
                      ))}
                      {recipes.filter(r => !themeRecipes.find(tr => tr.id === r.id)).map(r => (
                        <option key={r.id} value={r.id} className="text-gray-400">
                          [Other] {r.title}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            );
          })}

          {mealPlan.status === "pending" && (
            <button
              onClick={handleApprove}
              disabled={approving}
              className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {approving ? "Approving & generating grocery list..." : "✓ Approve Meal Plan & Generate Grocery List"}
            </button>
          )}

          {mealPlan.status === "approved" && (
            <div className="flex gap-2">
              <a href="/admin/grocery" className="flex-1 bg-teal-600 text-white py-3 rounded-xl font-semibold text-center hover:bg-teal-700 transition-colors text-sm">
                🛒 View Grocery List
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
