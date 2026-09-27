"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password.length < 8) {
      setMessage("비밀번호는 8자 이상으로 설정해 주세요.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("두 비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      setMessage("재설정 세션이 없거나 만료되었습니다. 재설정 메일을 다시 요청해 주세요.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
    } else {
      router.push("/my");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">APUDA ID</p>
        <h1>새 비밀번호를 설정해요.</h1>
        <p className="authLead">
          새로운 비밀번호를 입력한 뒤 My ApuDa로 돌아갑니다.
        </p>

        <form className="authForm" onSubmit={submit}>
          <label>
            새 비밀번호
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <label>
            새 비밀번호 확인
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>
          <button className="primaryButton wideButton" disabled={loading}>
            {loading ? "변경 중..." : "비밀번호 변경"}
          </button>
        </form>

        {message && <p className="formMessage">{message}</p>}
      </section>
    </main>
  );
}
