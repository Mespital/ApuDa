import Link from "next/link";
import ApuDaTalkLauncher from "@/components/ApuDaTalkLauncher";
import MyBottomNav from "@/components/MyBottomNav";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import ProfileAccountMenu from "@/components/ProfileAccountMenu";
import NetlifyPreviewOffset from "@/components/NetlifyPreviewOffset";
import { getActiveProfile } from "@/lib/active-profile";

export default async function MyLayout({ children }: { children: React.ReactNode }) {
  const { profile, profiles } = await getActiveProfile();

  return (
    <div className="myAppFrame">
      <NetlifyPreviewOffset />
      {profile && (
        <header className="myGlobalHeader">
          <div className="myGlobalHeaderInner">
            <Link className="myHomeBrand" href="/my" aria-label="My ApuDa 홈으로 이동">
              <span className="myHomeWordmark">ApuDa</span>
              <span className="myHomeBrandMeta">
                <small>MY HEALTH</small>
                <strong>내 건강 기록</strong>
              </span>
            </Link>

            <div className="myGlobalHeaderTools">
              <ProfileSwitcher profiles={profiles} activeId={profile.id} />
              <ProfileAccountMenu displayName={profile.display_name} />
            </div>
          </div>
        </header>
      )}

      <div className="myAppContent">{children}</div>

      {profile && <ApuDaTalkLauncher profileId={profile.id} />}
      <MyBottomNav />

      <footer className="myMobileFooter" aria-label="My ApuDa 하단 정보">
        <a className="myMobileFooterBrand" href="https://apuda.app">
          <strong>ApuDa</strong>
          <span>아프지만, 다행이다.</span>
        </a>
        <nav className="myMobileFooterLinks" aria-label="하단 링크">
          <a href="https://apuda.app">홈</a>
          <Link href="/my/settings/privacy">개인정보</Link>
        </nav>
      </footer>
    </div>
  );
}
