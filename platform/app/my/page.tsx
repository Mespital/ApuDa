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

function formatValue(value: number | string | null, unit?: string | null) {
  if (value === null || value === "") return "-";
  return `${value}${unit ? " " + unit : ""}`;
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
        .select("id,symptom_name,severity,recorded_at")
        .eq("profile_id", profile.id)
        .gte("recorded_at", since)
        .order("recorded_at", { ascending: false }),
      supabase
        .from("treatments")
        .select("id,name,cycle_label,treatment_type,started_on")
        .eq("profile_id", profile.id)
        .order("started_on", { ascending: false })
        .limit(1)
    ]);

  const nextAppointment = appointmentsResult.data?.[0];
  const latestLabs = labsResult.data ?? [];
  const latestLab = latestLabs[0];
  const recentSymptoms = symptomsResult.data ?? [];
  const currentTreatment = treatmentsResult.data?.[0];
  const symptomNames = [...new Set(recentSymptoms.map((item) => item.symptom_name))].slice(0, 3);
  const maxSeverity = recentSymptoms.reduce(
    (max, item) => Math.max(max, item.severity ?? 0),
    0
  );

  return (
    <main className="shell dashboardShell">
      <header className="dashboardTopbar">
        <div className="brandProfile">
          <p className="eyebrow">MY APUDA</p>
          <ProfileSwitcher profiles={profiles} activeId={profile.id} />
        </div>

        <Link className="profileAvatarButton" href="/my/profiles" aria-label="프로필 관리">
          <span>{profile.display_name.slice(0, 1)}</span>
          <small>MY</small>
        </Link>
      </header>

      <section className="dashboardHero">
        <div className="dashboardHeroCopy">
          <p className="eyebrow">TODAY</p>
          <h1>
            {profile.display_name}님의 건강 흐름을
            <br />
            한눈에 정리해요.
          </h1>
          <p>
            기록을 모으고, 변화를 확인하고, 다음 진료에서 필요한 질문까지 준비합니다.
          </p>
        </div>

        <div className="heroActions">
          <Link className="primaryLink dashboardPrimary" href="/my/record">
            <span>＋</span> 기록하기
          </Link>
          <Link className="secondaryLink dashboardSecondary" href="/my/ai">
            <span>✦</span> ApuDa Talk
          </Link>
          <Link className="secondaryLink dashboardSecondary" href="/my/visit-prep">
            진료 준비
          </Link>
        </div>
      </section>

      <section className="dashboardMetrics" aria-label="건강 요약">
        <Link href="/my/appointments" className="metricCardV2">
          <div className="metricTopline">
            <span className="metricIcon">□</span>
            <small>다음 일정</small>
          </div>
          <strong>{nextAppointment ? formatDday(nextAppointment.scheduled_at) : "일정 없음"}</strong>
          <p>
            {nextAppointment
              ? `${nextAppointment.title} · ${new Date(nextAppointment.scheduled_at).toLocaleDateString("ko-KR")}`
              : "외래·검사·치료 일정을 추가해보세요."}
          </p>
        </Link>

        <Link href="/my/symptoms" className="metricCardV2">
          <div className="metricTopline">
            <span className="metricIcon">●</span>
            <small>최근 14일 증상</small>
          </div>
          <strong>{recentSymptoms.length ? `${recentSymptoms.length}건` : "기록 없음"}</strong>
          <p>
            {symptomNames.length
              ? `${symptomNames.join(" · ")}${recentSymptoms.length ? ` · 최대 ${maxSeverity}/4` : ""}`
              : "오늘 상태를 남기면 흐름을 볼 수 있어요."}
          </p>
        </Link>

        <Link href="/my/timeline" className="metricCardV2">
          <div className="metricTopline">
            <span className="metricIcon">↗</span>
            <small>현재 치료</small>
          </div>
          <strong>{currentTreatment?.cycle_label || currentTreatment?.name || "미등록"}</strong>
          <p>{currentTreatment?.name ?? "치료 여정을 추가하면 타임라인에 연결됩니다."}</p>
        </Link>

        <Link href="/my/labs" className="metricCardV2">
          <div className="metricTopline">
            <span className="metricIcon">▤</span>
            <small>최근 검사</small>
          </div>
          <strong>{latestLab ? formatValue(latestLab.value_numeric ?? latestLab.value_text, latestLab.unit) : "기록 없음"}</strong>
          <p>
            {latestLab
              ? `${latestLab.test_name} · ${new Date(latestLab.measured_at).toLocaleDateString("ko-KR")}`
              : "검사지를 등록하면 최근 결과가 보여요."}
          </p>
        </Link>
      </section>

      <section className="quickActionSection">
        <div className="sectionHeading dashboardSectionHeading">
          <div>
            <p className="eyebrow">QUICK ACTION</p>
            <h2>바로 기록하기</h2>
          </div>
          <Link className="inlineLink" href="/my/record">전체 기록</Link>
        </div>

        <div className="quickActionGrid">
          <Link href="/my/labs" className="quickActionCard">
            <span>▤</span>
            <div>
              <strong>검사결과</strong>
              <small>사진 또는 직접 입력</small>
            </div>
          </Link>
          <Link href="/my/symptoms" className="quickActionCard">
            <span>●</span>
            <div>
              <strong>오늘 상태</strong>
              <small>증상과 불편 정도 기록</small>
            </div>
          </Link>
          <Link href="/my/medications" className="quickActionCard">
            <span>Rx</span>
            <div>
              <strong>복약</strong>
              <small>약 이름과 복용법 정리</small>
            </div>
          </Link>
          <Link href="/my/appointments" className="quickActionCard">
            <span>□</span>
            <div>
              <strong>병원 일정</strong>
              <small>외래·검사·치료 등록</small>
            </div>
          </Link>
        </div>
      </section>

      <div className="homeContentGrid">
        <section className="section homePrimarySection">
          <div className="sectionHeading">
            <div>
              <p className="eyebrow">RECENT LABS</p>
              <h3>최근 검사</h3>
            </div>
            <Link className="inlineLink" href="/my/labs">전체 보기</Link>
          </div>

          {!latestLabs.length ? (
            <div className="emptyPanel">
              <span className="emptyPanelIcon">▤</span>
              <div>
                <strong>아직 검사결과가 없어요.</strong>
                <p>검사지를 업로드하거나 직접 입력하면 날짜순으로 정리됩니다.</p>
              </div>
              <Link className="secondaryLink" href="/my/labs">검사 등록</Link>
            </div>
          ) : (
            <div className="dataList dashboardDataList">
              {latestLabs.map((lab) => (
                <article className="dataRow" key={lab.id}>
                  <div>
                    <strong>{lab.test_name}</strong>
                    <small>{new Date(lab.measured_at).toLocaleDateString("ko-KR")}</small>
                  </div>
                  <b>{formatValue(lab.value_numeric ?? lab.value_text, lab.unit)}</b>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="section talkTeaserSection">
          <div className="talkTeaserIcon">✦</div>
          <p className="eyebrow">APUDA TALK</p>
          <h3>기록을 질문으로 바꿔보세요.</h3>
          <p>
            최근 검사·증상·치료·복약을 바탕으로 다음 진료에서 확인할 내용을 정리합니다.
          </p>
          <div className="talkTeaserPrompts">
            <span>최근 검사 요약</span>
            <span>증상 흐름 정리</span>
            <span>진료 질문 만들기</span>
          </div>
          <Link className="primaryLink compactLink" href="/my/ai">ApuDa Talk 열기</Link>
        </section>
      </div>

      <section className="section visitPrepBanner">
        <div>
          <p className="eyebrow">VISIT PREPARATION</p>
          <h3>
            {nextAppointment
              ? `${formatDday(nextAppointment.scheduled_at)} · 다음 진료를 준비할 시간이에요.`
              : "다음 진료 전에 기록을 한 장으로 정리하세요."}
          </h3>
          <p>
            최근 증상·검사·치료·복약·일정을 모아 의료진과 확인할 질문을 준비합니다.
          </p>
        </div>
        <Link className="primaryLink" href="/my/visit-prep">진료 준비 시작</Link>
      </section>
    </main>
  );
}
