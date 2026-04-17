"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Overview" },
  { href: "/narratives", label: "Narratives" },
  { href: "/posts", label: "Posts" },
  { href: "/analytics", label: "Analytics" },
  { href: "/chat", label: "Chat" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col gap-0.5 px-2">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium tracking-tight transition-colors",
              active
                ? "bg-[color:var(--brand-soft)] text-[color:var(--brand)]"
                : "text-[color:var(--text-secondary)] hover:bg-[color:var(--surface-hover)]"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
