"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { getUIString } from "@/lib/ui-strings";

interface HelperNavProps {
  lang: string;
}

export default function HelperNav({ lang }: HelperNavProps) {
  const pathname = usePathname();

  const navItems = [
    { href: "/helper", icon: "✅", key: "tasks", label: getUIString("todaysTasks", lang) },
    { href: "/helper/instructions", icon: "📝", key: "instructions", label: getUIString("instructions", lang) },
    { href: "/helper/pantry-check", icon: "🥫", key: "pantry", label: getUIString("pantryCheck", lang) },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 bottom-nav">
      <div className="max-w-2xl mx-auto flex items-center justify-around py-3">
        {navItems.map(item => {
          const isActive = pathname === item.href || (item.href !== "/helper" && pathname.startsWith(item.href));
          return (
            <Link key={item.href} href={item.href} className={`flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-colors ${isActive ? "text-green-600" : "text-gray-400"}`}>
              <span className="text-2xl">{item.icon}</span>
              <span className={`text-xs font-medium leading-none ${isActive ? "text-green-600" : "text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
