"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured()) {
      setMessage("Supabase 환경변수 연결이 필요합니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("비밀번호 재설정 메일을 보냈습니다. 받은편지함을 확인해 주세요.");
    }

    setLoading(false);
  }

  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">APUDA ID</p>
        <h1>비밀번호를 다시 설정해요.</h1>
        <p className="authLead">
          가입한 이메일 주소로 안전한 재설정 링크를 보내드립니다.
        </p>

        <form className="authForm" onSubmit={submit}>
          <label>
            이메일
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </label>
          <button className="primaryButton wideButton" disabled={loading}>
            {loading ? "보내는 중..." : "재설정 메일 보내기"}
          </button>
        </form>

        {message && <p className="formMessage">{message}</p>}
        <Link className="textLink" href="/login">로그인으로 돌아가기</Link>
      </section>
    </main>
  );
}
