import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

type Profile = {
  id: string;
  display_name: string;
  relationship_to_user: string;
};

export default async function MyApuDaPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="shell">
        <section className="section">
          <p className="eyebrow">MY APUDA · SETUP</p>
          <h1 className="pageTitle">데이터 연결을 준비하고 있어요.</h1>
          <p className="heroCopy">
            앱 구조와 화면은 준비되었습니다. Supabase 프로젝트 연결 후
            ApuDa ID와 건강 프로필을 바로 사용할 수 있습니다.
          </p>
          <Link className="primaryLink" href="/login">
            ApuDa ID 화면 보기
          </Link>
        </section>
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data } = await supabase
    .from("profiles")
    .select("id, display_name, relationship_to_user")
    .order("created_at", { ascending: true });

  const profiles = (data ?? []) as Profile[];

  if (profiles.length === 0) {
    redirect("/onboarding");
  }

  const active = profiles[0];

  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">MY APUDA</p>
          <h1>{active.display_name}</h1>
        </div>
        <Link className="profileButton linkButton" href="/onboarding">
          ＋
        </Link>
      </header>

      <section className="hero compactHero">
        <p className="eyebrow">TODAY</p>
        <h2>
          오늘 건강 흐름을
          <br />
          가볍게 확인해요.
        </h2>
        <p className="heroCopy">
          검사, 증상, 치료와 다음 진료까지 필요한 기록을 한곳에 모읍니다.
        </p>
        <button className="primaryButton" type="button">＋ 기록하기</button>
      </section>

      <section className="section">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">NEXT ACTION</p>
            <h3>오늘은 이것만 확인해 주세요</h3>
          </div>
        </div>

        <div className="actionGrid">
          <Link className="card cardLink" href="/my/labs">
            <div className="cardIcon">▤</div>
            <div>
              <h4>검사결과</h4>
              <p>검사 수치와 변화를 기록합니다.</p>
            </div>
          </Link>

          <Link className="card cardLink" href="/my/symptoms">
            <div className="cardIcon">＋</div>
            <div>
              <h4>오늘 상태</h4>
              <p>증상과 컨디션을 기록합니다.</p>
            </div>
          </Link>

          <Link className="card cardLink" href="/my/timeline">
            <div className="cardIcon">↗</div>
            <div>
              <h4>치료 여정</h4>
              <p>진단부터 치료까지 시간순으로 봅니다.</p>
            </div>
          </Link>
        </div>
      </section>

      <section className="section softSection">
        <p className="eyebrow">VISIT PREPARATION</p>
        <h3>다음 진료 전에 ApuDa가 기록을 모아드릴게요.</h3>
        <p>
          최근 증상·검사·치료 기록을 바탕으로 의료진에게 확인할 내용을
          정리하는 기능을 다음 단계에서 연결합니다.
        </p>
      </section>
    </main>
  );
}
