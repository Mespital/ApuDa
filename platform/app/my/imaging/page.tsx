import { redirect } from "next/navigation";
import ImagingEntryForm from "@/components/ImagingEntryForm";
import { getActiveProfile } from "@/lib/active-profile";
import { createClient } from "@/lib/supabase/server";

const responseLabels: Record<string, string> = {
  CR: "완전반응",
  PR: "부분반응",
  SD: "안정병변",
  PD: "진행병변",
  NE: "평가불가/미평가"
};

export default async function ImagingPage() {
  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();
  const [{ data: imaging }, { data: conditions }] = await Promise.all([
    supabase
    .from("imaging")
    .select("id,modality,body_part,study_date,summary,response_category")
    .eq("profile_id", profile.id)
    .order("study_date", { ascending: false }),
    supabase
      .from("conditions")
      .select("id,name")
      .eq("profile_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
  ]);

  return (
    <main className="shell">
      <p className="eyebrow">IMAGING · {profile.display_name}</p>
      <h1 className="pageTitle">영상검사</h1>
      <p className="heroCopy">
        CT·MRI·PET 같은 영상검사 일정과 결과를 치료 여정에 함께 정리합니다.
      </p>

      <section className="section">
        <p className="eyebrow">ADD IMAGING</p>
        <h3>영상검사 기록 추가</h3>
        <ImagingEntryForm profileId={profile.id} conditions={conditions ?? []} />
      </section>

      <section className="section">
        <p className="eyebrow">HISTORY</p>
        <h3>최근 영상검사</h3>
        {!imaging?.length ? (
          <p className="mutedText">아직 등록된 영상검사 기록이 없습니다.</p>
        ) : (
          <div className="dataList">
            {imaging.map((item) => (
              <article className="dataRow" key={item.id}>
                <div>
                  <strong>{item.modality} {item.body_part ?? ""}</strong>
                  <small>{new Date(item.study_date).toLocaleDateString("ko-KR")}</small>
                  {item.summary && <small>{item.summary}</small>}
                </div>
                {item.response_category && (
                  <span className="statusPill">
                    {item.response_category} · {responseLabels[item.response_category] ?? item.response_category}
                  </span>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="safetyNote">
        영상 반응평가는 판독보고서와 담당 의료진의 종합 판단을 따라야 하며 ApuDa가 자동 판정하지 않습니다.
      </p>
    </main>
  );
}
