"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const VERSION = "external-ai-2026-09-27-v1";

export default function ExternalAIConsentToggle({
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
      consent_type: "external_ai_processing",
      version: VERSION,
      granted: next,
      granted_at: new Date().toISOString()
    });

    if (error) {
      setMessage(error.message);
    } else {
      setGranted(next);
      setMessage(
        next
          ? "외부 생성형 AI를 이용하는 ApuDa Talk 기능을 사용할 수 있습니다."
          : "외부 생성형 AI 처리 동의를 철회했습니다."
      );
    }

    setSaving(false);
  }

  return (
    <div className="settingCard">
      <div>
        <p className="eyebrow">GENERATIVE AI</p>
        <h3>ApuDa Talk 외부 생성형 AI</h3>
        <p className="mutedText">
          이 옵션이 켜져 있고 서버에 외부 AI 제공자가 설정된 경우에만,
          질문에 필요한 최소화된 건강 맥락을 외부 생성형 AI로 전송합니다.
          이름·생년·원본 사진·원본 음성은 Talk 맥락에 포함하지 않도록 설계합니다.
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
