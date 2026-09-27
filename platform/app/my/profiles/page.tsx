import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import { getActiveProfile } from "@/lib/active-profile";

const relationLabel: Record<string, string> = {
  self: "나",
  mother: "어머니",
  father: "아버지",
  spouse: "배우자",
  child: "자녀",
  guardian: "보호 대상 가족",
  other: "가족"
};

export default async function ProfilesPage() {
  const { user, profile, profiles } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  return (
    <main className="shell">
      <p className="eyebrow">APUDA PROFILES</p>
      <h1 className="pageTitle">건강 프로필</h1>
      <p className="heroCopy">
        하나의 ApuDa ID에서 나와 가족의 건강 흐름을 각각 분리해서 관리합니다.
      </p>

      <section className="section">
        <p className="eyebrow">ACTIVE PROFILE</p>
        <h3>현재 관리 중</h3>
        <ProfileSwitcher profiles={profiles} activeId={profile.id} />
      </section>

      <section className="section">
        <p className="eyebrow">ALL PROFILES</p>
        <h3>내 프로필 목록</h3>
        <div className="dataList">
          {profiles.map((item) => (
            <article className="dataRow" key={item.id}>
              <div>
                <strong>{item.display_name}</strong>
                <small>{relationLabel[item.relationship_to_user] ?? item.relationship_to_user}</small>
              </div>
              <span className="statusPill">{item.profile_type}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <p className="eyebrow">SETTINGS</p>
        <h3>개인정보와 AI 설정</h3>
        <p className="mutedText">
          현재 프로필의 건강정보 처리 상태와 검사사진·음성 AI 보조 입력 동의를 관리합니다.
        </p>
        <div className="buttonRow leftButtons">
          <Link className="secondaryLink compactLink" href="/my/settings/privacy">
            개인정보·AI 설정
          </Link>
          <Link className="secondaryLink compactLink" href="/my/settings/data">
            내 데이터 관리
          </Link>
        </div>
      </section>

      <div className="buttonRow leftButtons">
        <Link className="primaryLink" href="/onboarding?mode=add">＋ 가족 프로필 추가</Link>
        <LogoutButton />
      </div>
    </main>
  );
}
