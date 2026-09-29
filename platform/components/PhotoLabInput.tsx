"use client";

import { ChangeEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ParsedLab = {
  test_name: string;
  value: number | string;
  unit: string | null;
};

type JobResponse = {
  status?: string;
  result?: {
    text?: string;
    parsed?: {
      labs?: ParsedLab[];
    };
  };
};

async function waitForJob(jobId: string): Promise<JobResponse> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const response = await fetch(`/api/ai/jobs/${encodeURIComponent(jobId)}`, {
      cache: "no-store"
    });
    const data = (await response.json()) as JobResponse;

    if (data.status === "finished") return data;
    if (data.status === "failed" || !response.ok) {
      throw new Error("AI processing failed");
    }
  }

  throw new Error("AI processing timed out");
}

export default function PhotoLabInput({ profileId }: { profileId: string }) {
  const [status, setStatus] = useState("");
  const [rawText, setRawText] = useState("");
  const [labs, setLabs] = useState<ParsedLab[]>([]);
  const [saving, setSaving] = useState(false);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus("검사지를 읽고 있어요...");
    setLabs([]);
    setRawText("");

    const form = new FormData();
    form.set("file", file);

    try {
      const response = await fetch("/api/ai/ocr", {
        method: "POST",
        body: form
      });

      const queued = await response.json();
      if (!response.ok || !queued.job_id) {
        throw new Error("queue_failed");
      }

      const completed = await waitForJob(queued.job_id);
      const result = completed.result;
      const parsed = result?.parsed?.labs ?? [];

      setRawText(result?.text ?? "");
      setLabs(
        parsed.map((item) => ({
          test_name: item.test_name ?? "",
          value: item.value ?? "",
          unit: item.unit ?? null
        }))
      );

      setStatus(
        parsed.length
          ? "찾은 검사결과를 확인한 뒤 저장해주세요."
          : "자동으로 구조화할 항목을 찾지 못했어요. 직접 입력을 이용해주세요."
      );
    } catch {
      setStatus("AI 입력 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      event.target.value = "";
    }
  }

  function updateLab(index: number, patch: Partial<ParsedLab>) {
    setLabs((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  }

  async function confirmAndSave() {
    const cleaned = labs.filter(
      (item) => item.test_name.trim() && String(item.value).trim()
    );
    if (!cleaned.length) return;

    setSaving(true);
    setStatus("");

    const now = new Date().toISOString();
    const rows = cleaned.map((item) => {
      const numericValue = Number(item.value);
      const isNumeric =
        String(item.value).trim() !== "" && Number.isFinite(numericValue);

      return {
        profile_id: profileId,
        test_name: item.test_name.trim(),
        value_numeric: isNumeric ? numericValue : null,
        value_text: isNumeric ? null : String(item.value).trim(),
        unit: item.unit?.trim() || null,
        measured_at: now,
        source: "ocr",
        confirmed_by_user: true
      };
    });

    const supabase = createClient();
    const { error } = await supabase.from("labs").insert(rows);

    if (error) {
      setStatus("저장하지 못했습니다. 내용을 확인한 뒤 다시 시도해주세요.");
      setSaving(false);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="aiInputBox">
      <label className="uploadButton">
        사진 선택
        <input
          className="visuallyHidden"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={upload}
        />
      </label>

      {status && <p className="formMessage">{status}</p>}

      {labs.length > 0 && (
        <div className="aiReview">
          <p className="eyebrow">사용자 확인 필요</p>
          <h4>인식된 검사결과</h4>

          {labs.map((lab, index) => (
            <div className="reviewRow" key={`${index}-${lab.test_name}`}>
              <input
                aria-label="검사명"
                value={lab.test_name}
                onChange={(event) =>
                  updateLab(index, { test_name: event.target.value })
                }
              />
              <input
                aria-label="검사 결과"
                value={String(lab.value)}
                onChange={(event) =>
                  updateLab(index, { value: event.target.value })
                }
              />
              <input
                aria-label="단위"
                value={lab.unit ?? ""}
                placeholder="단위"
                onChange={(event) =>
                  updateLab(index, { unit: event.target.value })
                }
              />
            </div>
          ))}

          <button
            className="primaryButton"
            type="button"
            disabled={saving}
            onClick={confirmAndSave}
          >
            {saving ? "저장 중..." : "확인한 결과 저장"}
          </button>

          {rawText && (
            <details className="rawResult">
              <summary>원문 인식 결과 보기</summary>
              <pre>{rawText}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
