"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ParsedSymptom = {
  symptom_name: string;
  count_value?: number | null;
  severity?: number | null;
};

type JobResponse = {
  status?: string;
  result?: {
    text?: string;
    parsed?: {
      symptoms?: ParsedSymptom[];
      fever_absent?: boolean;
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

export default function VoiceSymptomInput({ profileId }: { profileId: string }) {
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState("");
  const [transcript, setTranscript] = useState("");
  const [symptoms, setSymptoms] = useState<ParsedSymptom[]>([]);
  const [saving, setSaving] = useState(false);

  async function submitAudio(file: File) {
    setStatus("음성을 정리하고 있어요...");
    setTranscript("");
    setSymptoms([]);

    const form = new FormData();
    form.set("file", file);

    try {
      const response = await fetch("/api/ai/stt", {
        method: "POST",
        body: form
      });
      const queued = await response.json();

      if (!response.ok || !queued.job_id) {
        throw new Error("queue_failed");
      }

      const completed = await waitForJob(queued.job_id);
      const result = completed.result;
      const parsed = result?.parsed?.symptoms ?? [];

      setTranscript(result?.text ?? "");
      setSymptoms(
        parsed.map((item) => ({
          symptom_name: item.symptom_name ?? "",
          count_value: item.count_value ?? null,
          severity: null
        }))
      );

      setStatus(
        parsed.length
          ? "인식한 내용을 확인하고 불편한 정도를 선택한 뒤 저장해주세요."
          : "자동으로 증상을 찾지 못했어요. 직접 입력을 이용해주세요."
      );
    } catch {
      setStatus("AI 입력 서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.");
    }
  }

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setStatus("이 브라우저에서는 음성 녹음을 사용할 수 없습니다.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      streamRef.current = stream;
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm"
        });
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;

        const file = new File([blob], "voice-note.webm", {
          type: blob.type || "audio/webm"
        });
        await submitAudio(file);
      };

      recorder.start();
      setRecording(true);
      setStatus("말씀해주세요. 끝나면 녹음 종료를 눌러주세요.");
    } catch {
      setStatus("마이크 권한을 확인해주세요.");
    }
  }

  function stopRecording() {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    recorder.stop();
    setRecording(false);
    setStatus("녹음을 정리하고 있어요...");
  }

  function updateSymptom(index: number, patch: Partial<ParsedSymptom>) {
    setSymptoms((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item
      )
    );
  }

  async function confirmAndSave() {
    const cleaned = symptoms.filter((item) => item.symptom_name.trim());
    if (!cleaned.length) return;

    setSaving(true);
    const supabase = createClient();

    const { error } = await supabase.from("symptom_logs").insert(
      cleaned.map((item) => ({
        profile_id: profileId,
        symptom_name: item.symptom_name.trim(),
        severity: item.severity ?? null,
        count_value: item.count_value ?? null,
        source: "voice",
        confirmed_by_user: true
      }))
    );

    if (error) {
      setStatus("저장하지 못했습니다. 내용을 확인한 뒤 다시 시도해주세요.");
      setSaving(false);
      return;
    }

    window.location.reload();
  }

  return (
    <div className="aiInputBox">
      <div className="buttonRow leftButtons">
        {!recording ? (
          <button className="primaryButton" type="button" onClick={startRecording}>
            ● 음성 기록 시작
          </button>
        ) : (
          <button className="dangerSoftButton" type="button" onClick={stopRecording}>
            ■ 녹음 종료
          </button>
        )}

        <label className="secondaryButton uploadButton">
          녹음파일 선택
          <input
            className="visuallyHidden"
            type="file"
            accept="audio/*"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void submitAudio(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      {status && <p className="formMessage">{status}</p>}

      {transcript && (
        <div className="transcriptBox">
          <span>인식한 말</span>
          <p>{transcript}</p>
        </div>
      )}

      {symptoms.length > 0 && (
        <div className="aiReview">
          <p className="eyebrow">사용자 확인 필요</p>
          <h4>인식된 증상</h4>

          {symptoms.map((item, index) => (
            <div className="voiceReviewRow" key={`${index}-${item.symptom_name}`}>
              <input
                aria-label="증상명"
                value={item.symptom_name}
                onChange={(event) =>
                  updateSymptom(index, { symptom_name: event.target.value })
                }
              />

              <select
                aria-label="불편한 정도"
                value={item.severity ?? ""}
                onChange={(event) =>
                  updateSymptom(index, {
                    severity:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value)
                  })
                }
              >
                <option value="">정도 선택 안 함</option>
                <option value="0">0 · 없음</option>
                <option value="1">1 · 조금 불편함</option>
                <option value="2">2 · 일상에 약간 영향</option>
                <option value="3">3 · 일상에 많이 영향</option>
                <option value="4">4 · 매우 심함</option>
              </select>

              <input
                type="number"
                min="0"
                aria-label="횟수"
                placeholder="횟수"
                value={item.count_value ?? ""}
                onChange={(event) =>
                  updateSymptom(index, {
                    count_value:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value)
                  })
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
            {saving ? "저장 중..." : "확인한 증상 저장"}
          </button>
        </div>
      )}
    </div>
  );
}
