import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import { getActiveProfile } from "@/lib/active-profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function formatDday(iso: string) {
  const now = new Date();
  const target = new Date(iso);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const days = Math.round((end - start) / 86400000);
  if (days === 0) return "D-DAY";
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}

export default async function MyApuDaPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="shell">
        <section className="section">
          <p className="eyebrow">MY APUDA · SETUP</p>
          <h1 className="pageTitle">ApuDa Health OS</h1>
          <p className="heroCopy">
            Supabase 환경변수를 연결하면 ApuDa ID와 실제 건강기록 기능이
            활성화됩니다.
          </p>
          <Link className="primaryLink" href="/login">ApuDa ID 화면 보기</Link>
        </section>
      </main>
    );
  }

  const { user, profile, profiles } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const [appointmentsResult, labsResult, symptomsResult, treatmentsResult] =
    await Promise.all([
      supabase
        .from("appointments")
        .select("id,title,hospital_name,department,scheduled_at")
        .eq("profile_id", profile.id)
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(1),
      supabase
        .from("labs")
        .select("id,test_name,value_numeric,value_text,unit,measured_at")
        .eq("profile_id", profile.id)
        .order("measured_at", { ascending: false })
        .limit(3),
      supabase
        .from("symptom_logs")
        .select("id,severity")
        .eq("profile_id", profile.id)
        .gte("recorded_at", since),
      supabase
        .from("treatments")
        .select("id,name,cycle_label,treatment_type,started_on")
        .eq("profile_id", profile.id)
        .order("started_on", { ascending: false })
        .limit(1)
    ]);

  const nextAppointment = appointmentsResult.data?.[0];
  const latestLabs = labsResult.data ?? [];
  const recentSymptoms = symptomsResult.data ?? [];
  const currentTreatment = treatmentsResult.data?.[0];

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MY APUDA</p>
          <ProfileSwitcher
            profiles={profiles}
            activeId={profile.id}
          />
        </div>
        <Link className="profileButton linkButton" href="/my/profiles">MY</Link>
      </header>

      <section className="hero compactHero">
        <p className="eyebrow">TODAY</p>
        <h2>
          {profile.display_name}님의 건강 흐름을
          <br />
          차근차근 정리해요.
        </h2>
        <p className="heroCopy">
          {nextAppointment
            ? `다음 일정까지 ${formatDday(nextAppointment.scheduled_at)}예요. 검사, 증상, 치료 기록을 한곳에 모아 준비합니다.`
            : "검사, 증상, 치료와 다음 진료를 한곳에 모아 다음 행동을 준비합니다."}
        </p>
        <Link className="primaryLink" href="/my/record">＋ 기록하기</Link>
      </section>

      <section className="metricsGrid">
        <Link href="/my/appointments" className="metricCard">
          <span>다음 일정</span>
          <strong>
            {nextAppointment ? formatDday(nextAppointment.scheduled_at) : "등록하기"}
          </strong>
          <small>
            {nextAppointment
              ? `${nextAppointment.title} · ${new Date(nextAppointment.scheduled_at).toLocaleDateString("ko-KR")}`
              : "병원 일정을 기록해두세요."}
          </small>
        </Link>

        <Link href="/my/symptoms" className="metricCard">
          <span>최근 14일</span>
          <strong>{recentSymptoms.length}건</strong>
          <small>증상 기록</small>
        </Link>

        <Link href="/my/timeline" className="metricCard">
          <span>현재 치료</span>
          <strong>{currentTreatment?.cycle_label || currentTreatment?.name || "미등록"}</strong>
          <small>{currentTreatment?.name ?? "치료 여정을 추가해보세요."}</small>
        </Link>
      </section>

      <section className="section">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">RECENT LABS</p>
            <h3>최근 검사</h3>
          </div>
          <Link className="inlineLink" href="/my/labs">전체 보기</Link>
        </div>

        {!latestLabs.length ? (
          <p className="mutedText">아직 기록된 검사결과가 없습니다.</p>
        ) : (
          <div className="dataList">
            {latestLabs.map((lab) => (
              <article className="dataRow" key={lab.id}>
                <div>
                  <strong>{lab.test_name}</strong>
                  <small>{new Date(lab.measured_at).toLocaleDateString("ko-KR")}</small>
                </div>
                <b>{lab.value_numeric ?? lab.value_text ?? "-"} {lab.unit ?? ""}</b>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section softSection">
        <p className="eyebrow">VISIT PREPARATION</p>
        <h3>다음 진료 전에 최근 기록을 한 번에 정리하세요.</h3>
        <p>
          최근 증상·검사·치료·일정을 바탕으로 의료진과 확인할 내용을
          준비합니다.
        </p>
        <Link className="primaryLink compactLink" href="/my/visit-prep">진료 준비 시작</Link>
      </section>
    </main>
  );
}
