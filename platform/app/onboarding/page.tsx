"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function OnboardingPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [sexAtBirth, setSexAtBirth] = useState("");
  const [relationship, setRelationship] = useState("self");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setMessage("Supabase 연결이 필요합니다.");
      return;
    }

    setSaving(true);
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
        relationship_to_user: relationship,
        profile_type: "human"
      })
      .select("id")
      .single();

    if (error || !data) {
      setMessage(error?.message ?? "프로필을 만들지 못했습니다.");
      setSaving(false);
      return;
    }

    await fetch("/api/profile/active", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId: data.id })
    });

    router.push("/my");
    router.refresh();
  }

  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">MY APUDA PROFILE</p>
        <h1>건강 프로필을 만들어요.</h1>
        <p className="authLead">
          내 프로필뿐 아니라 가족 프로필도 같은 ApuDa ID에서 관리할 수
          있습니다. 필요한 정보부터 조금씩 추가해요.
        </p>

        <form onSubmit={submit} className="authForm">
          <label>
            누구의 프로필인가요?
            <select value={relationship} onChange={(event) => setRelationship(event.target.value)}>
              <option value="self">나</option>
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
              placeholder="예: 김아프다"
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
            출생 시 성별
            <select value={sexAtBirth} onChange={(event) => setSexAtBirth(event.target.value)}>
              <option value="">선택하지 않음</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타 / 직접 관리</option>
            </select>
          </label>

          <button className="primaryButton wideButton" disabled={saving}>
            {saving ? "만드는 중..." : "프로필 만들기"}
          </button>
        </form>

        {message && <p className="formMessage">{message}</p>}
      </section>
    </main>
  );
}
