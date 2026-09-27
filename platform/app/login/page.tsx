"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const configured = isSupabaseConfigured();

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!configured) {
      setMessage("Supabase 환경변수 연결이 필요합니다.");
      return;
    }

    setLoading(true);
    setMessage("");
    const supabase = createClient();

    if (mode === "signup") {
      const redirectTo = `${window.location.origin}/auth/callback?next=/onboarding`;
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo }
      });

      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        router.push("/onboarding");
        router.refresh();
      } else {
        setMessage("가입 요청이 완료되었습니다. 이메일 인증 링크를 확인해 주세요.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setMessage(error.message);
      } else {
        router.push("/my");
        router.refresh();
      }
    }

    setLoading(false);
  }

  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">APUDA ID</p>
        <h1>{mode === "login" ? "다시 만나서 반가워요." : "ApuDa를 시작해요."}</h1>
        <p className="authLead">하나의 ApuDa ID로 내 건강기록과 가족 프로필을 관리합니다.</p>

        {!configured && (
          <div className="notice">
            현재 환경에는 Supabase 연결정보가 없습니다. 배포 환경변수를 연결하면 인증이 활성화됩니다.
          </div>
        )}

        <form onSubmit={submit} className="authForm">
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

          <label>
            비밀번호
            <input
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={8}
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8자 이상"
            />
          </label>

          <button className="primaryButton wideButton" disabled={loading}>
            {loading ? "처리 중..." : mode === "login" ? "로그인" : "가입하기"}
          </button>
        </form>

        {message && <p className="formMessage">{message}</p>}

        {mode === "login" && (
          <a className="textLink" href="/forgot-password">비밀번호를 잊으셨나요?</a>
        )}

        <button
          className="textButton"
          type="button"
          onClick={() => setMode(mode === "login" ? "signup" : "login")}
        >
          {mode === "login"
            ? "처음이신가요? ApuDa ID 만들기"
            : "이미 계정이 있나요? 로그인"}
        </button>
      </section>
    </main>
  );
}
