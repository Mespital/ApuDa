import { redirect } from "next/navigation";
import RecordDeleteButton from "@/components/RecordDeleteButton";
import TodayJournalComposer from "@/components/TodayJournalComposer";
import { getActiveProfile } from "@/lib/active-profile";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export default async function JournalPage() {
  if (!isSupabaseConfigured()) {
    return <main className="shell"><h1 className="pageTitle">건강 일기</h1><p>Supabase 연결이 필요합니다.</p></main>;
  }

  const { user, profile } = await getActiveProfile();
  if (!user) redirect("/login");
  if (!profile) redirect("/onboarding");

  const supabase = await createClient();
  const { data: entries } = await supabase
    .from("journal_entries")
    .select("id,body,tags,recorded_at")
    .eq("profile_id", profile.id)
    .order("recorded_at", { ascending: false })
    .limit(60);

  return (
    <main className="shell journalPage">
      <p className="eyebrow">MY JOURNAL · {profile.display_name}</p>
      <h1 className="pageTitle">내 건강 일기</h1>
      <p className="heroCopy">
        길게 쓰지 않아도 괜찮아요. 그날의 몸 상태와 마음을 한 줄씩 남기면 나중에 내 건강의 흐름을 돌아보기 쉬워집니다.
      </p>

      <section className="section">
        <TodayJournalComposer profileId={profile.id} />
      </section>

      <section className="section">
        <div className="journalPageHeader">
          <div>
            <p className="eyebrow">지난 기록</p>
            <h2>차곡차곡 쌓인 기록</h2>
          </div>
          <span>{entries?.length ?? 0}개</span>
        </div>

        {!entries?.length ? (
          <div className="emptyState">
            <div className="largeIcon">✦</div>
            <h3>아직 한 줄 기록이 없어요.</h3>
            <p>오늘 있었던 일이나 몸 상태를 위에서 가볍게 남겨보세요.</p>
          </div>
        ) : (
          <div className="journalTimeline">
            {entries.map((entry) => (
              <article className="journalTimelineItem" key={entry.id}>
                <div className="journalTimelineDate">
                  <strong>
                    {new Date(entry.recorded_at).toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric"
                    })}
                  </strong>
                  <small>
                    {new Date(entry.recorded_at).toLocaleDateString("ko-KR", {
                      weekday: "short"
                    })}
                  </small>
                </div>
                <div className="journalTimelineBody">
                  <p>{entry.body}</p>
                  {entry.tags.length > 0 && (
                    <div className="journalTimelineTags">
                      {entry.tags.map((tag) => <span key={tag}>{tag}</span>)}
                    </div>
                  )}
                </div>
                <RecordDeleteButton entity="journal" id={entry.id} />
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
