"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/my", label: "오늘", icon: "⌂", exact: true },
  { href: "/my/record", label: "기록", icon: "＋", accent: true },
  { href: "/my/timeline", label: "분석", icon: "↗" },
  { href: "/my/visit-prep", label: "진료준비", icon: "✓" },
  { href: "/my/profiles", label: "프로필", icon: "MY" }
];

export default function MyBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottomNav" aria-label="My ApuDa navigation">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            href={item.href}
            key={item.href}
            className={`${item.accent ? "recordNav" : ""} ${active ? "activeNav" : ""}`.trim()}
            aria-current={active ? "page" : undefined}
          >
            <span>{item.icon}</span>
            <small>{item.label}</small>
          </Link>
        );
      })}
    </nav>
  );
}
