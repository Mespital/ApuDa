"use client";

import { ChangeEvent, useState } from "react";
import { pollAIJob } from "@/lib/ai/client";
import { createClient } from "@/lib/supabase/client";

type ParsedLab = {
  test_name: string;
  value: number;
  unit?: string | null;
  include: boolean;
};

type OCRResult = {
  text: string;
  parsed?: {
    labs?: Array<{
      test_name: string;
      value: number;
      unit?: string | null;
    }>;
  };
  needs_user_confirmation?: boolean;
};

export default function LabPhotoInput({ profileId }: { profileId: string }) {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ParsedLab[]>([]);
  const [rawText, setRawText] = useState("");
  const [measuredAt, setMeasuredAt] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setRows([]);
    setRawText("");
    setStatus("");
    setError("");
  }

  async function analyze() {
    if (!file) {
      setError("검사결과 사진을 먼저 선택해 주세요.");
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError("사진은 15MB 이하로 선택해 주세요.");
      return;
    }

    setBusy(true);
    setError("");
    setStatus("사진을 안전하게 전달하고 있어요.");

    try {
      const form = new FormData();
      form.set("file", file);

      const response = await fetch("/api/ai/ocr", {
        method: "POST",
        body: form
      });

      if (!response.ok) {
        throw new Error("사진 분석 서비스를 사용할 수 없습니다.");
      }

      const queued = (await response.json()) as { job_id?: string };
      if (!queued.job_id) {
        throw new Error("분석 작업을 시작하지 못했습니다.");
      }

      const result = await pollAIJob<OCRResult>(queued.job_id, (jobStatus) => {
        if (jobStatus === "queued") setStatus("분석 순서를 기다리고 있어요.");
        else if (jobStatus === "started") setStatus("검사지를 읽고 있어요.");
      });

      const parsed = result.parsed?.labs ?? [];
      setRows(
        parsed.map((row) => ({
          test_name: row.test_name,
          value: row.value,
          unit: row.unit ?? "",
          include: true
        }))
      );
      setRawText(result.text ?? "");
      setStatus(
        parsed.length
          ? "찾은 검사결과를 확인해 주세요. 저장 전에는 반드시 사용자가 확인합니다."
          : "글자는 읽었지만 검사값을 자동으로 구분하지 못했습니다. 직접 입력을 이용해 주세요."
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "사진 분석에 실패했습니다.");
    } finally {
      setBusy(false);
    }
  }

  function updateRow(index: number, patch: Partial<ParsedLab>) {
    setRows((current) =>
      current.map((row, rowIndex) =>
        rowIndex === index ? { ...row, ...patch } : row
      )
    );
  }

  async function confirmAndSave() {
    const selected = rows.filter((row) => row.include && row.test_name.trim());
    if (!selected.length) {
      setError("저장할 검사결과를 하나 이상 선택해 주세요.");
      return;
    }

    setBusy(true);
    setError("");
    setStatus("확인한 검사결과를 저장하고 있어요.");

    try {
      const supabase = createClient();
      const measured = measuredAt
        ? new Date(measuredAt).toISOString()
        : new Date().toISOString();

      const { error: saveError } = await supabase.from("labs").insert(
        selected.map((row) => ({
          profile_id: profileId,
          test_name: row.test_name.trim(),
          value_numeric: Number.isFinite(Number(row.value)) ? Number(row.value) : null,
          unit: row.unit?.trim() || null,
          measured_at: measured,
          source: "ocr",
          confirmed_by_user: true
        }))
      );

      if (saveError) throw saveError;

      setStatus("검사결과를 저장했습니다.");
      setRows([]);
      setFile(null);
      setRawText("");
      window.location.reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "저장하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="aiInputBox">
      <div className="uploadRow">
        <label className="fileButton">
          사진 선택
          <input type="file" accept="image/*" onChange={chooseFile} disabled={busy} />
        </label>
        <span className="fileName">{file?.name ?? "선택한 사진이 없습니다."}</span>
      </div>

      <button className="primaryButton" type="button" onClick={analyze} disabled={!file || busy}>
        {busy ? "처리 중..." : "사진 읽기"}
      </button>

      {status && <p className="aiStatus">{status}</p>}
      {error && <p className="formError">{error}</p>}

      {rows.length > 0 && (
        <div className="reviewBox">
          <div className="reviewHeader">
            <div>
              <p className="eyebrow">USER CONFIRMATION</p>
              <h4>저장할 검사결과 확인</h4>
            </div>
            <span className="statusPill">{rows.length}개 발견</span>
          </div>

          <label className="reviewDate">
            검사일시
            <input
              type="datetime-local"
              value={measuredAt}
              onChange={(event) => setMeasuredAt(event.target.value)}
            />
          </label>

          <div className="reviewRows">
            {rows.map((row, index) => (
              <div className="reviewRow" key={`${row.test_name}-${index}`}>
                <input
                  className="reviewCheck"
                  type="checkbox"
                  checked={row.include}
                  onChange={(event) => updateRow(index, { include: event.target.checked })}
                  aria-label={`${row.test_name} 저장 여부`}
                />
                <input
                  value={row.test_name}
                  onChange={(event) => updateRow(index, { test_name: event.target.value })}
                  aria-label="검사명"
                />
                <input
                  inputMode="decimal"
                  value={String(row.value)}
                  onChange={(event) => updateRow(index, { value: Number(event.target.value) })}
                  aria-label="검사값"
                />
                <input
                  value={row.unit ?? ""}
                  onChange={(event) => updateRow(index, { unit: event.target.value })}
                  placeholder="단위"
                  aria-label="단위"
                />
              </div>
            ))}
          </div>

          <button className="primaryButton" type="button" onClick={confirmAndSave} disabled={busy}>
            확인한 결과 저장
          </button>
        </div>
      )}

      {!rows.length && rawText && (
        <details className="rawText">
          <summary>읽은 원문 확인</summary>
          <pre>{rawText}</pre>
        </details>
      )}

      <p className="safetyNote">
        사진은 분석 작업 후 임시파일에서 삭제되도록 설계했습니다. OCR 결과는 자동 저장하지 않으며, 사용자가 확인한 항목만 기록합니다.
      </p>
    </div>
  );
}
