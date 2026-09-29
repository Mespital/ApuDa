"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type Message = {
  role: "user" | "assistant";
  text: string;
};

const quickPrompts = [
  "최근 검사 결과를 이해하기 쉽게 정리해줘",
  "최근 증상 기록을 다음 진료용으로 요약해줘",
  "현재 복약 정보를 정리해줘",
  "다음 진료에서 물어볼 질문을 만들어줘"
];

export default function ApuDaTalkPanel({
  profileId,
  compact = false
}: {
  profileId: string;
  compact?: boolean;
}) {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, loading]);

  function clearConversation() {
    if (loading) return;
    setMessages([]);
    setMessage("");
    setQuestion("");
  }

  async function sendQuestion(rawQuestion: string) {
    const trimmed = rawQuestion.trim();
    if (!trimmed || loading) return;

    setQuestion("");
    setMessage("");
    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setLoading(true);

    try {
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
            : body?.error === "unauthorized"
              ? "로그인 상태를 다시 확인해주세요."
              : "ApuDa Talk 답변을 만들지 못했습니다. 잠시 후 다시 시도해주세요."
        );
        return;
      }

      setMessages((current) => [
        ...current,
        { role: "assistant", text: body.answer ?? "답변을 만들지 못했습니다." }
      ]);
    } catch {
      setMessage("네트워크 연결을 확인한 뒤 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await sendQuestion(question);
  }

  return (
    <div className={compact ? "talkPanel compactTalkPanel" : "talkPanel"}>
      {messages.length > 0 && (
        <div className="talkToolbar">
          <span>현재 프로필 기록 기준</span>
          <button type="button" disabled={loading} onClick={clearConversation}>
            새 대화
          </button>
        </div>
      )}

      <div className="talkMessages" aria-live="polite" ref={messagesRef}>
        {messages.length === 0 && (
          <div className="talkWelcome">
            <span className="talkWelcomeIcon">✦</span>
            <strong>무엇을 같이 정리할까요?</strong>
            <p>
              저장된 검사·증상·치료·복약·일정을 바탕으로 진료 준비에 필요한 내용을 정리합니다.
            </p>

            <div className="talkPromptGrid">
              {quickPrompts.map((prompt) => (
                <button
                  type="button"
                  className="talkPromptChip"
                  key={prompt}
                  disabled={loading}
                  onClick={() => sendQuestion(prompt)}
                >
                  {prompt}
                </button>
              ))}
            </div>
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

        {loading && (
          <article className="talkBubble assistantBubble talkLoading">
            <span />
            <span />
            <span />
            기록을 정리하고 있어요
          </article>
        )}
      </div>

      <form className="talkComposer" onSubmit={submit}>
        <textarea
          rows={compact ? 2 : 3}
          maxLength={1500}
          value={question}
          disabled={loading}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void sendQuestion(question);
            }
          }}
          placeholder="예: 최근 검사결과에서 다음 진료 때 확인할 점은?"
        />
        <button className="primaryButton talkSendButton" disabled={loading || !question.trim()}>
          보내기
        </button>
      </form>

      {message && <p className="formMessage talkError">{message}</p>}

      {!compact && (
        <p className="safetyNote">
          ApuDa Talk는 진료 준비와 기록 이해를 돕습니다. 진단·처방·약 중단 또는 용량 변경을 대신하지 않습니다.
        </p>
      )}
    </div>
  );
}
