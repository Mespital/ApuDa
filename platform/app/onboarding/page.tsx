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
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setMessage("Supabase 연결이 필요합니다.");
      return;
    }

    const supabase = createClient();
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.push("/login");
      return;
    }

    const { error } = await supabase.from("profiles").insert({
      owner_user_id: authData.user.id,
      display_name: displayName,
      birth_year: birthYear ? Number(birthYear) : null,
      sex_at_birth: sexAtBirth || null,
      relationship_to_user: "self",
      profile_type: "human"
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push("/my");
    router.refresh();
  }

  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">MY APUDA</p>
        <h1>내 건강 프로필을 만들어요.</h1>
        <p className="authLead">
          필요한 정보부터 조금씩 받습니다. 상세한 질환·치료 정보는 나중에
          추가할 수 있어요.
        </p>

        <form onSubmit={submit} className="authForm">
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
            <select
              value={sexAtBirth}
              onChange={(event) => setSexAtBirth(event.target.value)}
            >
              <option value="">선택하지 않음</option>
              <option value="male">남성</option>
              <option value="female">여성</option>
              <option value="other">기타 / 직접 관리</option>
            </select>
          </label>

          <button className="primaryButton wideButton">프로필 만들기</button>
        </form>

        {message && <p className="formMessage">{message}</p>}
      </section>
    </main>
  );
}
