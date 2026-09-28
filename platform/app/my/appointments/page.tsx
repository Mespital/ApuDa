import { redirect } from "next/navigation";
import AppointmentEntryForm from "@/components/AppointmentEntryForm";
import RecordDeleteButton from "@/components/RecordDeleteButton";
import { getActiveProfile } from "@/lib/active-profile";
import { createClient } from "@/lib/supabase/server";

export default async function AppointmentsPage() {
  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();
  const { data: appointments } = await supabase
    .from("appointments")
    .select("id,title,appointment_type,hospital_name,department,scheduled_at,notes")
    .eq("profile_id", profile.id)
    .order("scheduled_at", { ascending: true });

  return (
    <main className="shell">
      <p className="eyebrow">APPOINTMENTS · {profile.display_name}</p>
      <h1 className="pageTitle">병원 일정</h1>
      <p className="heroCopy">외래, 검사, CT/MRI/PET, 치료 일정을 한곳에 모아둡니다.</p>

      <section className="section">
        <p className="eyebrow">ADD SCHEDULE</p>
        <h3>일정 추가</h3>
        <AppointmentEntryForm profileId={profile.id} />
      </section>

      <section className="section">
        <p className="eyebrow">SCHEDULE</p>
        <h3>등록된 일정</h3>
        {!appointments?.length ? (
          <p className="mutedText">아직 등록된 일정이 없습니다.</p>
        ) : (
          <div className="dataList">
            {appointments.map((item) => (
              <article className="dataRow" key={item.id}>
                <div>
                  <strong>{item.title}</strong>
                  <small>{item.hospital_name ?? ""} {item.department ?? ""}</small>
                  {item.notes && <small>{item.notes}</small>}
                </div>
                <div className="rowActions">
                  <b>{new Date(item.scheduled_at).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" })}</b>
                  <RecordDeleteButton entity="appointment" id={item.id} />
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
