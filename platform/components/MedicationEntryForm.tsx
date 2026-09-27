"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ConditionOption = { id: string; name: string };

export default function MedicationEntryForm({
  profileId,
  conditions = []
}: {
  profileId: string;
  conditions?: ConditionOption[];
}) {
  const [conditionId, setConditionId] = useState("");
  const [name, setName] = useState("");
  const [dose, setDose] = useState("");
  const [frequency, setFrequency] = useState("");
  const [route, setRoute] = useState("");
  const [startedOn, setStartedOn] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("medications").insert({
      profile_id: profileId,
      condition_id: conditionId || null,
      name: name.trim(),
      dose_text: dose.trim() || null,
      frequency_text: frequency.trim() || null,
      route: route.trim() || null,
      started_on: startedOn || null,
      active: true,
      notes: notes.trim() || null
    });

    if (error) {
      setMessage(error.message);
    } else {
      window.location.reload();
    }

    setSaving(false);
  }

  return (
    <form className="healthForm" onSubmit={submit}>
      {conditions.length > 0 && (
        <label>
          연결할 질환
          <select value={conditionId} onChange={(e) => setConditionId(e.target.value)}>
            <option value="">선택하지 않음 / 공통</option>
            {conditions.map((condition) => (
              <option value={condition.id} key={condition.id}>{condition.name}</option>
            ))}
          </select>
        </label>
      )}
      <label>
        약 이름
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 아픽사반, 메트포르민" />
      </label>

      <div className="twoCol">
        <label>
          용량
          <input value={dose} onChange={(e) => setDose(e.target.value)} placeholder="예: 5 mg" />
        </label>
        <label>
          복용 주기
          <input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="예: 하루 2회" />
        </label>
      </div>

      <div className="twoCol">
        <label>
          투여 경로
          <input value={route} onChange={(e) => setRoute(e.target.value)} placeholder="예: 경구" />
        </label>
        <label>
          시작일
          <input type="date" value={startedOn} onChange={(e) => setStartedOn(e.target.value)} />
        </label>
      </div>

      <label>
        메모
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="필요한 복약 메모를 남겨두세요." />
      </label>

      <button className="primaryButton" disabled={saving}>
        {saving ? "저장 중..." : "복약 정보 저장"}
      </button>
      {message && <p className="formMessage">{message}</p>}
    </form>
  );
}
