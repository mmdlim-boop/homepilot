import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDayOfWeek(date: Date = new Date()): number {
  return date.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
}

export function getDayName(dayNum: number): string {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  return days[dayNum] || "Unknown";
}

export function getMonday(date: Date = new Date()): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function formatDateDisplay(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-SG", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function makeRedmartUrl(ingredient: string): string {
  const encoded = encodeURIComponent(ingredient);
  return `https://www.redmart.lazada.sg/catalogsearch/result/?q=${encoded}`;
}

export function makeLazadaUrl(ingredient: string): string {
  const encoded = encodeURIComponent(ingredient + " grocery");
  return `https://www.lazada.sg/catalog/?q=${encoded}`;
}

export const CUISINE_THEME_LABELS: Record<string, string> = {
  western: "Western",
  vegetarian: "Vegetarian",
  chinese_main: "Chinese (Main)",
  chinese_side: "Chinese (Side)",
  noodles: "Noodles",
  indonesian: "Indonesian",
  indian: "Indian",
  baby_breakfast: "Baby Breakfast",
  baby_dinner: "Baby Dinner",
  baby_snack: "Baby Snack",
  other: "Other",
};

export const DAY_THEMES: Record<
  number,
  { label: string; theme: string; themeLabel: string; constraints?: string }
> = {
  1: { label: "Monday", theme: "western", themeLabel: "Western" },
  2: { label: "Tuesday", theme: "vegetarian", themeLabel: "Vegetarian" },
  3: {
    label: "Wednesday",
    theme: "chinese_main",
    themeLabel: "Chinese",
    constraints: "Rice + 2 dishes (1 main + 2 sides)",
  },
  4: { label: "Thursday", theme: "noodles", themeLabel: "Noodles" },
  5: { label: "Friday", theme: "indonesian", themeLabel: "Indonesian" },
};

export const LANGUAGE_OPTIONS = [
  { value: "id", label: "Bahasa Indonesia" },
  { value: "tl", label: "Tagalog (Filipino)" },
  { value: "th", label: "Thai" },
  { value: "my", label: "Burmese" },
  { value: "en", label: "English" },
];

export const DAY_NAMES_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
export const DAY_NAMES_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
