"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LabEntryForm({ profileId }: { profileId: string }) {
  const [testName, setTestName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [measuredAt, setMeasuredAt] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const numeric = value.trim() === "" ? null : Number(value);

    const { error } = await supabase.from("labs").insert({
      profile_id: profileId,
      test_name: testName.trim(),
      value_numeric: Number.isFinite(numeric) ? numeric : null,
      value_text: Number.isFinite(numeric) ? null : value.trim(),
      unit: unit.trim() || null,
      measured_at: measuredAt ? new Date(measuredAt).toISOString() : new Date().toISOString(),
      source: "manual",
      confirmed_by_user: true
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("검사결과를 저장했습니다.");
      setTestName("");
      setValue("");
      setUnit("");
      setMeasuredAt("");
      window.location.reload();
    }

    setSaving(false);
  }

  return (
    <form className="healthForm" onSubmit={submit}>
      <label>
        검사명
        <input value={testName} onChange={(e) => setTestName(e.target.value)} required placeholder="예: CEA, Hb, AST" />
      </label>

      <div className="twoCol">
        <label>
          결과
          <input value={value} onChange={(e) => setValue(e.target.value)} required placeholder="예: 5.3" />
        </label>
        <label>
          단위
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="예: ng/mL" />
        </label>
      </div>

      <label>
        검사일시
        <input type="datetime-local" value={measuredAt} onChange={(e) => setMeasuredAt(e.target.value)} />
      </label>

      <button className="primaryButton" disabled={saving}>
        {saving ? "저장 중..." : "검사결과 저장"}
      </button>

      {message && <p className="formMessage">{message}</p>}
    </form>
  );
}
