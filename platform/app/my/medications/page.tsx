import { redirect } from "next/navigation";
import MedicationEntryForm from "@/components/MedicationEntryForm";
import RecordDeleteButton from "@/components/RecordDeleteButton";
import MedicationStatusButton from "@/components/MedicationStatusButton";
import { getActiveProfile } from "@/lib/active-profile";
import { createClient } from "@/lib/supabase/server";

export default async function MedicationsPage() {
  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();
  const [{ data: medications }, { data: conditions }] = await Promise.all([
    supabase
    .from("medications")
    .select("id,name,dose_text,frequency_text,route,started_on,active,notes")
    .eq("profile_id", profile.id)
    .order("active", { ascending: false })
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
      <p className="eyebrow">MEDICATIONS · {profile.display_name}</p>
      <h1 className="pageTitle">복약 기록</h1>
      <p className="heroCopy">
        현재 복용하거나 치료 과정에서 사용하는 약을 정리해두면 다음 진료 준비에 함께 반영할 수 있습니다.
      </p>

      <section className="section">
        <p className="eyebrow">ADD MEDICATION</p>
        <h3>약 추가</h3>
        <MedicationEntryForm profileId={profile.id} conditions={conditions ?? []} />
      </section>

      <section className="section">
        <p className="eyebrow">CURRENT</p>
        <h3>등록된 약</h3>
        {!medications?.length ? (
          <p className="mutedText">아직 등록된 약이 없습니다.</p>
        ) : (
          <div className="dataList">
            {medications.map((item) => (
              <article className="dataRow" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {[item.dose_text, item.frequency_text, item.route].filter(Boolean).join(" · ") || "상세 정보 없음"}
                  </small>
                  {item.notes && <small>{item.notes}</small>}
                </div>
                <div className="rowActions">
                  <span className="statusPill">{item.active ? "복용 중" : "종료"}</span>
                  <MedicationStatusButton id={item.id} active={item.active} />
                  <RecordDeleteButton entity="medication" id={item.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="safetyNote">
        약의 중단·재개·용량 변경은 의료진의 지시에 따라 결정하세요.
      </p>
    </main>
  );
}
