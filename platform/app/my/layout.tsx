import ApuDaTalkLauncher from "@/components/ApuDaTalkLauncher";
import MyBottomNav from "@/components/MyBottomNav";
import { getActiveProfile } from "@/lib/active-profile";

export default async function MyLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getActiveProfile();

  return (
    <>
      {children}
      {profile && <ApuDaTalkLauncher profileId={profile.id} />}
      <MyBottomNav />
    </>
  );
}
