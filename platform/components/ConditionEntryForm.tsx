"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ConditionEntryForm({ profileId }: { profileId: string }) {
  const [name, setName] = useState("");
  const [diagnosedOn, setDiagnosedOn] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("conditions").insert({
      profile_id: profileId,
      name: name.trim(),
      diagnosed_on: diagnosedOn || null,
      notes: notes.trim() || null
    });
    if (error) setMessage(error.message);
    else window.location.reload();
    setSaving(false);
  }

  return (
    <form className="healthForm" onSubmit={submit}>
      <label>
        질환명
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 위암, 고혈압" />
      </label>
      <label>
        진단일
        <input type="date" value={diagnosedOn} onChange={(e) => setDiagnosedOn(e.target.value)} />
      </label>
      <label>
        메모
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="병기, 조직형 등 필요한 내용을 직접 기록할 수 있어요." />
      </label>
      <button className="primaryButton" disabled={saving}>{saving ? "저장 중..." : "질환 저장"}</button>
      {message && <p className="formMessage">{message}</p>}
    </form>
  );
}
