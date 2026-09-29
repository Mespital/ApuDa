import { redirect } from "next/navigation";
import ProfileEditForm from "@/components/ProfileEditForm";
import { getActiveProfile } from "@/lib/active-profile";
import { createClient } from "@/lib/supabase/server";

export default async function EditProfilePage() {
  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id,display_name,birth_year,sex_at_birth,relationship_to_user")
    .eq("id", profile.id)
    .maybeSingle();

  if (!data) redirect("/my/profiles");

  return (
    <main className="shell">
      <p className="eyebrow">PROFILE SETTINGS</p>
      <h1 className="pageTitle">프로필 정보 수정</h1>
      <p className="heroCopy">
        이름, 출생연도, 성별과 가족 관계를 필요할 때 수정할 수 있습니다.
      </p>

      <section className="section">
        <ProfileEditForm profile={data} />
      </section>
    </main>
  );
}
