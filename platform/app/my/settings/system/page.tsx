import Link from "next/link";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/active-profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { checkAIInputService } from "@/lib/ai/server";

function Status({
  ok,
  label
}: {
  ok: boolean;
  label: string;
}) {
  return (
    <span className={ok ? "statusPill positivePill" : "statusPill"}>
      {ok ? "사용 가능" : label}
    </span>
  );
}

export const dynamic = "force-dynamic";

export default async function SystemSettingsPage() {
  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabaseReady = isSupabaseConfigured();
  const aiInputStatus = await checkAIInputService();
  const aiInputReady = aiInputStatus === "healthy";
  const talkProvider = process.env.AI_PROVIDER ?? "mock";
  const externalTalkReady =
    talkProvider === "openai" &&
    Boolean(process.env.OPENAI_API_KEY) &&
    Boolean(process.env.OPENAI_MODEL);

  return (
    <main className="shell">
      <p className="eyebrow">SYSTEM STATUS · {profile.display_name}</p>
      <h1 className="pageTitle">기능 연결 상태</h1>
      <p className="heroCopy">
        My ApuDa의 핵심 기능이 현재 배포 환경에서 사용할 수 있는지 확인합니다.
      </p>

      <section className="section">
        <div className="settingCard">
          <div>
            <p className="eyebrow">CORE</p>
            <h3>계정 · 건강기록 데이터베이스</h3>
            <p className="mutedText">
              로그인, 프로필, 검사, 증상, 치료, 복약, 일정, 바이오마커와 영상검사 저장 기능입니다.
            </p>
          </div>
          <Status ok={supabaseReady} label="설정 필요" />
        </div>
      </section>

      <section className="section">
        <div className="settingCard">
          <div>
            <p className="eyebrow">APUDA TALK</p>
            <h3>기록 정리 · 진료준비 AI</h3>
            <p className="mutedText">
              현재 {externalTalkReady ? "외부 생성형 AI 연결 모드" : "안전한 기본 정리 모드"}로 작동합니다.
              기본 모드에서도 저장된 건강기록을 읽어 진료 준비용 맥락을 정리합니다.
            </p>
          </div>
          <Status ok={talkProvider === "mock" || externalTalkReady} label="설정 필요" />
        </div>
      </section>

      <section className="section">
        <div className="settingCard">
          <div>
            <p className="eyebrow">PHOTO & VOICE</p>
            <h3>검사사진 OCR · 음성 STT</h3>
            <p className="mutedText">
              VPS의 ApuDa AI Input 서버가 연결되면 검사사진 인식과 음성 증상 기록이 활성화됩니다.
              연결 전에도 직접 입력 기능은 정상 사용할 수 있습니다.
            </p>
          </div>
          <Status
            ok={aiInputReady}
            label={aiInputStatus === "unavailable" ? "연결 오류" : "VPS 연결 필요"}
          />
        </div>
      </section>

      <section className="section softSection">
        <p className="eyebrow">NEXT</p>
        <h3>{aiInputReady ? "핵심 연결이 완료되어 있습니다." : "다음 연결은 VPS AI 입력 서버입니다."}</h3>
        <p className="mutedText">
          {aiInputReady
            ? "검사사진과 음성 입력까지 실제 환경에서 테스트해 주세요."
            : aiInputStatus === "unavailable"
              ? "VPS 설정은 감지되지만 현재 AI 입력 서버에 연결할 수 없습니다. 서버 상태와 HTTPS 주소를 확인해 주세요."
              : "나머지 건강기록·진료준비 기능은 그대로 사용할 수 있고, OCR/STT만 VPS 연결 후 켜집니다."}
        </p>
        <div className="buttonRow leftButtons">
          <Link className="primaryLink compactLink" href="/my/record">기록 기능 테스트</Link>
          <Link className="secondaryLink compactLink" href="/my/settings/privacy">AI 동의 설정</Link>
        </div>
      </section>
    </main>
  );
}
