"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type ProfileValue = {
  id: string;
  display_name: string;
  birth_year: number | null;
  sex_at_birth: string | null;
  relationship_to_user: string;
};

export default function ProfileEditForm({ profile }: { profile: ProfileValue }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.display_name);
  const [birthYear, setBirthYear] = useState(profile.birth_year?.toString() ?? "");
  const [gender, setGender] = useState(profile.sex_at_birth ?? "");
  const [relationship, setRelationship] = useState(profile.relationship_to_user);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName.trim(),
        birth_year: birthYear ? Number(birthYear) : null,
        sex_at_birth: gender || null,
        relationship_to_user:
          profile.relationship_to_user === "self" ? "self" : relationship
      })
      .eq("id", profile.id);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    router.push("/my/profiles");
    router.refresh();
  }

  return (
    <form className="healthForm" onSubmit={submit}>
      <label>
        이름 또는 별칭
        <input
          required
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
        />
      </label>

      <div className="twoCol">
        <label>
          출생연도
          <input
            type="number"
            min="1900"
            max="2100"
            value={birthYear}
            onChange={(event) => setBirthYear(event.target.value)}
          />
        </label>

        <label>
          성별
          <select value={gender} onChange={(event) => setGender(event.target.value)}>
            <option value="">선택 안 함</option>
            <option value="male">남성</option>
            <option value="female">여성</option>
            <option value="other">기타</option>
          </select>
        </label>
      </div>

      {profile.relationship_to_user !== "self" && (
        <label>
          나와의 관계
          <select value={relationship} onChange={(event) => setRelationship(event.target.value)}>
            <option value="mother">어머니</option>
            <option value="father">아버지</option>
            <option value="spouse">배우자</option>
            <option value="child">자녀</option>
            <option value="guardian">보호 대상 가족</option>
            <option value="other">기타 가족</option>
          </select>
        </label>
      )}

      <button className="primaryButton" disabled={saving}>
        {saving ? "저장 중..." : "프로필 저장"}
      </button>
      {message && <p className="formMessage">{message}</p>}
    </form>
  );
}
