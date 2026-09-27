import { redirect } from "next/navigation";
import LabEntryForm from "@/components/LabEntryForm";
import LabPhotoImport from "@/components/LabPhotoImport";
import { getActiveProfile } from "@/lib/active-profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function LabsPage() {
  if (!isSupabaseConfigured()) {
    return <main className="shell"><h1 className="pageTitle">검사결과</h1><p>Supabase 연결이 필요합니다.</p></main>;
  }

  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();
  const { data: labs } = await supabase
    .from("labs")
    .select("id,test_name,value_numeric,value_text,unit,measured_at,source")
    .eq("profile_id", profile.id)
    .order("measured_at", { ascending: false })
    .limit(30);

  return (
    <main className="shell">
      <p className="eyebrow">LAB RECORDS · {profile.display_name}</p>
      <h1 className="pageTitle">검사결과</h1>
      <p className="heroCopy">
        검사결과를 사진으로 불러오거나 직접 입력하고, 이전 값과 함께 확인합니다.
        숫자의 상승·하락만으로 치료효과를 단정하지 않습니다.
      </p>

      <section className="section">
        <p className="eyebrow">PHOTO INPUT</p>
        <h3>사진으로 기록</h3>
        <p className="mutedText">
          검사지를 촬영하면 OCR이 검사명·수치·단위를 찾아줍니다. 자동 인식 결과는 저장 전 반드시 확인합니다.
        </p>
        <LabPhotoImport profileId={profile.id} />
      </section>

      <section className="section">
        <p className="eyebrow">MANUAL INPUT</p>
        <h3>직접 입력</h3>
        <LabEntryForm profileId={profile.id} />
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
                  <small>
                    {new Date(lab.measured_at).toLocaleDateString("ko-KR")}
                    {lab.source ? ` · ${lab.source === "ocr" ? "사진 인식" : "직접 입력"}` : ""}
                  </small>
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
