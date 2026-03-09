"use client";
import { useState } from "react";
import { makeRedmartUrl, makeLazadaUrl, formatDateDisplay } from "@/lib/utils";

interface GroceryItem {
  name: string;
  qty?: string;
  category: string;
  is_pantry: boolean;
  have_confirmed?: boolean;
  redmart_url?: string;
  lazada_url?: string;
  alert?: string;
}

interface GroceryList {
  id: string;
  items_json: GroceryItem[];
}

interface MealPlan {
  id: string;
  week_start_date: string;
  status: string;
}

export default function GroceryListClient({
  groceryList,
  mealPlan,
  householdId,
}: {
  groceryList: GroceryList | null;
  mealPlan: MealPlan | null;
  householdId: string;
}) {
  const [items, setItems] = useState<GroceryItem[]>(groceryList?.items_json || []);
  const [pantryConfirm, setPantryConfirm] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState(false);

  if (!mealPlan) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Grocery List</h1>
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <div className="text-4xl mb-3">🛒</div>
          <p className="text-gray-500">No approved meal plan yet.</p>
          <p className="text-gray-400 text-sm mt-1">Approve a meal plan to generate your grocery list.</p>
          <a href="/admin/meal-plan" className="inline-block mt-4 bg-green-600 text-white px-6 py-2 rounded-xl text-sm font-semibold hover:bg-green-700 transition-colors">
            Go to Meal Plan →
          </a>
        </div>
      </div>
    );
  }

  const buyItems = items.filter(i => !i.is_pantry);
  const pantryItems = items.filter(i => i.is_pantry);
  const alertItems = items.filter(i => i.alert);
  const categories = [...new Set(buyItems.map(i => i.category))].sort();

  async function copyList() {
    const text = buyItems
      .map(i => `• ${i.name}${i.qty ? ` (${i.qty})` : ""}`)
      .join("\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Grocery List</h1>
          <p className="text-gray-500 text-sm mt-1">
            Week of {formatDateDisplay(mealPlan.week_start_date)}
          </p>
        </div>
        <button
          onClick={copyList}
          className="bg-gray-100 text-gray-600 px-3 py-2 rounded-xl text-sm font-medium hover:bg-gray-200 transition-colors"
        >
          {copied ? "Copied! ✓" : "📋 Copy"}
        </button>
      </div>

      {/* Alerts */}
      {alertItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <p className="text-amber-800 font-semibold text-sm mb-2">⚠️ May be hard to find on RedMart:</p>
          <ul className="space-y-1">
            {alertItems.map(i => (
              <li key={i.name} className="text-amber-700 text-sm">• {i.name} {i.qty && `(${i.qty})`} — {i.alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Buy items by category */}
      {categories.map(cat => {
        const catItems = buyItems.filter(i => i.category === cat);
        return (
          <div key={cat}>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 capitalize">{cat}</h2>
            <div className="space-y-2">
              {catItems.map(item => (
                <div key={item.name} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-800 text-sm">{item.name}</span>
                      {item.qty && <span className="text-xs text-gray-400">{item.qty}</span>}
                      {item.alert && <span className="text-xs bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded">⚠️</span>}
                    </div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <a
                      href={item.redmart_url || makeRedmartUrl(item.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-100 text-green-700 text-xs px-2 py-1.5 rounded-lg font-medium hover:bg-green-200 transition-colors"
                    >
                      RedMart
                    </a>
                    <a
                      href={item.lazada_url || makeLazadaUrl(item.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-orange-100 text-orange-700 text-xs px-2 py-1.5 rounded-lg font-medium hover:bg-orange-200 transition-colors"
                    >
                      Lazada
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      {/* Pantry items — confirm section */}
      {pantryItems.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pantry / Spices — Confirm You Have These
          </h2>
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50">
            {pantryItems.map(item => {
              const confirmed = pantryConfirm[item.name];
              return (
                <div key={item.name} className="flex items-center gap-3 px-4 py-3">
                  <button
                    onClick={() => setPantryConfirm(p => ({ ...p, [item.name]: !p[item.name] }))}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                      confirmed === true ? "bg-green-500 border-green-500" : "border-gray-300"
                    }`}
                  >
                    {confirmed === true && <span className="text-white text-sm">✓</span>}
                  </button>
                  <span className="text-sm text-gray-700 flex-1">{item.name}</span>
                  {item.qty && <span className="text-xs text-gray-400">{item.qty}</span>}
                  {!confirmed && (
                    <a
                      href={makeRedmartUrl(item.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-green-600 hover:text-green-700"
                    >
                      Search →
                    </a>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {Object.values(pantryConfirm).filter(Boolean).length} of {pantryItems.length} confirmed
          </p>
        </div>
      )}

      {items.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
          <p className="text-gray-400">No grocery list yet. Approve the meal plan to generate one.</p>
        </div>
      )}
    </div>
  );
}
