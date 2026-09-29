"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ProfileAccountMenu({
  displayName
}: {
  displayName: string;
}) {
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="accountMenu" ref={rootRef}>
      <button
        type="button"
        className="myGlobalProfile"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span>{displayName.slice(0, 1)}</span>
        <div>
          <small>프로필</small>
          <b>{displayName}</b>
        </div>
        <svg className="accountMenuChevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m8 10 4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="accountMenuPopover" role="menu">
          <div className="accountMenuSummary">
            <span>{displayName.slice(0, 1)}</span>
            <div>
              <small>현재 프로필</small>
              <strong>{displayName}</strong>
            </div>
          </div>

          <div className="accountMenuGroup">
            <Link href="/my/profiles" role="menuitem" onClick={() => setOpen(false)}>
              <span>프로필 관리</span>
              <b>›</b>
            </Link>
            <Link href="/my/settings/privacy" role="menuitem" onClick={() => setOpen(false)}>
              <span>개인정보 · 동의</span>
              <b>›</b>
            </Link>
            <Link href="/my/settings/data" role="menuitem" onClick={() => setOpen(false)}>
              <span>내 데이터</span>
              <b>›</b>
            </Link>
            <Link href="/my/settings/system" role="menuitem" onClick={() => setOpen(false)}>
              <span>시스템 상태</span>
              <b>›</b>
            </Link>
          </div>

          <div className="accountMenuGroup">
            <a href="https://apuda.app" role="menuitem">
              <span>ApuDa 홈페이지</span>
              <b>↗</b>
            </a>
          </div>

          <button
            type="button"
            className="accountMenuLogout"
            role="menuitem"
            disabled={signingOut}
            onClick={signOut}
          >
            {signingOut ? "로그아웃 중..." : "로그아웃"}
          </button>
        </div>
      )}
    </div>
  );
}
