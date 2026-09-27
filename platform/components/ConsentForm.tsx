"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const CONSENT_VERSION = "2026-09-27-v1";

export default function ConsentForm({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [healthConsent, setHealthConsent] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!healthConsent) {
      setMessage("건강기록 저장을 사용하려면 건강정보 처리 동의가 필요합니다.");
      return;
    }

    setSaving(true);
    setMessage("");

    const supabase = createClient();

    const rows = [
      {
        profile_id: profileId,
        consent_type: "health_data_processing",
        version: CONSENT_VERSION,
        granted: true,
        granted_at: new Date().toISOString()
      },
      {
        profile_id: profileId,
        consent_type: "ai_assisted_processing",
        version: CONSENT_VERSION,
        granted: aiConsent,
        granted_at: new Date().toISOString()
      }
    ];

    const { error } = await supabase.from("consents").insert(rows);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    router.push("/my");
    router.refresh();
  }

  return (
    <form className="healthForm" onSubmit={submit}>
      <label className="consentCheck">
        <input
          type="checkbox"
          checked={healthConsent}
          onChange={(event) => setHealthConsent(event.target.checked)}
        />
        <span>
          <strong>건강정보 처리에 동의합니다. (필수)</strong>
          <small>
            검사, 증상, 치료, 복약, 일정 등 사용자가 직접 등록한 건강기록을
            ApuDa 기능 제공을 위해 저장·처리합니다.
          </small>
        </span>
      </label>

      <label className="consentCheck">
        <input
          type="checkbox"
          checked={aiConsent}
          onChange={(event) => setAiConsent(event.target.checked)}
        />
        <span>
          <strong>AI 보조 입력 처리에 동의합니다. (선택)</strong>
          <small>
            검사사진 OCR, 음성 STT처럼 사용자가 요청한 AI 보조 입력 기능에서
            필요한 파일을 일시적으로 처리합니다. 저장 전 결과를 직접 확인합니다.
          </small>
        </span>
      </label>

      <div className="notice">
        이 화면은 Beta용 동의 UX입니다. 실제 공개 서비스 전에는 개인정보처리방침,
        이용약관, 보유기간, 위탁/국외처리 여부 등 법률 검토된 문구로 교체해야 합니다.
      </div>

      <button className="primaryButton" disabled={saving}>
        {saving ? "저장 중..." : "동의하고 계속"}
      </button>

      {message && <p className="formMessage">{message}</p>}
    </form>
  );
}
