import { redirect } from "next/navigation";
import PrintButton from "@/components/PrintButton";
import { getActiveProfile } from "@/lib/active-profile";
import { createClient } from "@/lib/supabase/server";

export default async function VisitSummaryPage() {
  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();
  const since = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const [symptomsResult, labsResult, treatmentsResult, medicationsResult, appointmentResult, questionsResult] =
    await Promise.all([
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
        .from("medications")
        .select("id,name,dose_text,frequency_text,route")
        .eq("profile_id", profile.id)
        .eq("active", true)
        .order("created_at", { ascending: false }),
      supabase
        .from("appointments")
        .select("id,title,hospital_name,department,scheduled_at")
        .eq("profile_id", profile.id)
        .gte("scheduled_at", now)
        .order("scheduled_at", { ascending: true })
        .limit(1),
      supabase
        .from("visit_questions")
        .select("id,question,status,created_at")
        .eq("profile_id", profile.id)
        .eq("status", "open")
        .order("created_at", { ascending: true })
    ]);

  const symptoms = symptomsResult.data ?? [];
  const labs = labsResult.data ?? [];
  const treatments = treatmentsResult.data ?? [];
  const medications = medicationsResult.data ?? [];
  const appointment = appointmentResult.data?.[0];
  const questions = questionsResult.data ?? [];

  const symptomMap = new Map<string, { count: number; maxSeverity: number; notes: string[] }>();
  for (const row of symptoms) {
    const current = symptomMap.get(row.symptom_name) ?? { count: 0, maxSeverity: 0, notes: [] };
    symptomMap.set(row.symptom_name, {
      count: current.count + 1,
      maxSeverity: Math.max(current.maxSeverity, row.severity ?? 0),
      notes: row.note ? [...current.notes, row.note] : current.notes
    });
  }

  return (
    <main className="printShell">
      <header className="printHeader">
        <div>
          <p className="eyebrow">APUDA VISIT SUMMARY</p>
          <h1>{profile.display_name}님의 진료 준비 요약</h1>
          <p>최근 14일 기록 기준 · {new Date().toLocaleDateString("ko-KR")}</p>
        </div>
        <PrintButton />
      </header>

      {appointment && (
        <section className="printSection">
          <h2>다음 일정</h2>
          <p><strong>{appointment.title}</strong></p>
          <p>{new Date(appointment.scheduled_at).toLocaleString("ko-KR", { dateStyle: "full", timeStyle: "short" })}</p>
          <p>{appointment.hospital_name ?? ""} {appointment.department ?? ""}</p>
        </section>
      )}

      <section className="printSection">
        <h2>최근 증상</h2>
        {!symptomMap.size ? (
          <p>기록 없음</p>
        ) : (
          <ul>
            {[...symptomMap.entries()].map(([name, info]) => (
              <li key={name}>
                <strong>{name}</strong> · {info.count}회 · 최대 불편 정도 {info.maxSeverity}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="printSection">
        <h2>최근 검사</h2>
        {!labs.length ? (
          <p>기록 없음</p>
        ) : (
          <table className="summaryTable">
            <thead>
              <tr><th>검사</th><th>결과</th><th>검사일</th></tr>
            </thead>
            <tbody>
              {labs.map((lab) => (
                <tr key={lab.id}>
                  <td>{lab.test_name}</td>
                  <td>{lab.value_numeric ?? lab.value_text ?? "-"} {lab.unit ?? ""}</td>
                  <td>{new Date(lab.measured_at).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="printSection">
        <h2>현재 치료</h2>
        {!treatments.length ? (
          <p>기록 없음</p>
        ) : (
          <ul>
            {treatments.map((item) => (
              <li key={item.id}>{item.name} {item.cycle_label ?? ""}</li>
            ))}
          </ul>
        )}
      </section>

      <section className="printSection">
        <h2>현재 복약</h2>
        {!medications.length ? (
          <p>기록 없음</p>
        ) : (
          <ul>
            {medications.map((item) => (
              <li key={item.id}>
                <strong>{item.name}</strong>
                {" · "}
                {[item.dose_text, item.frequency_text, item.route].filter(Boolean).join(" · ") || "상세정보 없음"}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="printSection">
        <h2>의료진에게 물어볼 질문</h2>
        {!questions.length ? (
          <p>사용자가 등록한 질문 없음</p>
        ) : (
          <ol>
            {questions.map((item) => <li key={item.id}>{item.question}</li>)}
          </ol>
        )}
      </section>

      <footer className="printFooter">
        <strong>ApuDa</strong>
        <p>
          본 요약은 사용자가 기록한 정보를 정리한 자료이며 진단·처방 또는 치료판단을 대신하지 않습니다.
        </p>
      </footer>
    </main>
  );
}
