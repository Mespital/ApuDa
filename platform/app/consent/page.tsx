import { redirect } from "next/navigation";
import ConsentForm from "@/components/ConsentForm";
import { getActiveProfile } from "@/lib/active-profile";

export default async function ConsentPage() {
  const { user, profile } = await getActiveProfile();

  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  return (
    <main className="authShell">
      <section className="authCard">
        <p className="eyebrow">PRIVACY & CONSENT</p>
        <h1>내 건강기록을 안전하게 다뤄요.</h1>
        <p className="authLead">
          ApuDa가 어떤 정보를 왜 처리하는지 확인하고 필요한 항목에 동의해주세요.
        </p>
        <ConsentForm profileId={profile.id} />
      </section>
    </main>
  );
}
