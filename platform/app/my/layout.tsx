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
    </div>
  );
}
