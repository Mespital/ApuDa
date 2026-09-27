import Link from "next/link";
import ApuDaTalkPanel from "@/components/ApuDaTalkPanel";
import { redirect } from "next/navigation";
import { getActiveProfile } from "@/lib/active-profile";
import { createClient } from "@/lib/supabase/server";

export default async function ApuDaAIPage() {
  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const [
    symptomsResult,
    labsResult,
    treatmentsResult,
    medicationsResult,
    appointmentResult
  ] = await Promise.all([
    supabase
      .from("symptom_logs")
      .select("id,symptom_name,severity,recorded_at")
      .eq("profile_id", profile.id)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false }),
    supabase
      .from("labs")
      .select("id,test_name,value_numeric,value_text,unit,measured_at")
      .eq("profile_id", profile.id)
      .order("measured_at", { ascending: false })
      .limit(4),
    supabase
      .from("treatments")
      .select("id,name,cycle_label,treatment_type,started_on")
      .eq("profile_id", profile.id)
      .order("started_on", { ascending: false })
      .limit(1),
    supabase
      .from("medications")
      .select("id,name,dose_text,frequency_text")
      .eq("profile_id", profile.id)
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("appointments")
      .select("id,title,hospital_name,department,scheduled_at")
      .eq("profile_id", profile.id)
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(1)
  ]);

  const symptoms = symptomsResult.data ?? [];
  const labs = labsResult.data ?? [];
  const treatment = treatmentsResult.data?.[0];
  const medications = medicationsResult.data ?? [];
  const appointment = appointmentResult.data?.[0];

  const symptomNames = [...new Set(symptoms.map((item) => item.symptom_name))];
  const maxSeverity = symptoms.reduce(
    (max, item) => Math.max(max, item.severity ?? 0),
    0
  );

  return (
    <main className="shell">
      <p className="eyebrow">APUDA AI · {profile.display_name}</p>
      <h1 className="pageTitle">내 기록을 한눈에 정리해요.</h1>
      <p className="heroCopy">
        ApuDa AI는 진단을 대신하지 않고, 내가 남긴 건강기록을 다시 찾기 쉽게
        정리하고 다음 진료에서 확인할 내용을 준비하는 Care Navigation에
        집중합니다.
      </p>

      <section className="metricsGrid">
        <article className="metricCard">
          <span>최근 14일 증상</span>
          <strong>{symptoms.length}건</strong>
          <small>
            {symptomNames.length
              ? symptomNames.slice(0, 3).join(" · ")
              : "기록된 증상이 없습니다."}
          </small>
        </article>

        <article className="metricCard">
          <span>최근 불편 정도</span>
          <strong>{symptoms.length ? maxSeverity + " / 4" : "-"}</strong>
          <small>기록 중 가장 높은 단계</small>
        </article>

        <article className="metricCard">
          <span>현재 복약</span>
          <strong>{medications.length}개</strong>
          <small>
            {medications.length
              ? medications.slice(0, 2).map((item) => item.name).join(" · ")
              : "등록된 약이 없습니다."}
          </small>
        </article>
      </section>

      <section className="section">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">CONTEXT</p>
            <h3>현재 기록 맥락</h3>
          </div>
        </div>

        <div className="contextGrid">
          <article className="contextCard">
            <span>치료</span>
            <strong>{treatment?.cycle_label || treatment?.name || "미등록"}</strong>
            <p>{treatment?.name ?? "치료 여정을 추가하면 여기에 연결됩니다."}</p>
          </article>

          <article className="contextCard">
            <span>다음 일정</span>
            <strong>{appointment?.title ?? "미등록"}</strong>
            <p>
              {appointment
                ? new Date(appointment.scheduled_at).toLocaleString("ko-KR", {
                    dateStyle: "medium",
                    timeStyle: "short"
                  })
                : "외래·검사·치료 일정을 추가해 주세요."}
            </p>
          </article>
        </div>
      </section>

      <section className="section">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">RECENT LABS</p>
            <h3>최근 검사</h3>
          </div>
          <Link className="inlineLink" href="/my/labs">검사 기록</Link>
        </div>

        {!labs.length ? (
          <p className="mutedText">아직 검사 기록이 없습니다.</p>
        ) : (
          <div className="dataList">
            {labs.map((lab) => (
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

      <section className="section">
        <p className="eyebrow">APUDA TALK</p>
        <h3>내 기록을 바탕으로 질문하기</h3>
        <p className="mutedText">
          기본 모드에서는 기록을 로컬 규칙으로 정리하고, 서버에 외부 AI 제공자가 명시적으로 설정된 경우에만 별도 선택 동의 후 생성형 AI를 사용합니다.
        </p>
        <ApuDaTalkPanel profileId={profile.id} />
      </section>

      <section className="section softSection">
        <p className="eyebrow">NEXT BEST ACTION</p>
        <h3>다음 진료가 있다면 기록을 한 장으로 정리해보세요.</h3>
        <p>
          최근 증상, 검사, 치료, 복약과 다음 일정을 모아 의료진에게 확인할
          질문을 준비합니다.
        </p>
        <div className="buttonRow leftButtons">
          <Link className="primaryLink compactLink" href="/my/visit-prep">
            진료 준비 시작
          </Link>
          <Link className="secondaryLink compactLink" href="/my/record">
            기록 추가
          </Link>
        </div>
      </section>

      <p className="safetyNote">
        ApuDa AI는 진단·처방·약 중단·용량 변경 또는 치료효과 판정을 지시하지 않습니다.
      </p>
    </main>
  );
}
