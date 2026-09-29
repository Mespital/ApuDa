"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/my", label: "오늘", icon: "home", exact: true, tone: "blue" },
  { href: "/my/record", label: "기록", icon: "plus", accent: true, tone: "blue" },
  { href: "/my/journal", label: "일기", icon: "journal", tone: "lilac" },
  { href: "/my/timeline", label: "분석", icon: "trend", tone: "mint" },
  { href: "/my/visit-prep", label: "진료", icon: "check", tone: "peach" }
] as const;

function NavIcon({ name }: { name: (typeof items)[number]["icon"] }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {name === "home" && (
        <>
          <path d="M4 10.5 12 4l8 6.5" />
          <path d="M6.5 9.5V20h11V9.5M10 20v-5h4v5" />
        </>
      )}
      {name === "plus" && (
        <>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v8M8 12h8" />
        </>
      )}
      {name === "journal" && (
        <>
          <path d="M6 4h9a3 3 0 0 1 3 3v13H8a2 2 0 0 1-2-2V4Z" />
          <path d="M9 8h6M9 12h6M9 16h4" />
        </>
      )}
      {name === "trend" && (
        <>
          <path d="M5 17 10 12l3 3 6-7" />
          <path d="M15 8h4v4" />
        </>
      )}
      {name === "check" && (
        <>
          <path d="m7 12 3 3 7-8" />
          <circle cx="12" cy="12" r="9" />
        </>
      )}
    </svg>
  );
}

export default function MyBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottomNav" aria-label="My ApuDa 주요 네비게이션">
      {items.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(item.href + "/");

        return (
          <Link
            href={item.href}
            key={item.href}
            className={[
              item.accent ? "recordNav" : "",
              active ? "activeNav" : "",
              `navTone-${item.tone}`
            ].filter(Boolean).join(" ")}
            aria-current={active ? "page" : undefined}
          >
            <span className="bottomNavIcon"><NavIcon name={item.icon} /></span>
            <small>{item.label}</small>
          </Link>
        );
      })}
    </nav>
  );
}
