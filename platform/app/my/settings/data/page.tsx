import { redirect } from "next/navigation";
import DataControls from "@/components/DataControls";
import { getActiveProfile } from "@/lib/active-profile";

export default async function DataSettingsPage() {
  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  return (
    <main className="shell">
      <p className="eyebrow">MY DATA · {profile.display_name}</p>
      <h1 className="pageTitle">내 데이터 관리</h1>
      <p className="heroCopy">
        현재 프로필의 기록을 내보내거나 프로필과 연결된 건강기록을 삭제할 수 있습니다.
      </p>

      <section className="section">
        <p className="eyebrow">EXPORT</p>
        <h3>기록 내보내기</h3>
        <p className="mutedText">
          프로필, 질환, 치료, 복약, 검사, 증상, 일정, 동의 및 진료 질문을 JSON 파일로 내보냅니다.
        </p>
        <DataControls profileId={profile.id} displayName={profile.display_name} />
      </section>

      <p className="safetyNote">
        공개 서비스 전에는 법적 보존의무가 있는 데이터와 즉시 삭제 가능한 데이터를 구분하는 운영정책 검토가 필요합니다.
      </p>
    </main>
  );
}
