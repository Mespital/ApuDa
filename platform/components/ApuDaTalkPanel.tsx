"use client";

import { FormEvent, useState } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

export default function ApuDaTalkPanel({ profileId }: { profileId: string }) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = question.trim();
    if (!trimmed) return;

    setQuestion("");
    setMessage("");
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setLoading(true);

    const response = await fetch("/api/ai/talk", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId, question: trimmed })
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      setMessage(
        body?.error === "external_ai_consent_required"
          ? "외부 생성형 AI를 사용하는 ApuDa Talk를 쓰려면 개인정보·AI 설정에서 선택 동의가 필요합니다."
          : "ApuDa Talk 답변을 만들지 못했습니다."
      );
      setLoading(false);
      return;
    }

    setMessages((current) => [
      ...current,
      { role: "assistant", text: body.answer ?? "답변을 만들지 못했습니다." }
    ]);
    setLoading(false);
  }

  return (
    <div className="talkPanel">
      <div className="talkMessages">
        {messages.length === 0 && (
          <div className="talkWelcome">
            <strong>내 기록을 바탕으로 무엇을 같이 정리할까요?</strong>
            <p>
              예: “최근 손발저림 기록을 다음 진료에서 어떻게 물어보면 좋을까?”
            </p>
          </div>
        )}

        {messages.map((item, index) => (
          <article
            className={item.role === "user" ? "talkBubble userBubble" : "talkBubble assistantBubble"}
            key={index}
          >
            {item.text}
          </article>
        ))}

        {loading && <article className="talkBubble assistantBubble">기록을 정리하고 있어요…</article>}
      </div>

      <form className="talkComposer" onSubmit={submit}>
        <textarea
          rows={3}
          maxLength={1500}
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="내 기록에 대해 궁금한 점을 적어주세요."
        />
        <button className="primaryButton" disabled={loading}>
          보내기
        </button>
      </form>

      {message && <p className="formMessage">{message}</p>}

      <p className="safetyNote">
        ApuDa Talk는 진료 준비와 기록 이해를 돕습니다. 진단·처방·약 중단 또는 용량 변경을 대신하지 않습니다.
      </p>
    </div>
  );
}
