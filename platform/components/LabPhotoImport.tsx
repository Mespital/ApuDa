"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ParsedLab = {
  canonical_code?: string | null;
  test_name: string;
  raw_name?: string;
  value: number;
  unit: string | null;
};

type JobResult = {
  status: string;
  result?: {
    text?: string;
    parsed?: {
      labs?: ParsedLab[];
    };
  };
};

async function pollJob(jobId: string): Promise<JobResult> {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    const response = await fetch(`/api/ai/jobs/${encodeURIComponent(jobId)}`, {
      cache: "no-store"
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body?.error || "AI 처리 상태를 확인하지 못했습니다.");
    if (body.status === "finished") return body;
    if (body.status === "failed") throw new Error("AI 처리에 실패했습니다.");
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  throw new Error("처리 시간이 길어지고 있습니다. 잠시 후 다시 시도해주세요.");
}

export default function LabPhotoImport({ profileId }: { profileId: string }) {
  const [items, setItems] = useState<ParsedLab[]>([]);
  const [sourceText, setSourceText] = useState("");
  const [message, setMessage] = useState("");
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function upload(file: File) {
    setProcessing(true);
    setMessage("");
    setItems([]);

    try {
      const form = new FormData();
      form.append("file", file);
      form.append("profileId", profileId);

      const response = await fetch("/api/ai/ocr", { method: "POST", body: form });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          body?.error === "ai_consent_required"
            ? "사진 인식을 사용하려면 프로필의 AI 보조 입력 동의가 필요합니다."
            : body?.error === "ai_service_unavailable"
              ? "VPS AI 입력 서버가 아직 연결되지 않았습니다."
              : body?.error || "사진을 전송하지 못했습니다."
        );
      }

      const job = await pollJob(body.job_id);
      const labs = job.result?.parsed?.labs ?? [];
      setSourceText(job.result?.text ?? "");
      setItems(labs);

      if (!labs.length) {
        setMessage("검사 수치를 자동으로 찾지 못했습니다. 직접 입력을 이용해주세요.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "사진 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  }

  function updateItem(index: number, patch: Partial<ParsedLab>) {
    setItems((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
    );
  }

  async function save() {
    if (!items.length) return;
    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const measuredAt = new Date().toISOString();

    const { error } = await supabase.from("labs").insert(
      items.map((item) => ({
        profile_id: profileId,
        canonical_code: item.canonical_code ?? null,
        test_name: item.test_name.trim(),
        value_numeric: Number(item.value),
        unit: item.unit?.trim() || null,
        measured_at: measuredAt,
        source: "ocr",
        confirmed_by_user: true
      }))
    );

    if (error) {
      setMessage(error.message);
    } else {
      window.location.reload();
    }
    setSaving(false);
  }

  return (
    <div className="importBox">
      <label className="uploadButton">
        {processing ? "사진을 정리하고 있어요..." : "검사결과 사진 선택"}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          disabled={processing}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
          }}
        />
      </label>

      {items.length > 0 && (
        <div className="reviewBox">
          <div>
            <p className="eyebrow">USER CONFIRMATION</p>
            <h4>찾은 결과를 확인해주세요.</h4>
            <p className="mutedText">
              자동 인식 결과는 저장 전에 직접 확인·수정해야 합니다.
            </p>
          </div>

          <div className="reviewList">
            {items.map((item, index) => (
              <div className="reviewRow" key={index}>
                <input
                  aria-label="검사명"
                  value={item.test_name}
                  onChange={(event) => updateItem(index, { test_name: event.target.value })}
                />
                <input
                  aria-label="검사값"
                  type="number"
                  step="any"
                  value={item.value}
                  onChange={(event) => updateItem(index, { value: Number(event.target.value) })}
                />
                <input
                  aria-label="단위"
                  value={item.unit ?? ""}
                  onChange={(event) => updateItem(index, { unit: event.target.value })}
                  placeholder="단위"
                />
              </div>
            ))}
          </div>

          <button className="primaryButton" type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "저장 중..." : "확인한 결과 저장"}
          </button>

          {sourceText && (
            <details className="detailsBox">
              <summary>인식된 원문 보기</summary>
              <pre>{sourceText}</pre>
            </details>
          )}
        </div>
      )}

      {message && <p className="formMessage">{message}</p>}
    </div>
  );
}
