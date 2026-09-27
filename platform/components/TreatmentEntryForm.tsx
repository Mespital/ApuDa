"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ConditionOption = { id: string; name: string };

export default function TreatmentEntryForm({
  profileId,
  conditions = []
}: {
  profileId: string;
  conditions?: ConditionOption[];
}) {
  const [conditionId, setConditionId] = useState("");
  const [type, setType] = useState("chemotherapy");
  const [name, setName] = useState("");
  const [cycle, setCycle] = useState("");
  const [startedOn, setStartedOn] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.from("treatments").insert({
      profile_id: profileId,
      condition_id: conditionId || null,
      treatment_type: type,
      name: name.trim(),
      cycle_label: cycle.trim() || null,
      started_on: startedOn || null,
      notes: notes.trim() || null
    });
    if (error) setMessage(error.message);
    else window.location.reload();
    setSaving(false);
  }

  return (
    <form className="healthForm" onSubmit={submit}>
      {conditions.length > 0 && (
        <label>
          연결할 질환
          <select value={conditionId} onChange={(e) => setConditionId(e.target.value)}>
            <option value="">선택하지 않음</option>
            {conditions.map((condition) => (
              <option value={condition.id} key={condition.id}>{condition.name}</option>
            ))}
          </select>
        </label>
      )}
      <label>
        치료 종류
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="surgery">수술</option>
          <option value="chemotherapy">항암화학요법</option>
          <option value="immunotherapy">면역항암</option>
          <option value="targeted">표적치료</option>
          <option value="radiation">방사선치료</option>
          <option value="hormonal">호르몬치료</option>
          <option value="medication">약물치료</option>
          <option value="other">기타</option>
        </select>
      </label>
      <label>
        치료명
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="예: mFOLFOX6" />
      </label>
      <div className="twoCol">
        <label>
          차수/주기
          <input value={cycle} onChange={(e) => setCycle(e.target.value)} placeholder="예: Cycle 6" />
        </label>
        <label>
          시작일
          <input type="date" value={startedOn} onChange={(e) => setStartedOn(e.target.value)} />
        </label>
      </div>
      <label>
        메모
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <button className="primaryButton" disabled={saving}>{saving ? "저장 중..." : "치료 저장"}</button>
      {message && <p className="formMessage">{message}</p>}
    </form>
  );
}
