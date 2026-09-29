import Link from "next/link";
import { redirect } from "next/navigation";
import ProfileSwitcher from "@/components/ProfileSwitcher";
import ApuDaTalkOpenButton from "@/components/ApuDaTalkOpenButton";
import TodayJournalComposer from "@/components/TodayJournalComposer";
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

function HealthIcon({ name }: { name: "lab" | "symptom" | "medication" | "calendar" | "treatment" }) {
  const paths = {
    lab: (
      <>
        <path d="M7 3h10v4H7z" />
        <path d="M8 7v13h8V7" />
        <path d="M10 11h4M10 15h4" />
      </>
    ),
    symptom: (
      <>
        <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
        <path d="M8.5 12h2l1-2 1.5 4 1-2h1.5" />
      </>
    ),
    medication: (
      <>
        <path d="M9 4h6a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z" />
        <path d="M9 4V2h6v2M9 12h6M12 9v6" />
      </>
    ),
    calendar: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 9h16M8 13h3M13 13h3M8 16h3" />
      </>
    ),
    treatment: (
      <>
        <path d="M5 12h4l2-4 3 8 2-4h3" />
        <circle cx="12" cy="12" r="9" />
      </>
    )
  };

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {paths[name]}
    </svg>
  );
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

  const [appointmentsResult, labsResult, symptomsResult, treatmentsResult, journalResult] =
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
        .limit(1),
      supabase
        .from("journal_entries")
        .select("id,body,tags,recorded_at")
        .eq("profile_id", profile.id)
        .order("recorded_at", { ascending: false })
        .limit(3)
    ]);

  const nextAppointment = appointmentsResult.data?.[0];
  const latestLabs = labsResult.data ?? [];
  const recentSymptoms = symptomsResult.data ?? [];
  const currentTreatment = treatmentsResult.data?.[0];
  const recentJournal = journalResult.data ?? [];
  const hasTodayOverview = Boolean(nextAppointment || recentSymptoms.length || currentTreatment);
  const hasStructuredHealthData = Boolean(hasTodayOverview || latestLabs.length);

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

        <nav className="calmDesktopNav" aria-label="My ApuDa 주요 메뉴">
          <Link href="/my">오늘</Link>
          <Link href="/my/record">기록</Link>
          <Link href="/my/timeline">분석</Link>
          <Link href="/my/visit-prep">진료 준비</Link>
        </nav>

        <Link className="calmProfileButton" href="/my/profiles" aria-label="프로필 관리">
          <span>{profile.display_name.slice(0, 1)}</span>
          <div>
            <small>프로필</small>
            <b>{profile.display_name}</b>
          </div>
        </Link>
      </header>

      <section className={`calmHero ${hasStructuredHealthData ? "" : "isEmptyHero"}`}>
        <div className="calmHeroMain">
          <div className="calmDatePill">
            <span className="calmDateDot" />
            {formatToday()}
          </div>
          <h1>
            {profile.display_name}님,
            <br />
            오늘 필요한 기록만 챙겨요.
          </h1>
          <p>
            검사·증상·복약·일정을 한곳에 모아 다음 진료를 더 편하게 준비하세요.
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

        <aside className={`calmTodayCard ${hasTodayOverview ? "" : "isEmpty"}`} aria-label="오늘 한눈에">
          <p className="eyebrow">오늘 한눈에</p>
          {hasTodayOverview ? (
            <div className="calmTodayList">
              <Link href="/my/appointments">
                <span className="calmMiniIcon"><HealthIcon name="calendar" /></span>
                <div>
                  <small>다음 일정</small>
                  <strong>{nextAppointment ? formatDday(nextAppointment.scheduled_at) : "없음"}</strong>
                </div>
                <b>›</b>
              </Link>
              <Link href="/my/symptoms">
                <span className="calmMiniIcon"><HealthIcon name="symptom" /></span>
                <div>
                  <small>최근 14일 증상</small>
                  <strong>{recentSymptoms.length ? `${recentSymptoms.length}건` : "없음"}</strong>
                </div>
                <b>›</b>
              </Link>
              <Link href="/my/timeline">
                <span className="calmMiniIcon"><HealthIcon name="treatment" /></span>
                <div>
                  <small>현재 치료</small>
                  <strong>{currentTreatment?.cycle_label || currentTreatment?.name || "없음"}</strong>
                </div>
                <b>›</b>
              </Link>
            </div>
          ) : (
            <div className="calmTodayEmpty">
              <span><HealthIcon name="treatment" /></span>
              <strong>아직 모인 기록이 없어요.</strong>
              <p>첫 기록을 남기면 일정·증상·치료 흐름을 여기에서 바로 확인할 수 있어요.</p>
              <Link href="/my/record">첫 기록 남기기</Link>
            </div>
          )}
        </aside>
      </section>

      {hasTodayOverview && (
        <section className="calmMobileSummary" aria-label="오늘 한눈에">
          <p>오늘 한눈에</p>
          <div>
            <Link href="/my/appointments">
              <small>다음 일정</small>
              <strong>{nextAppointment ? formatDday(nextAppointment.scheduled_at) : "없음"}</strong>
            </Link>
            <Link href="/my/symptoms">
              <small>최근 증상</small>
              <strong>{recentSymptoms.length ? `${recentSymptoms.length}건` : "없음"}</strong>
            </Link>
            <Link href="/my/timeline">
              <small>현재 치료</small>
              <strong>{currentTreatment?.cycle_label || currentTreatment?.name || "없음"}</strong>
            </Link>
          </div>
        </section>
      )}

      <section className="journalHomeSection">
        <TodayJournalComposer profileId={profile.id} />

        {recentJournal.length > 0 && (
          <div className="journalRecent">
            <div className="journalRecentHeader">
              <div>
                <p className="eyebrow">지난 기록</p>
                <h2>최근에 남긴 한 줄</h2>
              </div>
              <Link href="/my/journal">모두 보기</Link>
            </div>
            <div className="journalRecentList">
              {recentJournal.map((entry) => (
                <Link href="/my/journal" className="journalRecentItem" key={entry.id}>
                  <time>
                    {new Date(entry.recorded_at).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric"
                    })}
                  </time>
                  <p>{entry.body}</p>
                  {entry.tags.length > 0 && (
                    <div>
                      {entry.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </section>

      {hasStructuredHealthData && (
        <section className="calmSection">
          <div className="calmSectionHeader">
          <div>
            <p className="eyebrow">빠른 기록</p>
            <h2>필요한 기록을 바로 남겨요.</h2>
            <p>검사·증상·복약·일정을 한곳에서 시작하세요.</p>
          </div>
          <Link href="/my/record">전체 기록 보기</Link>
        </div>

        <div className="calmQuickSurface">
          <div className="calmQuickGrid">
          <Link href="/my/labs" className="calmQuickCard labQuick">
            <span className="calmQuickIcon"><HealthIcon name="lab" /></span>
            <div>
              <strong>검사결과</strong>
              <small>사진으로 올리거나 직접 입력</small>
            </div>
            <b>›</b>
          </Link>
          <Link href="/my/symptoms" className="calmQuickCard symptomQuick">
            <span className="calmQuickIcon"><HealthIcon name="symptom" /></span>
            <div>
              <strong>오늘 상태</strong>
              <small>몸의 변화를 짧게 기록</small>
            </div>
            <b>›</b>
          </Link>
          <Link href="/my/medications" className="calmQuickCard medicationQuick">
            <span className="calmQuickIcon"><HealthIcon name="medication" /></span>
            <div>
              <strong>복약</strong>
              <small>복용 중인 약을 한곳에</small>
            </div>
            <b>›</b>
          </Link>
          <Link href="/my/appointments" className="calmQuickCard appointmentQuick">
            <span className="calmQuickIcon"><HealthIcon name="calendar" /></span>
            <div>
              <strong>병원 일정</strong>
              <small>외래·검사·치료 일정 저장</small>
            </div>
            <b>›</b>
          </Link>
          </div>
        </div>
        </section>
      )}

      {hasStructuredHealthData ? (
        <section className="calmContentGrid">
          <div className="calmPanel calmLabsPanel">
            <div className="calmPanelHeader">
              <div>
                <p className="eyebrow">최근 검사</p>
                <h2>최근 검사</h2>
              </div>
              <Link href="/my/labs">전체 보기</Link>
            </div>

            {!latestLabs.length ? (
              <div className="calmEmptyState compact">
                <span><HealthIcon name="lab" /></span>
                <div>
                  <strong>아직 등록된 검사결과가 없어요.</strong>
                  <p>검사지를 사진으로 올리거나 직접 입력해 날짜순으로 정리할 수 있어요.</p>
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

          <aside className={`calmPanel calmVisitPanel ${nextAppointment ? "hasAppointment" : "noAppointment"}`}>
            <span className="calmVisitIcon"><HealthIcon name="calendar" /></span>
            <p className="eyebrow">진료 준비</p>
            <h2>
              {nextAppointment
                ? `${formatDday(nextAppointment.scheduled_at)}, 진료 준비를 시작해볼까요?`
                : "다음 진료를 미리 준비해볼까요?"}
            </h2>
            <p>
              {nextAppointment
                ? "최근 기록과 질문을 한곳에 모아 진료 전에 빠르게 확인하세요."
                : "병원 일정이 생기면 최근 기록과 질문을 모아 진료 준비를 도와드려요."}
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
              {nextAppointment ? "진료 준비 시작" : "진료 준비 둘러보기"}
            </Link>
          </aside>
        </section>
      ) : (
        <section className="calmOnboardingPanel" aria-label="첫 기록 시작">
          <div className="calmOnboardingIcon"><HealthIcon name="lab" /></div>
          <div className="calmOnboardingCopy">
            <p className="eyebrow">첫 기록 시작</p>
            <h2>한 가지 기록부터 시작하면 충분해요.</h2>
            <p>
              검사결과, 오늘 상태, 복약, 병원 일정 중 지금 가장 필요한 것 하나만 남겨보세요.
              기록이 쌓이면 최근 변화와 다음 진료 준비가 자동으로 정리됩니다.
            </p>
          </div>
          <div className="calmOnboardingActions">
            <Link href="/my/labs">검사결과</Link>
            <Link href="/my/symptoms">오늘 상태</Link>
            <Link href="/my/medications">복약</Link>
            <Link href="/my/appointments">병원 일정</Link>
          </div>
        </section>
      )}

   </main>
  );
}
