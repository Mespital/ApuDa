import { redirect } from "next/navigation";
import BiomarkerEntryForm from "@/components/BiomarkerEntryForm";
import RecordDeleteButton from "@/components/RecordDeleteButton";
import { getActiveProfile } from "@/lib/active-profile";
import { createClient } from "@/lib/supabase/server";

export default async function BiomarkersPage() {
  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();
  const [{ data: biomarkers }, { data: conditions }] = await Promise.all([
    supabase
    .from("biomarkers")
    .select("id,name,result_text,result_numeric,unit,tested_on,notes")
    .eq("profile_id", profile.id)
    .order("tested_on", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false }),
    supabase
      .from("conditions")
      .select("id,name")
      .eq("profile_id", profile.id)
      .eq("status", "active")
      .order("created_at", { ascending: true })
  ]);

  return (
    <main className="shell">
      <p className="eyebrow">BIOMARKERS · {profile.display_name}</p>
      <h1 className="pageTitle">바이오마커</h1>
      <p className="heroCopy">
        병리·분자검사 결과를 치료 기록과 함께 정리합니다. 바이오마커 결과 하나만으로 치료 결정을 자동으로 내리지 않습니다.
      </p>

      <section className="section">
        <p className="eyebrow">ADD BIOMARKER</p>
        <h3>결과 추가</h3>
        <BiomarkerEntryForm profileId={profile.id} conditions={conditions ?? []} />
      </section>

      <section className="section">
        <p className="eyebrow">HISTORY</p>
        <h3>등록된 결과</h3>
        {!biomarkers?.length ? (
          <p className="mutedText">아직 등록된 바이오마커 결과가 없습니다.</p>
        ) : (
          <div className="dataList">
            {biomarkers.map((item) => (
              <article className="dataRow" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {item.tested_on ? new Date(item.tested_on).toLocaleDateString("ko-KR") : "검사일 미등록"}
                  </small>
                  {item.notes && <small>{item.notes}</small>}
                </div>
                <div className="rowActions">
                  <b>{item.result_text ?? item.result_numeric ?? "-"} {item.unit ?? ""}</b>
                  <RecordDeleteButton entity="biomarker" id={item.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="safetyNote">
        특정 바이오마커의 의미는 암종·병기·치료선·검사방법 등에 따라 달라질 수 있으므로 의료진과 함께 해석하세요.
      </p>
    </main>
  );
}
