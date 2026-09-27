import { redirect } from "next/navigation";
import LabEntryForm from "@/components/LabEntryForm";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function LabsPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="shell">
        <p className="eyebrow">LAB RECORDS</p>
        <h1 className="pageTitle">검사결과</h1>
        <p className="heroCopy">Supabase 연결 후 실제 검사결과 저장 기능이 활성화됩니다.</p>
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

  const { data: labs } = await supabase
    .from("labs")
    .select("id,test_name,value_numeric,value_text,unit,measured_at")
    .eq("profile_id", profileId)
    .order("measured_at", { ascending: false })
    .limit(20);

  return (
    <main className="shell">
      <p className="eyebrow">LAB RECORDS</p>
      <h1 className="pageTitle">검사결과</h1>
      <p className="heroCopy">
        검사결과를 기록하고 이전 값과 함께 확인합니다. 숫자의 상승·하락만으로 치료효과를 단정하지 않습니다.
      </p>

      <section className="section">
        <p className="eyebrow">ADD RESULT</p>
        <h3>검사결과 직접 입력</h3>
        <LabEntryForm profileId={profileId} />
      </section>

      <section className="section">
        <p className="eyebrow">RECENT</p>
        <h3>최근 검사</h3>
        {!labs?.length ? (
          <div className="emptyState">
            <div className="largeIcon">▤</div>
            <h3>아직 등록한 검사결과가 없어요.</h3>
            <p>첫 검사결과를 위에서 기록해보세요.</p>
          </div>
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

      <p className="safetyNote">
        검사 수치 하나만으로 질환 진행이나 치료효과를 판단하지 않습니다.
      </p>
    </main>
  );
}
