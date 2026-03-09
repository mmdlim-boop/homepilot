"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

interface AdminNavProps {
  displayName: string;
}

export default function AdminNav({ displayName }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const navItems = [
    { href: "/admin", icon: "🏠", label: "Home" },
    { href: "/admin/chores", icon: "✅", label: "Chores" },
    { href: "/admin/instructions", icon: "📝", label: "Send" },
    { href: "/admin/meal-plan", icon: "🍽️", label: "Meals" },
    { href: "/admin/grocery", icon: "🛒", label: "Grocery" },
    { href: "/admin/settings", icon: "⚙️", label: "Settings" },
  ];

  return (
    <>
      {/* Top bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm">🏠</span>
          </div>
          <span className="font-bold text-gray-900">HomePilot</span>
          <span className="text-xs text-gray-400 ml-1">Admin</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{displayName}</span>
          <button
            onClick={handleSignOut}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 bottom-nav">
        <div className="max-w-5xl mx-auto flex items-center justify-around py-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${isActive ? "text-green-600" : "text-gray-400"}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className={`text-xs font-medium ${isActive ? "text-green-600" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom spacer */}
      <div className="h-16" />
    </>
  );
}
