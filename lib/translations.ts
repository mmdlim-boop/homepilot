// SERVER-SIDE ONLY — do not import this in client components
// For client-safe UI strings, import from @/lib/ui-strings instead
import { createClient } from "@supabase/supabase-js";
import { translateText } from "@/lib/anthropic";

// Cached translation — checks DB first, falls back to Claude API
export async function getCachedTranslation(
  text: string,
  language: string
): Promise<string> {
  if (language === "en") return text;

  // Use direct Supabase client (no cookies needed in API/server contexts)
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Check cache
  const { data: cached } = await supabase
    .from("translations")
    .select("translated_text")
    .eq("source_text", text)
    .eq("language", language)
    .single();

  if (cached) return cached.translated_text;

  // Translate via Claude
  const translated = await translateText(text, language);

  // Store in cache
  await supabase
    .from("translations")
    .upsert({ source_text: text, language, translated_text: translated });

  return translated;
}
