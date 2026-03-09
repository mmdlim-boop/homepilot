"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { LANGUAGE_OPTIONS, DAY_NAMES_FULL, CUISINE_THEME_LABELS } from "@/lib/utils";

interface Household {
  id: string;
  name: string;
  meal_plan_day: number;
  photo_proof_days: number;
  timezone: string;
}

interface HelperProfile {
  id: string;
  display_name: string;
  email?: string;
  language: string;
}

export default function SettingsPage() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [helper, setHelper] = useState<HelperProfile | null>(null);
  const [recipes, setRecipes] = useState<Array<{ id: string; title: string; cuisine_theme: string; source_url: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<"household" | "helper" | "recipes" | "invite">("household");
  // Add recipe form
  const [newRecipeTitle, setNewRecipeTitle] = useState("");
  const [newRecipeTheme, setNewRecipeTheme] = useState("western");
  const [newRecipeUrl, setNewRecipeUrl] = useState("");
  const [addingRecipe, setAddingRecipe] = useState(false);
  // Invite helper
  const [helperEmail, setHelperEmail] = useState("");
  const [helperName, setHelperName] = useState("");
  const [helperPassword, setHelperPassword] = useState("");
  const [helperLang, setHelperLang] = useState("id");
  const [creatingHelper, setCreatingHelper] = useState(false);
  const [helperCreated, setHelperCreated] = useState(false);
  const supabase = createClient();

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("household_id").eq("id", user.id).single();
    if (!profile?.household_id) return;

    const { data: hh } = await supabase.from("households").select("*").eq("id", profile.household_id).single();
    setHousehold(hh);

    const { data: helperData } = await supabase.from("profiles").select("id, display_name, language").eq("household_id", profile.household_id).eq("role", "helper").single();
    setHelper(helperData);

    const { data: recs } = await supabase.from("recipes").select("id, title, cuisine_theme, source_url").eq("household_id", profile.household_id).eq("is_active", true).order("cuisine_theme").order("title");
    setRecipes(recs || []);
    setLoading(false);
  }

  async function saveHousehold() {
    if (!household) return;
    setSaving(true);
    await supabase.from("households").update({
      name: household.name,
      meal_plan_day: household.meal_plan_day,
      photo_proof_days: household.photo_proof_days,
    }).eq("id", household.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  async function saveHelper() {
    if (!helper) return;
    setSaving(true);
    await supabase.from("profiles").update({ display_name: helper.display_name, language: helper.language }).eq("id", helper.id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    setSaving(false);
  }

  async function addRecipe() {
    if (!newRecipeTitle.trim() || !household) return;
    setAddingRecipe(true);
    await supabase.from("recipes").insert({
      household_id: household.id,
      title: newRecipeTitle.trim(),
      cuisine_theme: newRecipeTheme,
      source_url: newRecipeUrl.trim() || null,
    });
    setNewRecipeTitle("");
    setNewRecipeUrl("");
    setAddingRecipe(false);
    loadData();
  }

  async function deleteRecipe(id: string) {
    await supabase.from("recipes").update({ is_active: false }).eq("id", id);
    setRecipes(prev => prev.filter(r => r.id !== id));
  }

  async function createHelperAccount() {
    if (!household || !helperEmail || !helperPassword) return;
    setCreatingHelper(true);
    const response = await fetch("/api/admin/create-helper", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: helperEmail,
        password: helperPassword,
        displayName: helperName,
        language: helperLang,
        householdId: household.id,
      }),
    });
    if (response.ok) {
      setHelperCreated(true);
      loadData();
    }
    setCreatingHelper(false);
  }

  if (loading) return <div className="flex justify-center items-center h-64 text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>

      {/* Tab switcher */}
      <div className="flex gap-2 flex-wrap">
        {(["household", "helper", "recipes", "invite"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors capitalize ${tab === t ? "bg-green-600 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}>
            {t === "invite" ? "Invite Helper" : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Household settings */}
      {tab === "household" && household && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-800">Household Settings</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Household name</label>
            <input value={household.name} onChange={e => setHousehold({...household, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Meal planning day</label>
            <select value={household.meal_plan_day} onChange={e => setHousehold({...household, meal_plan_day: Number(e.target.value)})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {DAY_NAMES_FULL.map((day, i) => <option key={i} value={i}>{day}</option>)}
            </select>
            <p className="text-xs text-gray-400 mt-1">Helper gets pantry check notification on this day</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo proof period (days)</label>
            <input type="number" min="0" max="365" value={household.photo_proof_days} onChange={e => setHousehold({...household, photo_proof_days: Number(e.target.value)})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
            <p className="text-xs text-gray-400 mt-1">Photo proof auto-required for first N days (0 = manual control)</p>
          </div>
          {saved && <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg">✓ Saved</div>}
          <button onClick={saveHousehold} disabled={saving} className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors text-sm">
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      )}

      {/* Helper settings */}
      {tab === "helper" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-800">Helper Account</h2>
          {helper ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Helper&apos;s name</label>
                <input value={helper.display_name || ""} onChange={e => setHelper({...helper, display_name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Language for notifications</label>
                <select value={helper.language} onChange={e => setHelper({...helper, language: e.target.value})} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {LANGUAGE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              {saved && <div className="bg-green-50 text-green-700 text-sm px-4 py-2 rounded-lg">✓ Saved</div>}
              <button onClick={saveHelper} disabled={saving} className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors text-sm">
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <p className="text-gray-400 text-sm">No helper account yet. Go to &quot;Invite Helper&quot; tab to create one.</p>
          )}
        </div>
      )}

      {/* Recipes */}
      {tab === "recipes" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
            <h2 className="font-semibold text-gray-800">Add Recipe</h2>
            <input value={newRecipeTitle} onChange={e => setNewRecipeTitle(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Recipe name" />
            <select value={newRecipeTheme} onChange={e => setNewRecipeTheme(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
              {Object.entries(CUISINE_THEME_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
            </select>
            <input value={newRecipeUrl} onChange={e => setNewRecipeUrl(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Recipe URL (Instagram/YouTube, optional)" />
            <button onClick={addRecipe} disabled={addingRecipe || !newRecipeTitle.trim()} className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors text-sm">
              {addingRecipe ? "Adding..." : "+ Add Recipe"}
            </button>
          </div>
          <div className="space-y-2">
            {Object.entries(
              recipes.reduce((acc, r) => { if (!acc[r.cuisine_theme]) acc[r.cuisine_theme] = []; acc[r.cuisine_theme].push(r); return acc; }, {} as Record<string, typeof recipes>)
            ).map(([theme, themeRecipes]) => (
              <div key={theme}>
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide my-2">{CUISINE_THEME_LABELS[theme] || theme}</h3>
                {themeRecipes.map(r => (
                  <div key={r.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-2 mb-2">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{r.title}</p>
                      {r.source_url && <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-500 hover:underline">View recipe</a>}
                    </div>
                    <button onClick={() => deleteRecipe(r.id)} className="text-gray-300 hover:text-red-400 text-sm transition-colors">✕</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite helper */}
      {tab === "invite" && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
          <h2 className="font-semibold text-gray-800">Create Helper Account</h2>
          <p className="text-sm text-gray-500">Create login credentials for your helper. She can use these to sign into HomePilot on her phone.</p>
          {helperCreated ? (
            <div className="bg-green-50 text-green-700 p-4 rounded-xl text-sm">
              ✓ Helper account created! Share the email and password with her so she can log in.
            </div>
          ) : (
            <>
              <input value={helperName} onChange={e => setHelperName(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Helper's name (e.g. Sari)" />
              <input type="email" value={helperEmail} onChange={e => setHelperEmail(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Helper's email address" />
              <input type="password" value={helperPassword} onChange={e => setHelperPassword(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500" placeholder="Password for helper (min 8 chars)" />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notification language</label>
                <select value={helperLang} onChange={e => setHelperLang(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500">
                  {LANGUAGE_OPTIONS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <button onClick={createHelperAccount} disabled={creatingHelper || !helperEmail || !helperPassword} className="w-full bg-green-600 text-white py-2.5 rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors text-sm">
                {creatingHelper ? "Creating..." : "Create Helper Account"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
