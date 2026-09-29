"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DataControls({
  profileId,
  displayName
}: {
  profileId: string;
  displayName: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function removeProfile() {
    const confirmation = window.prompt(
      `프로필과 연결된 건강기록을 삭제하려면 "${displayName}"을 입력해 주세요.`
    );

    if (confirmation !== displayName) {
      if (confirmation !== null) {
        setMessage("입력한 이름이 일치하지 않아 삭제하지 않았습니다.");
      }
      return;
    }

    const finalConfirm = window.confirm(
      "삭제하면 이 프로필의 질환·치료·검사·증상·복약·일정 기록이 함께 삭제됩니다. 계속할까요?"
    );

    if (!finalConfirm) return;

    setDeleting(true);
    setMessage("");

    const response = await fetch(`/api/profile/${encodeURIComponent(profileId)}`, {
      method: "DELETE"
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(body?.error || "프로필을 삭제하지 못했습니다.");
      setDeleting(false);
      return;
    }

    router.push("/my/profiles");
    router.refresh();
  }

  return (
    <div className="dataControls">
      <a
        className="secondaryLink"
        href={`/api/profile/${encodeURIComponent(profileId)}/export`}
      >
        내 기록 JSON 내보내기
      </a>

      <button
        type="button"
        className="dangerOutlineButton"
        disabled={deleting}
        onClick={() => void removeProfile()}
      >
        {deleting ? "삭제 중..." : "이 프로필과 기록 삭제"}
      </button>

      {message && <p className="formMessage">{message}</p>}
    </div>
  );
}
