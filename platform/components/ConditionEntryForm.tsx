"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ConditionEntryForm({ profileId }: { profileId: string }) {
  const [name, setName] = useState("");
  const [diagnosedOn, setDiagnosedOn] = useState("");
  const [stage, setStage] = useState("");
  const [histology, setHistology] = useState("");
  const [hospital, setHospital] = useState("");
  const [department, setDepartment] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("conditions").insert({
      profile_id: profileId,
      name: name.trim(),
      diagnosed_on: diagnosedOn || null,
      stage: stage.trim() || null,
      histology: histology.trim() || null,
      hospital_name: hospital.trim() || null,
      department: department.trim() || null,
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
      <label>
        질환명
        <input required value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 위암, 폐암, 고혈압" />
      </label>

      <div className="twoCol">
        <label>
          진단일
          <input type="date" value={diagnosedOn} onChange={(e) => setDiagnosedOn(e.target.value)} />
        </label>
        <label>
          병기
          <input value={stage} onChange={(e) => setStage(e.target.value)} placeholder="예: Stage III" />
        </label>
      </div>

      <label>
        조직형 / 진단 세부정보
        <input value={histology} onChange={(e) => setHistology(e.target.value)} placeholder="예: Adenocarcinoma" />
      </label>

      <div className="twoCol">
        <label>
          치료기관
          <input value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="예: OO병원" />
        </label>
        <label>
          진료과
          <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="예: 종양내과" />
        </label>
      </div>

      <label>
        메모
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="필요한 내용을 추가로 기록할 수 있어요." />
      </label>

      <button className="primaryButton" disabled={saving}>
        {saving ? "저장 중..." : "질환 저장"}
      </button>
      {message && <p className="formMessage">{message}</p>}
    </form>
  );
}
