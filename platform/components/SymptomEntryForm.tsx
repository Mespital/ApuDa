"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const presets = ["통증", "피로", "식욕저하", "메스꺼움", "구토", "설사", "변비", "발열", "손발저림", "구내염", "수면문제", "호흡곤란"];

export default function SymptomEntryForm({ profileId }: { profileId: string }) {
  const [symptomName, setSymptomName] = useState("");
  const [severity, setSeverity] = useState("1");
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("symptom_logs").insert({
      profile_id: profileId,
      symptom_name: symptomName,
      severity: Number(severity),
      note: note.trim() || null,
      source: "manual",
      confirmed_by_user: true
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("오늘 상태를 기록했습니다.");
      setSymptomName("");
      setSeverity("1");
      setNote("");
      window.location.reload();
    }

    setSaving(false);
  }

  return (
    <form className="healthForm" onSubmit={submit}>
      <label>
        증상
        <select value={symptomName} onChange={(e) => setSymptomName(e.target.value)} required>
          <option value="">선택해주세요</option>
          {presets.map((name) => <option key={name} value={name}>{name}</option>)}
        </select>
      </label>

      <label>
        불편한 정도
        <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="0">0 · 없음</option>
          <option value="1">1 · 조금 불편함</option>
          <option value="2">2 · 일상에 약간 영향</option>
          <option value="3">3 · 일상에 많이 영향</option>
          <option value="4">4 · 매우 심함</option>
        </select>
      </label>

      <label>
        메모
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="예: 어제보다 심해졌고 오후에 특히 불편했어요." />
      </label>

      <button className="primaryButton" disabled={saving}>
        {saving ? "저장 중..." : "오늘 상태 저장"}
      </button>

      {message && <p className="formMessage">{message}</p>}
    </form>
  );
}
