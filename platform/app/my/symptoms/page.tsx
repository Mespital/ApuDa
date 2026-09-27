import { redirect } from "next/navigation";
import SymptomEntryForm from "@/components/SymptomEntryForm";
import VoiceSymptomInput from "@/components/VoiceSymptomInput";
import { getActiveProfile } from "@/lib/active-profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function SymptomsPage() {
  if (!isSupabaseConfigured()) {
    return <main className="shell"><h1 className="pageTitle">오늘 상태</h1><p>Supabase 연결이 필요합니다.</p></main>;
  }

  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();
  const { data: logs } = await supabase
    .from("symptom_logs")
    .select("id,symptom_name,severity,count_value,note,source,recorded_at")
    .eq("profile_id", profile.id)
    .order("recorded_at", { ascending: false })
    .limit(30);

  return (
    <main className="shell">
      <p className="eyebrow">TODAY CONDITION · {profile.display_name}</p>
      <h1 className="pageTitle">오늘 상태</h1>
      <p className="heroCopy">
        불편한 점을 말로 남기거나 직접 입력해두면 다음 진료 전에 증상의 흐름을 다시 확인할 수 있습니다.
      </p>

      <section className="section">
        <p className="eyebrow">VOICE INPUT</p>
        <h3>말로 기록</h3>
        <p className="mutedText">
          음성을 글로 바꾼 뒤 ApuDa가 증상 항목을 정리합니다. 저장 전에는 반드시 사용자가 확인합니다.
        </p>
        <VoiceSymptomInput profileId={profile.id} />
      </section>

      <section className="section">
        <p className="eyebrow">MANUAL INPUT</p>
        <h3>직접 입력</h3>
        <SymptomEntryForm profileId={profile.id} />
      </section>

      <section className="section">
        <p className="eyebrow">RECENT</p>
        <h3>최근 기록</h3>
        {!logs?.length ? (
          <div className="emptyState">
            <div className="largeIcon">＋</div>
            <h3>아직 기록이 없어요.</h3>
            <p>오늘 상태를 위에서 간단히 남겨보세요.</p>
          </div>
        ) : (
          <div className="dataList">
            {logs.map((log) => (
              <article className="dataRow" key={log.id}>
                <div>
                  <strong>{log.symptom_name}</strong>
                  <small>
                    {new Date(log.recorded_at).toLocaleDateString("ko-KR")}
                    {log.severity !== null ? ` · 정도 ${log.severity}` : ""}
                    {log.count_value !== null ? ` · ${log.count_value}회` : ""}
                    {log.source === "voice" ? " · 음성기록" : ""}
                  </small>
                  {log.note && <small>{log.note}</small>}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
