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
      setMessage("Supabase 연결 후 로그인 기능을 사용할 수 있습니다.");
      return;
    }

    setLoading(true);
    setMessage("");

    const supabase = createClient();

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage(error.message);
      } else {
        setMessage("가입 요청이 완료되었습니다. 이메일 확인이 필요한 설정일 수 있습니다.");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

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
        <p className="authLead">
          하나의 ApuDa ID로 내 건강기록과 가족 프로필을 관리합니다.
        </p>

        {!configured && (
          <div className="notice">
            현재 개발환경에는 Supabase 키가 연결되지 않았습니다. UI와 DB
            구조는 준비되어 있으며 키 연결 후 인증이 활성화됩니다.
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
