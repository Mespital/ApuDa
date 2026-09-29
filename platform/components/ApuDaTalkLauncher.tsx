"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ApuDaTalkPanel from "@/components/ApuDaTalkPanel";

export default function ApuDaTalkLauncher({ profileId }: { profileId: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="aiFab"
        aria-label="ApuDa Talk 열기"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span>✦</span>
        <b>ApuDa Talk</b>
      </button>

      {open && (
        <div className="talkOverlay" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="talkDrawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="apuda-talk-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header className="talkDrawerHeader">
              <div>
                <p className="eyebrow">APUDA TALK</p>
                <h2 id="apuda-talk-title">내 기록을 함께 정리해요.</h2>
              </div>
              <button
                type="button"
                className="talkCloseButton"
                aria-label="ApuDa Talk 닫기"
                onClick={() => setOpen(false)}
              >
                ×
              </button>
            </header>

            <ApuDaTalkPanel profileId={profileId} compact />

            <div className="talkDrawerFooter">
              <Link href="/my/ai" onClick={() => setOpen(false)}>
                전체 화면에서 보기
              </Link>
              <span>진단·처방을 대신하지 않습니다.</span>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
