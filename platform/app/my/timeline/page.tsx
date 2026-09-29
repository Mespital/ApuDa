import { redirect } from "next/navigation";
import ConditionEntryForm from "@/components/ConditionEntryForm";
import TreatmentEntryForm from "@/components/TreatmentEntryForm";
import RecordDeleteButton from "@/components/RecordDeleteButton";
import { getActiveProfile } from "@/lib/active-profile";
import { createClient } from "@/lib/supabase/server";

type TimelineEvent = {
  key: string;
  date: string | null;
  label: string;
  title: string;
  note: string | null;
  entity: "condition" | "treatment" | "imaging";
  id: string;
};

export default async function TimelinePage() {
  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();
  const [conditionResult, treatmentResult, imagingResult] = await Promise.all([
    supabase
      .from("conditions")
      .select("id,name,diagnosed_on,stage,histology,hospital_name,department,notes")
      .eq("profile_id", profile.id)
      .order("diagnosed_on", { ascending: false }),
    supabase
      .from("treatments")
      .select("id,name,treatment_type,cycle_label,started_on,notes")
      .eq("profile_id", profile.id)
      .order("started_on", { ascending: false }),
    supabase
      .from("imaging")
      .select("id,modality,body_part,study_date,summary,response_category")
      .eq("profile_id", profile.id)
      .order("study_date", { ascending: false })
  ]);

  const events: TimelineEvent[] = [
    ...(conditionResult.data ?? []).map((item) => ({
      key: `condition-${item.id}`,
      id: item.id,
      entity: "condition" as const,
      date: item.diagnosed_on,
      label: "진단",
      title: item.name,
      note: [
        item.stage,
        item.histology,
        [item.hospital_name, item.department].filter(Boolean).join(" · "),
        item.notes
      ].filter(Boolean).join(" · ") || null
    })),
    ...(treatmentResult.data ?? []).map((item) => ({
      key: `treatment-${item.id}`,
      id: item.id,
      entity: "treatment" as const,
      date: item.started_on,
      label: item.cycle_label || "치료",
      title: item.name,
      note: item.notes || item.treatment_type
    })),
    ...(imagingResult.data ?? []).map((item) => ({
      key: `imaging-${item.id}`,
      id: item.id,
      entity: "imaging" as const,
      date: item.study_date,
      label: item.response_category ? `영상 · ${item.response_category}` : "영상검사",
      title: `${item.modality} ${item.body_part ?? ""}`.trim(),
      note: item.summary || (item.response_category ? `보고된 반응평가: ${item.response_category}` : null)
    }))
  ].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return (
    <main className="shell">
      <p className="eyebrow">TREATMENT TIMELINE · {profile.display_name}</p>
      <h1 className="pageTitle">치료 여정</h1>
      <p className="heroCopy">
        진단부터 치료까지 중요한 사건을 시간순으로 정리합니다.
      </p>

      <div className="twoPanel">
        <section className="section">
          <p className="eyebrow">CONDITION</p>
          <h3>질환 추가</h3>
          <ConditionEntryForm profileId={profile.id} />
        </section>

        <section className="section">
          <p className="eyebrow">TREATMENT</p>
          <h3>치료 추가</h3>
          <TreatmentEntryForm profileId={profile.id} conditions={(conditionResult.data ?? []).map(({ id, name }) => ({ id, name }))} />
        </section>
      </div>

      <section className="section timeline">
        <p className="eyebrow">HISTORY</p>
        <h3>기록된 여정</h3>
        {!events.length ? (
          <p className="mutedText">아직 등록된 진단·치료 기록이 없습니다.</p>
        ) : (
          events.map((event) => (
            <article className="timelineItem" key={event.key}>
              <div className="timelineDot" />
              <div>
                <p className="timelineDate">
                  {event.date ? new Date(event.date).toLocaleDateString("ko-KR") : event.label}
                </p>
                <h3>{event.title}</h3>
                <p>{event.note || event.label}</p>
                <RecordDeleteButton entity={event.entity} id={event.id} />
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}
