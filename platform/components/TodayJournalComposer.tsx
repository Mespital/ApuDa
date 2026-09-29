"use client";

import { FormEvent, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const tagOptions = ["몸 상태", "마음", "병원", "복약", "일상"];

export default function TodayJournalComposer({ profileId }: { profileId: string }) {
  const [body, setBody] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const count = useMemo(() => body.trim().length, [body]);
  const canSave = count > 0 && count <= 1000 && !saving;

  function toggleTag(tag: string) {
    setTags((current) =>
      current.includes(tag) ? current.filter((item) => item !== tag) : [...current, tag]
    );
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = body.trim();
    if (!text || text.length > 1000) return;

    setSaving(true);
    setMessage("");

    const supabase = createClient();
    const { error } = await supabase.from("journal_entries").insert({
      profile_id: profileId,
      body: text,
      tags
    });

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("오늘 기록을 남겼어요.");
    setBody("");
    setTags([]);
    window.setTimeout(() => window.location.reload(), 350);
  }

  return (
    <form className="journalComposer" onSubmit={submit}>
      <div className="journalComposerHeader">
        <div>
          <p className="eyebrow">오늘 한 줄</p>
          <h2>오늘은 어떠셨어요?</h2>
          <p>몸 상태나 마음에 남은 것을 한 줄만 적어도 충분해요.</p>
        </div>
        <span className="journalComposerCount">{count}/1000</span>
      </div>

      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={2}
        maxLength={1000}
        placeholder="예: 오늘은 조금 피곤했지만 식사는 괜찮았어요."
        aria-label="오늘 한 줄 기록"
      />

      <div className="journalComposerFooter">
        <div className="journalTags" aria-label="기록 분류">
          {tagOptions.map((tag) => (
            <button
              key={tag}
              type="button"
              className={tags.includes(tag) ? "selected" : ""}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
        <button className="journalSaveButton" type="submit" disabled={!canSave}>
          {saving ? "저장 중..." : "기록하기"}
        </button>
      </div>

      {message && <p className="journalComposerMessage">{message}</p>}
    </form>
  );
}
