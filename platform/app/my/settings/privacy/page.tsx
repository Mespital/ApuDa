import { redirect } from "next/navigation";
import AIConsentToggle from "@/components/AIConsentToggle";
import { getActiveProfile } from "@/lib/active-profile";
import { createClient } from "@/lib/supabase/server";

export default async function PrivacySettingsPage() {
  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();

  const { data: aiConsent } = await supabase
    .from("consents")
    .select("granted,version,granted_at")
    .eq("profile_id", profile.id)
    .eq("consent_type", "ai_assisted_processing")
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: healthConsent } = await supabase
    .from("consents")
    .select("granted,version,granted_at")
    .eq("profile_id", profile.id)
    .eq("consent_type", "health_data_processing")
    .order("granted_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <main className="shell">
      <p className="eyebrow">PRIVACY · {profile.display_name}</p>
      <h1 className="pageTitle">개인정보와 AI 설정</h1>
      <p className="heroCopy">
        프로필별 건강정보 처리 상태와 선택적인 AI 보조 입력 사용 여부를 확인합니다.
      </p>

      <section className="section">
        <div className="settingCard">
          <div>
            <p className="eyebrow">HEALTH DATA</p>
            <h3>건강정보 처리</h3>
            <p className="mutedText">
              검사·증상·치료·복약·일정 등 사용자가 직접 등록한 건강기록을
              ApuDa 기능 제공을 위해 저장합니다.
            </p>
          </div>
          <span className={healthConsent?.granted ? "statusPill positivePill" : "statusPill"}>
            {healthConsent?.granted ? "동의함" : "확인 필요"}
          </span>
        </div>
      </section>

      <section className="section">
        <AIConsentToggle
          profileId={profile.id}
          initialGranted={Boolean(aiConsent?.granted)}
        />
      </section>

      <p className="safetyNote">
        정식 공개 전 개인정보처리방침·보유기간·위탁 및 국외처리 여부 등은 실제 운영 구조에 맞춰 별도 법률 검토가 필요합니다.
      </p>
    </main>
  );
}
