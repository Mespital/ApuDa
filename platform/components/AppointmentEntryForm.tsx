"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AppointmentEntryForm({ profileId }: { profileId: string }) {
  const [type, setType] = useState("outpatient");
  const [title, setTitle] = useState("");
  const [hospital, setHospital] = useState("");
  const [department, setDepartment] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("appointments").insert({
      profile_id: profileId,
      appointment_type: type,
      title: title.trim(),
      hospital_name: hospital.trim() || null,
      department: department.trim() || null,
      scheduled_at: new Date(scheduledAt).toISOString(),
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
        일정 종류
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="outpatient">외래</option>
          <option value="lab">혈액검사</option>
          <option value="ct">CT</option>
          <option value="mri">MRI</option>
          <option value="pet">PET</option>
          <option value="treatment">치료 / 항암</option>
          <option value="surgery">수술</option>
          <option value="radiation">방사선치료</option>
          <option value="other">기타</option>
        </select>
      </label>

      <label>
        일정 이름
        <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: 종양내과 외래" />
      </label>

      <div className="twoCol">
        <label>
          병원
          <input value={hospital} onChange={(e) => setHospital(e.target.value)} placeholder="예: OO병원" />
        </label>
        <label>
          진료과
          <input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="예: 종양내과" />
        </label>
      </div>

      <label>
        날짜/시간
        <input type="datetime-local" required value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
      </label>

      <label>
        메모
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="준비할 것, 의료진에게 물어볼 것 등" />
      </label>

      <button className="primaryButton" disabled={saving}>
        {saving ? "저장 중..." : "일정 저장"}
      </button>
      {message && <p className="formMessage">{message}</p>}
    </form>
  );
}
