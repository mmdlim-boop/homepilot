"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const DEFAULT_CHORES = [
  // Every day morning
  { title_en: "Wake up + shower", time_slot: "06:30", time_label: "Morning", days_of_week: [1,2,3,4,5,6], sort_order: 1 },
  { title_en: "Prepare breakfast", time_slot: "07:00-09:00", time_label: "Morning", days_of_week: [1,2,3,4,5,6], sort_order: 2 },
  { title_en: "Prepare baby's school bag and tea-time snacks", time_slot: "07:00-09:00", time_label: "Morning", days_of_week: [1,2,3,4,5,6], sort_order: 3 },
  { title_en: "Get baby ready (sit on toilet / shower / brush teeth)", time_slot: "07:00-09:00", time_label: "Morning", days_of_week: [1,2,3,4,5,6], sort_order: 4 },
  { title_en: "Feed baby breakfast", time_slot: "07:00-09:00", time_label: "Morning", days_of_week: [1,2,3,4,5,6], sort_order: 5 },
  { title_en: "Take baby to school and return home", time_slot: "07:00-09:00", time_label: "Morning", days_of_week: [1,2,3,4,5,6], sort_order: 6 },
  { title_en: "Clear master bedroom and baby's room (remove diaper, milk bottles and tidy rooms)", time_slot: "09:00-13:30", time_label: "Morning", days_of_week: [1,2,3,4,5,6], sort_order: 7 },
  { title_en: "Do dishes", time_slot: "09:00-13:30", time_label: "Morning", days_of_week: [1,2,3,4,5,6], sort_order: 8 },
  { title_en: "Laundry — Wash / Hang / Fold / Iron", time_slot: "09:00-13:30", time_label: "Morning", days_of_week: [1,2,3,4,5,6], sort_order: 9 },
  { title_en: "Vacuum + steam clean all floors", time_slot: "09:00-13:30", time_label: "Morning", days_of_week: [1,2,3,4,5,6], sort_order: 10 },
  { title_en: "Sweep + Wash the outside", time_slot: "09:00-13:30", time_label: "Morning", days_of_week: [1,2,3,4,5,6], sort_order: 11 },
  { title_en: "Arrange the shoes outside", time_slot: "09:00-13:30", time_label: "Morning", days_of_week: [1,2,3,4,5,6], sort_order: 12 },
  // Monday
  { title_en: "Wash two toilets", time_slot: null, time_label: "Afternoon", days_of_week: [1], sort_order: 20 },
  { title_en: "Change bedsheets for both rooms", time_slot: null, time_label: "Afternoon", days_of_week: [1], sort_order: 21 },
  { title_en: "Change all towels", time_slot: null, time_label: "Afternoon", days_of_week: [1], sort_order: 22 },
  { title_en: "Change all rugs in house", time_slot: null, time_label: "Afternoon", days_of_week: [1], sort_order: 23 },
  { title_en: "Baby's room: Mop with Dettol", time_slot: null, time_label: "Afternoon", days_of_week: [1], sort_order: 24 },
  { title_en: "Grocery shopping for the week", time_slot: null, time_label: "Afternoon", days_of_week: [1], sort_order: 25 },
  // Tuesday
  { title_en: "Wipe all surfaces — Living room: sofa, TV, radio, fans, lights", time_slot: null, time_label: "Afternoon", days_of_week: [2], sort_order: 30 },
  { title_en: "Wipe all surfaces — Bedroom: cupboards, tablet ops", time_slot: null, time_label: "Afternoon", days_of_week: [2], sort_order: 31 },
  { title_en: "Tidy wardrobes and cabinets", time_slot: null, time_label: "Afternoon", days_of_week: [2], sort_order: 32 },
  { title_en: "Cut fruits from groceries", time_slot: null, time_label: "Afternoon", days_of_week: [2], sort_order: 33 },
  // Wednesday
  { title_en: "Wipe gate and door, shoe rack", time_slot: null, time_label: "Afternoon", days_of_week: [3], sort_order: 40 },
  { title_en: "Water plants and fill fountain with water", time_slot: null, time_label: "Afternoon", days_of_week: [3], sort_order: 41 },
  { title_en: "Deep clean: Kitchen Cabinets — take out appliances, cutlery and ingredients, wipe clean and arrange", time_slot: null, time_label: "Afternoon", days_of_week: [3], is_monthly: true, sort_order: 42, youtube_url: "https://www.youtube.com/results?search_query=how+to+deep+clean+kitchen+cabinets" },
  { title_en: "Deep clean: Fridge — take out ingredients, throw away expired food, wipe clean and arrange", time_slot: null, time_label: "Afternoon", days_of_week: [3], is_monthly: true, sort_order: 43, youtube_url: "https://www.youtube.com/results?search_query=how+to+deep+clean+fridge" },
  { title_en: "Deep clean: Washing machine — clean out filter", time_slot: null, time_label: "Afternoon", days_of_week: [3], is_monthly: true, sort_order: 44, youtube_url: "https://www.youtube.com/results?search_query=how+to+clean+washing+machine+filter" },
  { title_en: "Deep clean: Dishwasher — clean out filter", time_slot: null, time_label: "Afternoon", days_of_week: [3], is_monthly: true, sort_order: 45, youtube_url: "https://www.youtube.com/results?search_query=how+to+clean+dishwasher+filter" },
  // Thursday
  { title_en: "Kitchen: Wipe Microwave, fridge, cabinets", time_slot: null, time_label: "Afternoon", days_of_week: [4], sort_order: 50 },
  { title_en: "Clean and wipe service yard", time_slot: null, time_label: "Afternoon", days_of_week: [4], sort_order: 51 },
  // Friday
  { title_en: "Wash two toilets", time_slot: null, time_label: "Afternoon", days_of_week: [5], sort_order: 60 },
  { title_en: "Clean windows", time_slot: null, time_label: "Afternoon", days_of_week: [5], sort_order: 61 },
  // Saturday
  { title_en: "Clean office", time_slot: null, time_label: "Afternoon", days_of_week: [6], sort_order: 70 },
  { title_en: "Plan meals for following week and send to group chat", time_slot: null, time_label: "Afternoon", days_of_week: [6], sort_order: 71 },
  { title_en: "Wash cars", time_slot: null, time_label: "Afternoon", days_of_week: [6], sort_order: 72 },
];

const DEFAULT_RECIPES = [
  // Vegetarian
  { title: "Green pasta", cuisine_theme: "vegetarian", source_url: "https://www.instagram.com/reel/DTa1XM2CMM2/" },
  { title: "Air fryer salt and pepper tofu", cuisine_theme: "vegetarian", source_url: "https://www.instagram.com/reel/DJKjgB9Bvo7/" },
  { title: "Spinach and lentil stew", cuisine_theme: "vegetarian", source_url: "https://www.instagram.com/reel/DJJMmx0RM-X/" },
  { title: "Mushroom and leek filo pie", cuisine_theme: "vegetarian", source_url: "https://www.instagram.com/reel/DDFdzW3ojiG/" },
  { title: "Roasted veggie pasta", cuisine_theme: "vegetarian", source_url: "https://www.instagram.com/reel/C9AlvzwNSUB/" },
  { title: "Lentil bolognese", cuisine_theme: "vegetarian", source_url: "https://www.instagram.com/reel/DTLL0Q8AmHA/" },
  // Chinese main
  { title: "Chicken soup", cuisine_theme: "chinese_main", source_url: "https://www.instagram.com/reel/DT6G4j8kny_/" },
  { title: "Steamed chicken, lotus roots and carrots", cuisine_theme: "chinese_main", source_url: "https://www.instagram.com/reel/DTdB-lnk_gu/" },
  { title: "Pork soup with daikon", cuisine_theme: "chinese_main", source_url: "https://www.instagram.com/reel/DS0tRm9ksw4/" },
  { title: "Chicken pumpkin soup", cuisine_theme: "chinese_main", source_url: "https://www.instagram.com/reel/DLRv0gUTNfU/" },
  { title: "Fish stew", cuisine_theme: "chinese_main", source_url: "https://www.instagram.com/reel/DLn8tdKRUl4/" },
  { title: "Beef and veggies", cuisine_theme: "chinese_main", source_url: "https://www.instagram.com/reel/DHitemyM4LX/" },
  { title: "Beef and enoki", cuisine_theme: "chinese_main", source_url: "https://www.instagram.com/reel/DH5Fa6Uui5q/" },
  { title: "Miso salmon", cuisine_theme: "chinese_main", source_url: "https://www.instagram.com/reel/DJCVle2xJhh/" },
  { title: "Braised beef", cuisine_theme: "chinese_main", source_url: "https://www.instagram.com/reel/DCX3KkPMs6g/" },
  { title: "Steamed fish", cuisine_theme: "chinese_main", source_url: "https://www.instagram.com/reel/DQ3C9vsk7Zs/" },
  // Chinese side
  { title: "Stir fried broccoli", cuisine_theme: "chinese_side", source_url: "https://www.instagram.com/reel/DTHNChtAJpb/" },
  { title: "Any green veggie stir fry", cuisine_theme: "chinese_side", source_url: "https://www.instagram.com/reel/DTjQKQwgBbE/" },
  // Noodles
  { title: "Cantonese noodles", cuisine_theme: "noodles", source_url: "https://www.instagram.com/reel/DTUfHi4k-E3/" },
  { title: "Garlic peanut butter noodles", cuisine_theme: "noodles", source_url: "https://www.instagram.com/reel/DJHOPNPJBiE/" },
  { title: "Shrimp linguini", cuisine_theme: "noodles", source_url: "https://www.instagram.com/reel/DAblCwau7ot/" },
  { title: "One pot vermicelli", cuisine_theme: "noodles", source_url: "https://www.instagram.com/reel/DR9lkTXkYGH/" },
  // Western
  { title: "Roasted veggie and cheese pasta", cuisine_theme: "western", source_url: "https://www.instagram.com/reel/DS-_yv5kpQB/" },
  { title: "Greek chicken and lemon potatoes", cuisine_theme: "western", source_url: "https://www.instagram.com/reel/DLQvbqCvFbV/" },
  { title: "Greek parmesan chicken", cuisine_theme: "western", source_url: "https://www.instagram.com/reel/DJkGyqkSELm/" },
  { title: "Chicken pot pie", cuisine_theme: "western", source_url: "https://www.instagram.com/reel/DDm2xCzSLHk/" },
  { title: "Air fryer fried chicken", cuisine_theme: "western", source_url: "https://www.instagram.com/reel/DJys8WgTPtV/" },
  { title: "Shepherds pie", cuisine_theme: "western", source_url: "https://www.instagram.com/reel/DT-AxjfkiU_/" },
  { title: "Cod and tomatoes", cuisine_theme: "western", source_url: "https://www.instagram.com/reel/DTQgEMaETGR/" },
  // Indian
  { title: "Chicken chukali", cuisine_theme: "indian", source_url: "https://www.instagram.com/reel/DRWUDtKiZ42/" },
  { title: "Prawn biryani", cuisine_theme: "indian", source_url: "https://www.instagram.com/reel/DJN-Tijp31e/" },
  { title: "Butter chicken", cuisine_theme: "indian", source_url: "https://www.instagram.com/reel/DE3ZhQoM-sq/" },
  { title: "Baked Indian chicken", cuisine_theme: "indian", source_url: "https://www.instagram.com/reel/DDe1LjwoTkF/" },
  // Baby breakfast
  { title: "Protein pancakes", cuisine_theme: "baby_breakfast", source_url: "https://www.instagram.com/reel/DTTSELzEkGq/" },
  { title: "Shrimp toast", cuisine_theme: "baby_breakfast", source_url: "https://www.instagram.com/reel/DMNXUIlTGYN/" },
  { title: "Beehoon soup", cuisine_theme: "baby_breakfast", source_url: "https://www.instagram.com/reel/Dl80rDhTMHc/" },
  { title: "Rolled French toast", cuisine_theme: "baby_breakfast", source_url: "https://www.instagram.com/reel/DDaIJhXsJGM/" },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(1);
  const [householdName, setHouseholdName] = useState("Our Home");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function completeOnboarding() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Create household
    const { data: household } = await supabase.from("households").insert({
      name: householdName,
      admin_user_id: user.id,
    }).select().single();

    if (!household) { setLoading(false); return; }

    // Set admin profile
    await supabase.from("profiles").upsert({
      id: user.id,
      household_id: household.id,
      role: "admin",
      display_name: user.email?.split("@")[0] || "Admin",
    });

    // Seed chores
    await supabase.from("chores").insert(
      DEFAULT_CHORES.map(c => ({
        ...c,
        household_id: household.id,
        is_monthly: (c as { is_monthly?: boolean }).is_monthly || false,
        youtube_url: (c as { youtube_url?: string }).youtube_url || null,
      }))
    );

    // Seed recipes
    await supabase.from("recipes").insert(
      DEFAULT_RECIPES.map(r => ({ ...r, household_id: household.id }))
    );

    router.push("/admin");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-white text-3xl">🏠</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome to HomePilot</h1>
          <p className="text-gray-500 mt-1">Let&apos;s set up your household</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          {step === 1 && (
            <>
              <h2 className="text-xl font-semibold text-gray-800">What&apos;s your household called?</h2>
              <input
                value={householdName}
                onChange={e => setHouseholdName(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g. The Lim Family"
              />
              <p className="text-sm text-gray-400">
                We&apos;ll set up your complete chore schedule and recipe library from your existing documents. You can customise everything later.
              </p>
              <button
                onClick={() => setStep(2)}
                disabled={!householdName.trim()}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                Continue →
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="text-xl font-semibold text-gray-800">What we&apos;ll set up for you:</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">✅</span>
                  <div>
                    <p className="font-medium text-gray-800">Complete chore schedule</p>
                    <p className="text-sm text-gray-400">Your full daily + weekly schedule seeded automatically</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🍳</span>
                  <div>
                    <p className="font-medium text-gray-800">30+ recipes from your collection</p>
                    <p className="text-sm text-gray-400">Western, Vegetarian, Chinese, Noodles, Indian & more</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🌍</span>
                  <div>
                    <p className="font-medium text-gray-800">Multi-language support</p>
                    <p className="text-sm text-gray-400">Bahasa Indonesia, Tagalog, Thai, Burmese</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📱</span>
                  <div>
                    <p className="font-medium text-gray-800">Helper app ready</p>
                    <p className="text-sm text-gray-400">Create your helper&apos;s account in Settings after setup</p>
                  </div>
                </div>
              </div>
              <button
                onClick={completeOnboarding}
                disabled={loading}
                className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? "Setting up..." : "🚀 Set Up HomePilot"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
