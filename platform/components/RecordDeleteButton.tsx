"use client";

import { useState } from "react";

type RecordEntity =
  | "condition"
  | "treatment"
  | "medication"
  | "lab"
  | "symptom"
  | "appointment"
  | "biomarker"
  | "imaging"
  | "visit_question";

export default function RecordDeleteButton({
  entity,
  id,
  label = "삭제"
}: {
  entity: RecordEntity;
  id: string;
  label?: string;
}) {
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  async function remove() {
    const confirmed = window.confirm(
      "이 기록을 삭제할까요? 삭제한 기록은 현재 앱에서 복구할 수 없습니다."
    );
    if (!confirmed) return;

    setDeleting(true);
    setMessage("");

    try {
      const response = await fetch("/api/records/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entity, id })
      });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(body?.error || "삭제하지 못했습니다.");
      }

      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "삭제하지 못했습니다.");
      setDeleting(false);
    }
  }

  return (
    <span className="recordDeleteWrap">
      <button
        className="textButton dangerTextButton"
        type="button"
        disabled={deleting}
        onClick={() => void remove()}
      >
        {deleting ? "삭제 중..." : label}
      </button>
      {message && <small className="formMessage">{message}</small>}
    </span>
  );
}
