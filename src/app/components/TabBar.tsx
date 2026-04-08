"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Designer" },
  { href: "/gallery", label: "Gallery" },
] as const;

export default function TabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="grid grid-cols-2 max-w-7xl mx-auto"
      aria-label="Main"
    >
      {TABS.map((tab) => {
        // Treat /?…params… as Designer too. The Designer page reads URL
        // params for initial colors, so we want them to highlight Designer.
        const isActive =
          tab.href === "/"
            ? pathname === "/" || pathname === ""
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={isActive ? "page" : undefined}
            className={`relative flex items-center justify-center px-6 py-6 sm:py-8 text-base sm:text-lg font-semibold transition-colors ${
              isActive
                ? "bg-gray-50 text-gray-900"
                : "bg-white text-gray-400 hover:text-gray-600 hover:bg-gray-50/60 border-b border-gray-200"
            }`}
          >
            {tab.label}
            {isActive && (
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-1 bg-blue-600"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
