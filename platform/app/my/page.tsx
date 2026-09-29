import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import ApuDaTalkOpenButton from "@/components/ApuDaTalkOpenButton";
import { getActiveProfile } from "@/lib/active-profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

function formatDday(iso: string) {
  const now = new Date();
  const target = new Date(iso);
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const end = new Date(target.getFullYear(), target.getMonth(), target.getDate()).getTime();
  const days = Math.round((end - start) / 86400000);
  if (days === 0) return "오늘";
  return days > 0 ? `D-${days}` : `D+${Math.abs(days)}`;
}

function formatValue(value: number | string | null, unit?: string | null) {
  if (value === null || value === "") return "-";
  return `${value}${unit ? " " + unit : ""}`;
}

function formatToday() {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short"
  }).format(new Date());
}

export default async function MyApuDaPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="shell">
        <section className="section">
          <p className="eyebrow">MY APUDA · SETUP</p>
          <h1 className="pageTitle">ApuDa Health OS</h1>
          <p className="heroCopy">
            Supabase 환경변수를 연결하면 ApuDa ID와 실제 건강기록 기능이 활성화됩니다.
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
  const symptomNames = [...new Set(recentSymptoms.map((item) => item.symptom_name))].slice(0, 2);

  return (
    <main className="shell dashboardShell calmHome">
      <header className="calmTopbar">
        <div className="calmBrand">
          <div>
            <p className="eyebrow">MY APUDA</p>
            <strong>내 건강 기록</strong>
          </div>
          <ProfileSwitcher profiles={profiles} activeId={profile.id} />
        </div>

        <Link className="calmProfileButton" href="/my/profiles" aria-label="프로필 관리">
          <span>{profile.display_name.slice(0, 1)}</span>
          <div>
            <small>프로필</small>
            <b>{profile.display_name}</b>
          </div>
        </Link>
      </header>

      <section className="calmHero">
        <div className="calmHeroMain">
          <div className="calmDatePill">
            <span className="calmDateDot" />
            {formatToday()}
          </div>
          <h1>
            {profile.display_name}님,
            <br />
            오늘 필요한 것만 천천히 챙겨요.
          </h1>
          <p>
            기록은 완벽하지 않아도 괜찮아요. 검사·증상·복약·일정을 조금씩 모아두면
            다음 진료 때 훨씬 편해집니다.
          </p>
          <div className="calmHeroActions">
            <Link className="calmPrimaryAction" href="/my/record">
              <span>＋</span>
              기록 남기기
            </Link>
            <ApuDaTalkOpenButton className="calmSecondaryAction">
              <span>✦</span>
              ApuDa에게 물어보기
            </ApuDaTalkOpenButton>
          </div>
        </div>

        <aside className="calmTodayCard">
          <p className="eyebrow">오늘 한눈에</p>
          <div className="calmTodayList">
            <Link href="/my/appointments">
              <span className="calmMiniIcon">□</span>
              <div>
                <small>다음 일정</small>
                <strong>{nextAppointment ? formatDday(nextAppointment.scheduled_at) : "아직 없어요"}</strong>
              </div>
              <b>›</b>
            </Link>
            <Link href="/my/symptoms">
              <span className="calmMiniIcon">●</span>
              <div>
                <small>최근 14일 증상</small>
                <strong>{recentSymptoms.length ? `${recentSymptoms.length}건` : "아직 없어요"}</strong>
              </div>
              <b>›</b>
            </Link>
            <Link href="/my/timeline">
              <span className="calmMiniIcon">↗</span>
              <div>
                <small>현재 치료</small>
                <strong>{currentTreatment?.cycle_label || currentTreatment?.name || "아직 없어요"}</strong>
              </div>
              <b>›</b>
            </Link>
          </div>
        </aside>
      </section>

      <section className="calmSection">
        <div className="calmSectionHeader">
          <div>
            <p className="eyebrow">QUICK RECORD</p>
            <h2>바로 남길 수 있어요.</h2>
            <p>지금 필요한 기록 하나만 골라 시작해보세요.</p>
          </div>
          <Link href="/my/record">전체 기록 보기</Link>
        </div>

        <div className="calmQuickGrid">
          <Link href="/my/labs" className="calmQuickCard labQuick">
            <span className="calmQuickIcon">▤</span>
            <div>
              <strong>검사결과</strong>
              <small>사진으로 올리거나 직접 입력</small>
            </div>
            <b>›</b>
          </Link>
          <Link href="/my/symptoms" className="calmQuickCard symptomQuick">
            <span className="calmQuickIcon">●</span>
            <div>
              <strong>오늘 상태</strong>
              <small>몸의 변화를 짧게 기록</small>
            </div>
            <b>›</b>
          </Link>
          <Link href="/my/medications" className="calmQuickCard medicationQuick">
            <span className="calmQuickIcon">Rx</span>
            <div>
              <strong>복약</strong>
              <small>복용 중인 약을 한곳에</small>
            </div>
            <b>›</b>
          </Link>
          <Link href="/my/appointments" className="calmQuickCard appointmentQuick">
            <span className="calmQuickIcon">□</span>
            <div>
              <strong>병원 일정</strong>
              <small>외래·검사·치료 일정 저장</small>
            </div>
            <b>›</b>
          </Link>
        </div>
      </section>

      <section className="calmContentGrid">
        <div className="calmPanel calmLabsPanel">
          <div className="calmPanelHeader">
            <div>
              <p className="eyebrow">RECENT LABS</p>
              <h2>최근 검사</h2>
            </div>
            <Link href="/my/labs">전체 보기</Link>
          </div>

          {!latestLabs.length ? (
            <div className="calmEmptyState">
              <span>▤</span>
              <div>
                <strong>아직 등록된 검사결과가 없어요.</strong>
                <p>검사지를 사진으로 올리면 날짜순으로 차곡차곡 정리해드릴게요.</p>
              </div>
              <Link href="/my/labs">검사 결과 올리기</Link>
            </div>
          ) : (
            <div className="calmLabList">
              {latestLabs.map((lab) => (
                <article key={lab.id}>
                  <div>
                    <strong>{lab.test_name}</strong>
                    <small>{new Date(lab.measured_at).toLocaleDateString("ko-KR")}</small>
                  </div>
                  <b>{formatValue(lab.value_numeric ?? lab.value_text, lab.unit)}</b>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="calmPanel calmVisitPanel">
          <span className="calmVisitIcon">✓</span>
          <p className="eyebrow">NEXT VISIT</p>
          <h2>
            {nextAppointment
              ? `${formatDday(nextAppointment.scheduled_at)}, 진료 준비를 시작해볼까요?`
              : "다음 진료 전에 미리 정리해둘까요?"}
          </h2>
          <p>
            최근 기록을 한 장에 모으고 의료진에게 꼭 물어볼 내용을 미리 챙겨드려요.
          </p>
          {nextAppointment && (
            <div className="calmVisitMeta">
              <strong>{nextAppointment.title}</strong>
              <span>
                {new Date(nextAppointment.scheduled_at).toLocaleDateString("ko-KR")}
                {nextAppointment.department ? ` · ${nextAppointment.department}` : ""}
              </span>
            </div>
          )}
          <Link className="calmVisitButton" href="/my/visit-prep">
            진료 준비 시작
          </Link>
        </aside>
      </section>

      <section className="calmAssistCard">
        <div className="calmAssistCopy">
          <span className="calmAssistIcon">✦</span>
          <div>
            <p className="eyebrow">APUDA TALK</p>
            <h2>기록을 보고 궁금한 게 생겼나요?</h2>
            <p>
              최근 검사·증상·치료·복약을 바탕으로 이해하기 쉽게 같이 정리해드릴게요.
            </p>
          </div>
        </div>
        <ApuDaTalkOpenButton className="calmAssistButton">
          질문하기
        </ApuDaTalkOpenButton>
      </section>
    </main>
  );
}
