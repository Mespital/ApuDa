import Link from "next/link";
import { redirect } from "next/navigation";
import VisitQuestionForm from "@/components/VisitQuestionForm";
import { getActiveProfile } from "@/lib/active-profile";
import { createClient } from "@/lib/supabase/server";

export default async function VisitPrepPage() {
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
    appointmentResult,
    medicationsResult,
    questionsResult,
    biomarkersResult,
    imagingResult
  ] = await Promise.all([
    supabase
      .from("symptom_logs")
      .select("id,symptom_name,severity,note,recorded_at")
      .eq("profile_id", profile.id)
      .gte("recorded_at", since)
      .order("recorded_at", { ascending: false }),
    supabase
      .from("labs")
      .select("id,test_name,value_numeric,value_text,unit,measured_at")
      .eq("profile_id", profile.id)
      .order("measured_at", { ascending: false })
      .limit(8),
    supabase
      .from("treatments")
      .select("id,name,cycle_label,treatment_type,started_on")
      .eq("profile_id", profile.id)
      .order("started_on", { ascending: false })
      .limit(3),
    supabase
      .from("appointments")
      .select("id,title,hospital_name,department,scheduled_at")
      .eq("profile_id", profile.id)
      .gte("scheduled_at", now)
      .order("scheduled_at", { ascending: true })
      .limit(1),
    supabase
      .from("medications")
      .select("id,name,dose_text,frequency_text,route")
      .eq("profile_id", profile.id)
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("visit_questions")
      .select("id,question,status,created_at")
      .eq("profile_id", profile.id)
      .eq("status", "open")
      .order("created_at", { ascending: true }),
    supabase
      .from("biomarkers")
      .select("id,name,result_text,result_numeric,unit,tested_on")
      .eq("profile_id", profile.id)
      .order("tested_on", { ascending: false, nullsFirst: false })
      .limit(10),
    supabase
      .from("imaging")
      .select("id,modality,body_part,study_date,summary,response_category")
      .eq("profile_id", profile.id)
      .order("study_date", { ascending: false })
      .limit(5)
  ]);

  const symptoms = symptomsResult.data ?? [];
  const labs = labsResult.data ?? [];
  const treatments = treatmentsResult.data ?? [];
  const appointment = appointmentResult.data?.[0];
  const medications = medicationsResult.data ?? [];
  const savedQuestions = questionsResult.data ?? [];
  const biomarkers = biomarkersResult.data ?? [];
  const imaging = imagingResult.data ?? [];

  const symptomCounts = new Map<string, { count: number; maxSeverity: number }>();
  for (const item of symptoms) {
    const current = symptomCounts.get(item.symptom_name) ?? { count: 0, maxSeverity: 0 };
    symptomCounts.set(item.symptom_name, {
      count: current.count + 1,
      maxSeverity: Math.max(current.maxSeverity, item.severity ?? 0)
    });
  }

  const suggestedQuestions: string[] = [];
  for (const [name, info] of symptomCounts) {
    if (info.maxSeverity >= 2) {
      suggestedQuestions.push(
        `${name} 증상이 반복되거나 일상에 영향을 주고 있는데 어떤 점을 확인하면 좋을까요?`
      );
    }
  }
  if (treatments.length) {
    suggestedQuestions.push("현재 치료의 다음 단계와 예정된 평가 시점을 확인하고 싶습니다.");
  }
  if (labs.length) {
    suggestedQuestions.push("최근 검사결과 중 치료나 일상관리와 관련해 특히 확인해야 할 항목이 있을까요?");
  }
  if (medications.length) {
    suggestedQuestions.push("현재 복용 중인 약을 계속 같은 방식으로 복용하면 되는지 확인하고 싶습니다.");
  }
  if (biomarkers.length) {
    suggestedQuestions.push("등록된 바이오마커 결과가 현재 치료 선택이나 추적 계획에서 어떤 의미인지 확인하고 싶습니다.");
  }
  if (imaging.length) {
    suggestedQuestions.push("최근 영상검사 결과와 다음 영상평가 계획을 함께 확인하고 싶습니다.");
  }

  return (
    <main className="shell">
      <p className="eyebrow">VISIT PREPARATION · {profile.display_name}</p>
      <h1 className="pageTitle">다음 진료 준비</h1>
      <p className="heroCopy">
        최근 14일의 기록을 모아 진료실에서 빠뜨리지 않고 확인할 내용을 정리합니다.
      </p>

      {appointment && (
        <section className="visitHero">
          <span>다음 일정</span>
          <strong>{appointment.title}</strong>
          <p>
            {new Date(appointment.scheduled_at).toLocaleString("ko-KR", {
              dateStyle: "full",
              timeStyle: "short"
            })}
          </p>
          <small>{appointment.hospital_name ?? ""} {appointment.department ?? ""}</small>
        </section>
      )}

      <section className="section">
        <p className="eyebrow">RECENT CONDITION</p>
        <h3>최근 14일 증상</h3>
        {!symptomCounts.size ? (
          <p className="mutedText">최근 증상 기록이 없습니다.</p>
        ) : (
          <div className="chipList">
            {[...symptomCounts.entries()].map(([name, info]) => (
              <span className="infoChip" key={name}>
                {name} · {info.count}회 · 최대 {info.maxSeverity}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <p className="eyebrow">RECENT LABS</p>
        <h3>최근 검사</h3>
        {!labs.length ? (
          <p className="mutedText">검사 기록이 없습니다.</p>
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
        <p className="eyebrow">CURRENT TREATMENT</p>
        <h3>치료 기록</h3>
        {!treatments.length ? (
          <p className="mutedText">치료 기록이 없습니다.</p>
        ) : (
          <div className="chipList">
            {treatments.map((item) => (
              <span className="infoChip" key={item.id}>
                {item.name} {item.cycle_label ?? ""}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <p className="eyebrow">IMAGING</p>
        <h3>최근 영상검사</h3>
        {!imaging.length ? (
          <p className="mutedText">등록된 영상검사 결과가 없습니다.</p>
        ) : (
          <div className="dataList">
            {imaging.map((item) => (
              <article className="dataRow" key={item.id}>
                <div>
                  <strong>{item.modality} {item.body_part ?? ""}</strong>
                  <small>{new Date(item.study_date).toLocaleDateString("ko-KR")}</small>
                  {item.summary && <small>{item.summary}</small>}
                </div>
                {item.response_category && <span className="statusPill">{item.response_category}</span>}
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <p className="eyebrow">BIOMARKERS</p>
        <h3>바이오마커</h3>
        {!biomarkers.length ? (
          <p className="mutedText">등록된 바이오마커 결과가 없습니다.</p>
        ) : (
          <div className="chipList">
            {biomarkers.map((item) => (
              <span className="infoChip" key={item.id}>
                {item.name} · {item.result_text ?? item.result_numeric ?? "-"} {item.unit ?? ""}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <p className="eyebrow">MEDICATIONS</p>
        <h3>현재 복약</h3>
        {!medications.length ? (
          <p className="mutedText">복약 기록이 없습니다.</p>
        ) : (
          <div className="dataList">
            {medications.map((item) => (
              <article className="dataRow" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    {[item.dose_text, item.frequency_text, item.route]
                      .filter(Boolean)
                      .join(" · ")}
                  </small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section softSection">
        <p className="eyebrow">SUGGESTED QUESTIONS</p>
        <h3>기록을 보고 준비한 질문</h3>
        {!suggestedQuestions.length ? (
          <p className="mutedText">
            기록을 추가하면 상황에 맞는 질문 준비를 도와드립니다.
          </p>
        ) : (
          <ol className="questionList">
            {suggestedQuestions.slice(0, 6).map((question) => (
              <li key={question}>{question}</li>
            ))}
          </ol>
        )}
        <p className="safetyNote">
          이 질문은 진단이나 처방이 아니라 의료진과의 상담을 준비하기 위한 참고용입니다.
        </p>
      </section>

      <section className="section">
        <p className="eyebrow">MY QUESTIONS</p>
        <h3>내가 꼭 물어볼 질문</h3>

        {savedQuestions.length > 0 && (
          <ol className="questionList savedQuestions">
            {savedQuestions.map((item) => (
              <li key={item.id}>{item.question}</li>
            ))}
          </ol>
        )}

        <VisitQuestionForm profileId={profile.id} />
      </section>

      <section className="section summaryCta">
        <div>
          <p className="eyebrow">ONE-PAGE SUMMARY</p>
          <h3>진료실에서 바로 볼 한 장 요약</h3>
          <p className="mutedText">
            증상·검사·치료·복약·질문을 한 장으로 정리해 인쇄하거나 PDF로 저장할 수 있습니다.
          </p>
        </div>
        <Link className="primaryLink" href="/my/visit-summary">
          한 장 요약 열기
        </Link>
      </section>

      <div className="buttonRow leftButtons">
        <Link className="secondaryLink" href="/my/symptoms">증상 추가</Link>
        <Link className="secondaryLink" href="/my/labs">검사 추가</Link>
        <Link className="secondaryLink" href="/my/medications">복약 관리</Link>
        <Link className="secondaryLink" href="/my/biomarkers">바이오마커</Link>
        <Link className="secondaryLink" href="/my/imaging">영상검사</Link>
        <Link className="secondaryLink" href="/my/appointments">일정 관리</Link>
      </div>
    </main>
  );
}
