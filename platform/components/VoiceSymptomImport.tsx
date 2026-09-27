"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ParsedSymptom = {
  symptom_name: string;
  present?: boolean;
  change?: string;
  count_value?: number;
};

type EditableSymptom = ParsedSymptom & {
  selected: boolean;
  severity: number;
};

async function pollJob(jobId: string) {
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

export default function VoiceSymptomImport({ profileId }: { profileId: string }) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const [recording, setRecording] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [items, setItems] = useState<EditableSymptom[]>([]);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function processBlob(blob: Blob) {
    setProcessing(true);
    setMessage("");

    try {
      const form = new FormData();
      form.append("file", new File([blob], "voice.webm", { type: blob.type || "audio/webm" }));
      form.append("profileId", profileId);

      const response = await fetch("/api/ai/stt", { method: "POST", body: form });
      const body = await response.json();

      if (!response.ok) {
        throw new Error(
          body?.error === "ai_consent_required"
            ? "음성 기록을 사용하려면 프로필의 AI 보조 입력 동의가 필요합니다."
            : body?.error === "ai_service_unavailable"
              ? "VPS AI 입력 서버가 아직 연결되지 않았습니다."
              : body?.error || "음성을 전송하지 못했습니다."
        );
      }

      const job = await pollJob(body.job_id);
      const text = job.result?.text ?? "";
      const symptoms: ParsedSymptom[] = job.result?.parsed?.symptoms ?? [];
      setTranscript(text);
      setItems(
        symptoms.map((item) => ({
          ...item,
          selected: true,
          severity: 1
        }))
      );

      if (!symptoms.length) {
        setMessage("증상을 자동으로 찾지 못했습니다. 직접 입력을 이용해주세요.");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "음성 처리 중 오류가 발생했습니다.");
    } finally {
      setProcessing(false);
    }
  }

  async function startRecording() {
    setMessage("");
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setMessage("이 브라우저에서는 음성 녹음을 지원하지 않습니다.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data.size) chunksRef.current.push(event.data);
    };

    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop());
      const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
      void processBlob(blob);
    };

    recorderRef.current = recorder;
    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    recorderRef.current?.stop();
    setRecording(false);
  }

  async function save() {
    const selected = items.filter((item) => item.selected);
    if (!selected.length) return;

    setSaving(true);
    setMessage("");
    const supabase = createClient();

    const { error } = await supabase.from("symptom_logs").insert(
      selected.map((item) => ({
        profile_id: profileId,
        symptom_name: item.symptom_name,
        severity: item.severity,
        count_value: item.count_value ?? null,
        note: transcript || null,
        source: "voice",
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
      <button
        type="button"
        className={recording ? "dangerButton" : "primaryButton"}
        onClick={() => recording ? stopRecording() : void startRecording()}
        disabled={processing}
      >
        {processing ? "말한 내용을 정리하고 있어요..." : recording ? "녹음 끝내기" : "말로 기록 시작"}
      </button>

      {transcript && (
        <div className="transcriptBox">
          <p className="eyebrow">TRANSCRIPT</p>
          <p>{transcript}</p>
        </div>
      )}

      {items.length > 0 && (
        <div className="reviewBox">
          <p className="eyebrow">USER CONFIRMATION</p>
          <h4>찾은 증상을 확인해주세요.</h4>

          <div className="voiceReviewList">
            {items.map((item, index) => (
              <div className="voiceReviewRow" key={`${item.symptom_name}-${index}`}>
                <label className="checkLabel">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(event) =>
                      setItems((current) =>
                        current.map((row, rowIndex) =>
                          rowIndex === index ? { ...row, selected: event.target.checked } : row
                        )
                      )
                    }
                  />
                  <span>{item.symptom_name}</span>
                </label>

                <select
                  aria-label={`${item.symptom_name} 불편한 정도`}
                  value={item.severity}
                  onChange={(event) =>
                    setItems((current) =>
                      current.map((row, rowIndex) =>
                        rowIndex === index ? { ...row, severity: Number(event.target.value) } : row
                      )
                    )
                  }
                >
                  <option value="0">0 · 없음</option>
                  <option value="1">1 · 조금 불편함</option>
                  <option value="2">2 · 일상에 약간 영향</option>
                  <option value="3">3 · 일상에 많이 영향</option>
                  <option value="4">4 · 매우 심함</option>
                </select>
              </div>
            ))}
          </div>

          <button className="primaryButton" type="button" disabled={saving} onClick={() => void save()}>
            {saving ? "저장 중..." : "확인한 증상 저장"}
          </button>
        </div>
      )}

      {message && <p className="formMessage">{message}</p>}
    </div>
  );
}
