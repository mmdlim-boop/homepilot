import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { formatDateDisplay, getDayOfWeek, getDayName } from "@/lib/utils";

export default async function AdminDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("household_id, display_name")
    .eq("id", user!.id)
    .single();

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const dayNum = getDayOfWeek(today);

  // Get today's chores
  const { data: chores } = await supabase
    .from("chores")
    .select("*, chore_completions(id, photo_url, admin_reviewed)")
    .eq("household_id", profile?.household_id)
    .eq("is_active", true)
    .order("sort_order");

  const todaysChores = (chores || []).filter((c) => {
    if (c.days_of_week && c.days_of_week.length > 0) {
      return c.days_of_week.includes(dayNum);
    }
    return true;
  });

  const completedToday = todaysChores.filter((c) =>
    c.chore_completions?.some(
      (cc: { id: string }) => cc.id
    )
  ).length;

  // Get pending photo reviews
  const { data: pendingPhotos } = await supabase
    .from("chore_completions")
    .select("id, chore_id, photo_url, chores(title_en)")
    .eq("date", todayStr)
    .eq("admin_reviewed", false)
    .not("photo_url", "is", null);

  // Get pending instructions (unacknowledged)
  const { data: recentInstructions } = await supabase
    .from("instructions")
    .select("*")
    .eq("household_id", profile?.household_id)
    .eq("is_active", true)
    .order("sent_at", { ascending: false })
    .limit(3);

  // Get current meal plan status
  const { data: currentMealPlan } = await supabase
    .from("meal_plans")
    .select("*, grocery_lists(id)")
    .eq("household_id", profile?.household_id)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  const { data: approvedMealPlan } = await supabase
    .from("meal_plans")
    .select("week_start_date, status")
    .eq("household_id", profile?.household_id)
    .eq("status", "approved")
    .order("week_start_date", { ascending: false })
    .limit(1)
    .single();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Good {today.getHours() < 12 ? "morning" : today.getHours() < 17 ? "afternoon" : "evening"} 👋
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          {formatDateDisplay(todayStr)} • {getDayName(dayNum)}
        </p>
      </div>

      {/* Alert: Pending meal plan approval */}
      {currentMealPlan && (
        <Link href="/admin/meal-plan" className="block">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">🍽️</span>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">Meal plan ready for approval</p>
              <p className="text-amber-600 text-sm">Next week&apos;s menu has been curated — tap to review</p>
            </div>
            <span className="text-amber-400">→</span>
          </div>
        </Link>
      )}

      {/* Alert: Pending photo reviews */}
      {(pendingPhotos?.length ?? 0) > 0 && (
        <Link href="/admin/photos" className="block">
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-2xl">📸</span>
            <div className="flex-1">
              <p className="font-semibold text-blue-800">
                {pendingPhotos!.length} photo{pendingPhotos!.length > 1 ? "s" : ""} to review
              </p>
              <p className="text-blue-600 text-sm">Helper uploaded photos for chore verification</p>
            </div>
            <span className="text-blue-400">→</span>
          </div>
        </Link>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-green-600">{completedToday}</div>
          <div className="text-xs text-gray-500 mt-1">of {todaysChores.length} tasks done</div>
          <div className="text-xs font-medium text-gray-700 mt-1">Today</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-amber-500">{pendingPhotos?.length ?? 0}</div>
          <div className="text-xs text-gray-500 mt-1">photos pending</div>
          <div className="text-xs font-medium text-gray-700 mt-1">Review</div>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-center">
          <div className="text-3xl font-bold text-blue-500">
            {recentInstructions?.filter(i => !i.acknowledged_at).length ?? 0}
          </div>
          <div className="text-xs text-gray-500 mt-1">unread</div>
          <div className="text-xs font-medium text-gray-700 mt-1">Instructions</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <Link href="/admin/instructions" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center text-xl">📝</div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">Send Instruction</div>
              <div className="text-gray-400 text-xs">To helper</div>
            </div>
          </Link>
          <Link href="/admin/chores" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center text-xl">✅</div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">Manage Chores</div>
              <div className="text-gray-400 text-xs">Edit schedule</div>
            </div>
          </Link>
          <Link href="/admin/meal-plan" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-xl">🍽️</div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">Meal Plan</div>
              <div className="text-gray-400 text-xs">This week&apos;s menu</div>
            </div>
          </Link>
          <Link href="/admin/grocery" className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3 hover:bg-gray-50 transition-colors">
            <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center text-xl">🛒</div>
            <div>
              <div className="font-semibold text-gray-800 text-sm">Grocery List</div>
              <div className="text-gray-400 text-xs">RedMart order</div>
            </div>
          </Link>
        </div>
      </div>

      {/* Today's chore progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Today&apos;s Progress</h2>
          <span className="text-sm text-gray-400">{getDayName(dayNum)}</span>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {todaysChores.length === 0 ? (
            <div className="p-6 text-center text-gray-400">No tasks scheduled for today</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {todaysChores.map((chore) => {
                const done = chore.chore_completions?.length > 0;
                return (
                  <div key={chore.id} className="flex items-center gap-3 px-4 py-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${done ? "bg-green-500 border-green-500" : "border-gray-300"}`}>
                      {done && <span className="text-white text-xs">✓</span>}
                    </div>
                    <span className={`text-sm flex-1 ${done ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {chore.title_en}
                    </span>
                    {chore.requires_photo && !done && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">📸</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Approved meal plan summary */}
      {approvedMealPlan && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-gray-700">This Week&apos;s Meals</h2>
            <Link href="/admin/meal-plan" className="text-green-600 text-sm font-medium">View all →</Link>
          </div>
          <p className="text-gray-500 text-sm">
            Week of {formatDateDisplay(approvedMealPlan.week_start_date)} • Approved ✓
          </p>
        </div>
      )}
    </div>
  );
}
