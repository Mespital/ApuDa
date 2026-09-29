"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

const HEALTH_CONSENT_VERSION = "health-data-2026-09-27-v1";
const AI_CONSENT_VERSION = "ai-input-2026-09-27-v1";
const DEFAULT_NICKNAMES = ["다행이다.", "아프다.", "ApuDa"] as const;

export default function OnboardingForm({
  isAdditional = false
}: {
  isAdditional?: boolean;
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [sexAtBirth, setSexAtBirth] = useState("");
  const [relationship, setRelationship] = useState(isAdditional ? "" : "self");
  const [healthConsented, setHealthConsented] = useState(false);
  const [aiConsented, setAiConsented] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdditional && !displayName) {
      const nickname =
        DEFAULT_NICKNAMES[Math.floor(Math.random() * DEFAULT_NICKNAMES.length)];
      setDisplayName(nickname);
    }
  }, [isAdditional, displayName]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setMessage("Supabase 연결이 필요합니다.");
      return;
    }

    if (!healthConsented) {
      setMessage("건강정보 저장 및 처리 동의를 확인해 주세요.");
      return;
    }

    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push("/login");
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .insert({
        owner_user_id: authData.user.id,
        display_name: displayName.trim(),
        birth_year: birthYear ? Number(birthYear) : null,
        sex_at_birth: sexAtBirth || null,
        relationship_to_user: relationship || "other",
        profile_type: "human"
      })
      .select("id")
      .single();

    if (error || !data) {
      if (!isAdditional && error?.code === "23505") {
        router.push("/my");
        router.refresh();
        return;
      }
      setMessage(error?.message ?? "프로필을 만들지 못했습니다.");
      setSaving(false);
      return;
    }

    const { error: consentError } = await supabase.from("consents").insert([
      {
        profile_id: data.id,
        consent_type: "health_data_processing",
        version: HEALTH_CONSENT_VERSION,
        granted: true,
        granted_at: new Date().toISOString()
      },
      {
        profile_id: data.id,
        consent_type: "ai_assisted_processing",
        version: AI_CONSENT_VERSION,
        granted: aiConsented,
        granted_at: new Date().toISOString()
      }
    ]);

    if (consentError) {
      await supabase.from("profiles").delete().eq("id", data.id);
      setMessage("동의 기록을 저장하지 못해 프로필 생성을 취소했습니다. 다시 시도해 주세요.");
      setSaving(false);
      return;
    }

    await fetch("/api/profile/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: data.id })
    });

    router.push(isAdditional ? "/my/profiles" : "/my");
    router.refresh();
  }

  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">MY APUDA PROFILE</p>
        <h1>{isAdditional ? "가족 프로필을 추가해요." : "건강 프로필을 만들어요."}</h1>
        <p className="authLead">
          내 프로필뿐 아니라 관리 권한이 있는 가족 프로필도 같은 ApuDa ID에서
          각각 분리해 관리할 수 있습니다.
        </p>

        <form onSubmit={submit} className="authForm">
          <label>
            누구의 프로필인가요?
            <select required value={relationship} onChange={(event) => setRelationship(event.target.value)}>
              {isAdditional ? (
                <option value="">관계를 선택하세요</option>
              ) : (
                <option value="self">나</option>
              )}
              <option value="mother">어머니</option>
              <option value="father">아버지</option>
              <option value="spouse">배우자</option>
              <option value="child">자녀</option>
              <option value="guardian">보호 대상 가족</option>
              <option value="other">기타 가족</option>
            </select>
          </label>

          <label>
            이름 또는 별칭
            <input
              required
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder={isAdditional ? "예: 엄마, 아빠" : "닉네임을 입력하세요"}
            />
          </label>

          <label>
            출생연도
            <input
              type="number"
              min="1900"
              max="2100"
              value={birthYear}
              onChange={(event) => setBirthYear(event.target.value)}
              placeholder="예: 1980"
            />
          </label>

          <label>
            성별
            <select value={sexAtBirth} onChange={(event) => setSexAtBirth(event.target.value)}>
              <option value="">선택 안 함</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타 / 직접 관리</option>
            </select>
          </label>

          <label className="consentCheck">
            <input
              type="checkbox"
              checked={healthConsented}
              onChange={(event) => setHealthConsented(event.target.checked)}
              required
            />
            <span>
              <strong>건강정보 저장 및 처리에 동의합니다. (필수)</strong>
              <small>
                본인 또는 관리 권한이 있는 가족의 검사·증상·치료·복약·일정 기록을
                ApuDa 기능 제공을 위해 저장·처리합니다.
              </small>
            </span>
          </label>

          <label className="consentCheck">
            <input
              type="checkbox"
              checked={aiConsented}
              onChange={(event) => setAiConsented(event.target.checked)}
            />
            <span>
              <strong>AI 보조 입력 처리에 동의합니다. (선택)</strong>
              <small>
                검사사진 OCR과 음성 STT 사용 시 원본 파일을 일시 처리합니다.
                인식 결과는 사용자가 확인하기 전 건강기록으로 저장하지 않습니다.
              </small>
            </span>
          </label>

          <p className="safetyNote">
            <Link href="/privacy" target="_blank">건강정보 처리 안내 보기</Link>
          </p>

          <button className="primaryButton wideButton" disabled={saving || !healthConsented}>
            {saving ? "만드는 중..." : "프로필 만들기"}
          </button>
        </form>

        {message && <p className="formMessage">{message}</p>}
      </section>
    </main>
  );
}
