import { redirect } from "next/navigation";
import AIConsentToggle from "@/components/AIConsentToggle";
import ExternalAIConsentToggle from "@/components/ExternalAIConsentToggle";
import { getActiveProfile } from "@/lib/active-profile";
import { createClient } from "@/lib/supabase/server";

export default async function PrivacySettingsPage() {
  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();

  const [aiInputResult, externalAIResult, healthResult] = await Promise.all([
    supabase
      .from("consents")
      .select("granted,version,granted_at")
      .eq("profile_id", profile.id)
      .eq("consent_type", "ai_assisted_processing")
      .order("granted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("consents")
      .select("granted,version,granted_at")
      .eq("profile_id", profile.id)
      .eq("consent_type", "external_ai_processing")
      .order("granted_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("consents")
      .select("granted,version,granted_at")
      .eq("profile_id", profile.id)
      .eq("consent_type", "health_data_processing")
      .order("granted_at", { ascending: false })
      .limit(1)
      .maybeSingle()
  ]);

  return (
    <main className="shell">
      <p className="eyebrow">PRIVACY · {profile.display_name}</p>
      <h1 className="pageTitle">개인정보와 AI 설정</h1>
      <p className="heroCopy">
        프로필별 건강정보 처리 상태와 선택적인 AI 기능의 처리 범위를 관리합니다.
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
          <span className={healthResult.data?.granted ? "statusPill positivePill" : "statusPill"}>
            {healthResult.data?.granted ? "동의함" : "확인 필요"}
          </span>
        </div>
      </section>

      <section className="section">
        <AIConsentToggle
          profileId={profile.id}
          initialGranted={Boolean(aiInputResult.data?.granted)}
        />
      </section>

      <section className="section">
        <ExternalAIConsentToggle
          profileId={profile.id}
          initialGranted={Boolean(externalAIResult.data?.granted)}
        />
      </section>

      <p className="safetyNote">
        외부 생성형 AI 사용은 기본적으로 꺼져 있습니다. 실제 공개 전 개인정보처리방침·보유기간·위탁 및 국외처리 여부는 실제 운영 구조에 맞춰 별도 법률 검토가 필요합니다.
      </p>
    </main>
  );
}
