"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function VisitQuestionForm({ profileId }: { profileId: string }) {
  const [question, setQuestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;

    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("visit_questions").insert({
      profile_id: profileId,
      question: question.trim(),
      status: "open"
    });

    if (error) {
      setMessage(error.message);
    } else {
      setQuestion("");
      window.location.reload();
    }

    setSaving(false);
  }

  return (
    <form className="healthForm" onSubmit={submit}>
      <label>
        내가 꼭 물어볼 질문
        <textarea
          rows={3}
          required
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="예: 손발저림이 계속되는데 다음 치료 전에 꼭 확인해야 할 점이 있을까요?"
        />
      </label>

      <button className="primaryButton" disabled={saving}>
        {saving ? "저장 중..." : "질문 추가"}
      </button>

      {message && <p className="formMessage">{message}</p>}
    </form>
  );
}
