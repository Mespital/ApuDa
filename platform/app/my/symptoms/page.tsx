import { redirect } from "next/navigation";
import SymptomEntryForm from "@/components/SymptomEntryForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function SymptomsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="shell">
        <p className="eyebrow">TODAY CONDITION</p>
        <h1 className="pageTitle">오늘 상태</h1>
        <p className="heroCopy">Supabase 연결 후 실제 증상 저장 기능이 활성화됩니다.</p>
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1);

  if (!profiles?.length) redirect("/onboarding");
  const profileId = profiles[0].id;

  const { data: logs } = await supabase
    .from("symptom_logs")
    .select("id,symptom_name,severity,note,recorded_at")
    .eq("profile_id", profileId)
    .order("recorded_at", { ascending: false })
    .limit(20);

  return (
    <main className="shell">
      <p className="eyebrow">TODAY CONDITION</p>
      <h1 className="pageTitle">오늘 상태</h1>
      <p className="heroCopy">
        불편한 점을 짧게 기록해두면 다음 진료 전에 증상의 흐름을 다시 확인할 수 있습니다.
      </p>

      <section className="section">
        <p className="eyebrow">QUICK LOG</p>
        <h3>오늘 증상 기록</h3>
        <SymptomEntryForm profileId={profileId} />
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
                  <small>{new Date(log.recorded_at).toLocaleDateString("ko-KR")} · 정도 {log.severity ?? "-"}</small>
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
