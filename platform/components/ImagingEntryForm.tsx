"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ConditionOption = { id: string; name: string };

export default function ImagingEntryForm({
  profileId,
  conditions = []
}: {
  profileId: string;
  conditions?: ConditionOption[];
}) {
  const [conditionId, setConditionId] = useState("");
  const [modality, setModality] = useState("CT");
  const [bodyPart, setBodyPart] = useState("");
  const [studyDate, setStudyDate] = useState("");
  const [summary, setSummary] = useState("");
  const [responseCategory, setResponseCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("imaging").insert({
      profile_id: profileId,
      condition_id: conditionId || null,
      modality,
      body_part: bodyPart.trim() || null,
      study_date: studyDate,
      summary: summary.trim() || null,
      response_category: responseCategory || null,
      source: "manual",
      confirmed_by_user: true
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
            <option value="">선택하지 않음</option>
            {conditions.map((condition) => (
              <option value={condition.id} key={condition.id}>{condition.name}</option>
            ))}
          </select>
        </label>
      )}
      <div className="twoCol">
        <label>
          검사 종류
          <select value={modality} onChange={(e) => setModality(e.target.value)}>
            <option value="CT">CT</option>
            <option value="MRI">MRI</option>
            <option value="PET">PET / PET-CT</option>
            <option value="X-RAY">X-ray</option>
            <option value="ULTRASOUND">초음파</option>
            <option value="OTHER">기타</option>
          </select>
        </label>

        <label>
          검사일
          <input type="date" required value={studyDate} onChange={(e) => setStudyDate(e.target.value)} />
        </label>
      </div>

      <label>
        검사 부위
        <input value={bodyPart} onChange={(e) => setBodyPart(e.target.value)} placeholder="예: 흉부·복부, 간, 뇌" />
      </label>

      <label>
        결과 요약
        <textarea
          rows={4}
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="영상 판독지 또는 의료진에게 들은 내용을 필요한 만큼만 기록하세요."
        />
      </label>

      <label>
        반응평가 표기
        <select value={responseCategory} onChange={(e) => setResponseCategory(e.target.value)}>
          <option value="">기록하지 않음</option>
          <option value="CR">CR · 완전반응</option>
          <option value="PR">PR · 부분반응</option>
          <option value="SD">SD · 안정병변</option>
          <option value="PD">PD · 진행병변</option>
          <option value="NE">NE · 평가불가/미평가</option>
        </select>
      </label>

      <div className="notice">
        CR·PR·SD·PD는 ApuDa가 영상에서 자동 판단하지 않습니다. 판독보고서나 의료진 설명에 명시된 경우에만 기록하세요.
      </div>

      <button className="primaryButton" disabled={saving}>
        {saving ? "저장 중..." : "영상검사 기록 저장"}
      </button>
      {message && <p className="formMessage">{message}</p>}
    </form>
  );
}
