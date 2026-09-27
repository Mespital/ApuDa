"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AI_CONSENT_VERSION = "ai-input-2026-09-27-v1";

export default function AIConsentToggle({
  profileId,
  initialGranted
}: {
  profileId: string;
  initialGranted: boolean;
}) {
  const [granted, setGranted] = useState(initialGranted);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function change(next: boolean) {
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("consents").insert({
      profile_id: profileId,
      consent_type: "ai_assisted_processing",
      version: AI_CONSENT_VERSION,
      granted: next,
      granted_at: new Date().toISOString()
    });

    if (error) {
      setMessage(error.message);
    } else {
      setGranted(next);
      setMessage(next ? "AI 보조 입력을 사용할 수 있습니다." : "AI 보조 입력 동의를 철회했습니다.");
    }

    setSaving(false);
  }

  return (
    <div className="settingCard">
      <div>
        <p className="eyebrow">AI INPUT</p>
        <h3>검사사진·음성 AI 보조 입력</h3>
        <p className="mutedText">
          사진 OCR과 음성 STT를 사용할 때만 원본 파일을 임시 처리합니다.
          결과는 사용자가 확인한 뒤에만 건강기록으로 저장합니다.
        </p>
      </div>

      <div className="settingAction">
        <span className={granted ? "statusPill positivePill" : "statusPill"}>
          {granted ? "동의함" : "사용 안 함"}
        </span>
        <button
          type="button"
          className={granted ? "secondaryButton" : "primaryButton"}
          disabled={saving}
          onClick={() => void change(!granted)}
        >
          {saving ? "저장 중..." : granted ? "동의 철회" : "동의하고 사용"}
        </button>
      </div>

      {message && <p className="formMessage">{message}</p>}
    </div>
  );
}
