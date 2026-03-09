import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  id: "Bahasa Indonesia",
  tl: "Tagalog (Filipino)",
  th: "Thai",
  my: "Burmese (Myanmar)",
};

export async function translateText(
  text: string,
  targetLanguage: string
): Promise<string> {
  if (targetLanguage === "en") return text;
  const langName = LANGUAGE_NAMES[targetLanguage] || targetLanguage;
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: `Translate the following household task instruction to ${langName}.
Keep the translation natural and clear for a domestic helper to understand.
Return ONLY the translated text, no explanation.

Text to translate:
${text}`,
      },
    ],
  });
  const content = message.content[0];
  if (content.type === "text") return content.text.trim();
  return text;
}

export type DayCuisineTheme = {
  day: string;
  dayName: string;
  theme: string;
  themeLabel: string;
  constraints?: string;
};

export async function curateWeeklyMealPlan(
  recipes: Array<{
    id: string;
    title: string;
    cuisine_theme: string;
    source_url?: string;
  }>,
  themes: DayCuisineTheme[],
  useUpIngredients: string
): Promise<Record<string, string[]>> {
  const recipeList = recipes
    .map((r) => `- [${r.id}] ${r.title} (theme: ${r.cuisine_theme})`)
    .join("\n");

  const themeList = themes
    .map(
      (t) =>
        `${t.dayName}: ${t.themeLabel}${t.constraints ? ` (${t.constraints})` : ""}`
    )
    .join("\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `You are a meal planner for a Singapore household.

Weekly cuisine themes:
${themeList}

Available recipes:
${recipeList}

Ingredients to use up from last week: ${useUpIngredients || "none specified"}

Please select one recipe per day that:
1. Matches the cuisine theme for that day
2. Uses up the leftover ingredients where possible
3. Provides variety (don't repeat proteins/styles)
4. For Wednesday Chinese: select 1 main dish + 2 side dishes

Return a JSON object with this exact structure:
{
  "monday": ["recipe_id"],
  "tuesday": ["recipe_id"],
  "wednesday": ["main_recipe_id", "side1_recipe_id", "side2_recipe_id"],
  "thursday": ["recipe_id"],
  "friday": ["recipe_id"],
  "reasoning": "Brief explanation of choices"
}

Return ONLY valid JSON, no markdown code blocks.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("No text response from Claude");

  try {
    return JSON.parse(content.text.trim());
  } catch {
    throw new Error("Failed to parse meal plan from Claude response");
  }
}

export async function generateGroceryList(
  recipes: Array<{
    title: string;
    ingredients_json?: Array<{
      name: string;
      qty?: string;
      is_pantry?: boolean;
    }>;
    steps_en?: string;
    source_url?: string;
  }>
): Promise<
  Array<{
    name: string;
    qty?: string;
    category: string;
    is_pantry: boolean;
    alert?: string;
  }>
> {
  const recipeInfo = recipes
    .map(
      (r) =>
        `Recipe: ${r.title}\nIngredients: ${JSON.stringify(r.ingredients_json || [])}`
    )
    .join("\n\n");

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `Extract and consolidate all ingredients from these recipes into a grocery list for a Singapore household.

Recipes:
${recipeInfo}

Rules:
1. Combine duplicate ingredients (e.g., 2 recipes needing garlic → one entry with combined qty)
2. Categorise each item (produce, meat/seafood, dairy, pantry, spices/seasonings, frozen, other)
3. Mark as is_pantry=true: spices, seasonings, sauces, oil, dried goods that are usually stocked
4. Mark as is_pantry=false: fresh produce, meat, seafood, dairy — things you must buy
5. Add alert="hard to find" for unusual ingredients that may not be on RedMart
6. Keep names simple and searchable (e.g. "chicken thighs" not "bone-in skin-on chicken thighs")

Return a JSON array:
[
  {"name": "chicken thighs", "qty": "600g", "category": "meat/seafood", "is_pantry": false},
  {"name": "oyster sauce", "qty": "1 bottle", "category": "spices/seasonings", "is_pantry": true},
  ...
]

Return ONLY valid JSON array, no markdown.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("No text response");
  try {
    return JSON.parse(content.text.trim());
  } catch {
    throw new Error("Failed to parse grocery list");
  }
}

export async function extractRecipeSteps(sourceUrl: string): Promise<{
  title: string;
  ingredients: Array<{ name: string; qty?: string; is_pantry?: boolean }>;
  steps: string;
}> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: `I have a recipe from this URL: ${sourceUrl}

Based on the URL (which is likely an Instagram reel), please provide a reasonable recipe structure for the dish named in the URL.
If you cannot determine the recipe, make a reasonable standard version.

Return JSON:
{
  "title": "Recipe name",
  "ingredients": [{"name": "...", "qty": "...", "is_pantry": false}],
  "steps": "Step 1: ...\nStep 2: ..."
}

Return ONLY valid JSON.`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== "text") throw new Error("No text response");
  try {
    return JSON.parse(content.text.trim());
  } catch {
    throw new Error("Failed to parse recipe");
  }
}
