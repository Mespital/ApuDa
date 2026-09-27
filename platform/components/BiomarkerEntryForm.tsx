"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const commonBiomarkers = [
  "HER2",
  "PD-L1 CPS",
  "MSI",
  "MMR",
  "EBV",
  "CLDN18.2",
  "EGFR",
  "ALK",
  "ROS1",
  "KRAS",
  "NRAS",
  "BRAF",
  "MET",
  "RET",
  "BRCA1/2",
  "ER",
  "PR"
];

export default function BiomarkerEntryForm({ profileId }: { profileId: string }) {
  const [name, setName] = useState("");
  const [resultText, setResultText] = useState("");
  const [testedOn, setTestedOn] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("biomarkers").insert({
      profile_id: profileId,
      name: name.trim(),
      result_text: resultText.trim() || null,
      tested_on: testedOn || null,
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
        바이오마커
        <input
          list="biomarker-list"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="예: HER2, PD-L1 CPS, EGFR"
        />
        <datalist id="biomarker-list">
          {commonBiomarkers.map((item) => <option value={item} key={item} />)}
        </datalist>
      </label>

      <label>
        결과
        <input
          value={resultText}
          onChange={(e) => setResultText(e.target.value)}
          placeholder="예: Negative, CPS 5, Exon 19 deletion"
        />
      </label>

      <label>
        검사일
        <input type="date" value={testedOn} onChange={(e) => setTestedOn(e.target.value)} />
      </label>

      <label>
        메모
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="병리보고서의 추가 내용을 필요한 만큼만 기록하세요."
        />
      </label>

      <button className="primaryButton" disabled={saving}>
        {saving ? "저장 중..." : "바이오마커 저장"}
      </button>
      {message && <p className="formMessage">{message}</p>}
    </form>
  );
}
