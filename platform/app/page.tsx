import Link from "next/link";

const actions = [
  { title: "검사결과 기록", description: "사진 또는 직접 입력으로 검사 변화를 남겨요.", icon: "lab", href: "/my/labs" },
  { title: "오늘 상태 기록", description: "증상과 컨디션을 짧게 기록해요.", icon: "symptom", href: "/my/symptoms" },
  { title: "진료 준비", description: "최근 기록을 모아 다음 진료를 준비해요.", icon: "calendar", href: "/my" }
] as const;

function LandingIcon({ name }: { name: "lab" | "symptom" | "calendar" }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {name === "lab" && (
        <>
          <path d="M7 3h10v4H7z" />
          <path d="M8 7v13h8V7" />
          <path d="M10 11h4M10 15h4" />
        </>
      )}
      {name === "symptom" && (
        <>
          <path d="M12 21s-7-4.35-7-10a4 4 0 0 1 7-2.65A4 4 0 0 1 19 11c0 5.65-7 10-7 10Z" />
          <path d="M8.5 12h2l1-2 1.5 4 1-2h1.5" />
        </>
      )}
      {name === "calendar" && (
        <>
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M8 3v4M16 3v4M4 9h16M8 13h3M13 13h3M8 16h3" />
        </>
      )}
    </svg>
  );
}

export default function HomePage() {
  return (
    <main className="shell landingHome">
      <header className="topbar">
        <div>
          <p className="eyebrow">아프지만, 다행이다.</p>
          <h1>My ApuDa</h1>
        </div>
        <Link className="profileButton linkButton" href="/login" aria-label="ApuDa ID">
          MY
        </Link>
      </header>

      <section className="hero landingHero">
        <p className="eyebrow">MY APUDA</p>
        <h2>
          내 건강의 흐름을
          <br />
          차근차근 정리해요.
        </h2>
        <p className="heroCopy">
          검사·증상·치료·진료 일정을 한곳에 모아
          내 건강의 흐름을 쉽게 확인하세요.
        </p>
        <div className="buttonRow leftButtons">
          <Link className="primaryLink" href="/login">
            ApuDa ID 시작하기
          </Link>
          <Link className="secondaryLink" href="/my">
            My ApuDa 보기
          </Link>
        </div>
      </section>

      <section className="section landingActionSection">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">오늘 할 일</p>
            <h3>오늘은 이것만 확인해 주세요</h3>
          </div>
          <span className="statusPill">Beta</span>
        </div>

        <div className="actionGrid">
          {actions.map((action) => (
            <Link className="card cardLink" href={action.href} key={action.title}>
              <div className="cardIcon" aria-hidden="true"><LandingIcon name={action.icon} /></div>
              <div>
                <h4>{action.title}</h4>
                <p>{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section softSection landingPrinciple">
        <p className="eyebrow">기록 → 이해 → 준비</p>
        <h3>기록이 쌓일수록 다음 행동이 쉬워집니다.</h3>
        <p>
          ApuDa는 진단이나 처방을 대신하지 않습니다. 사용자의 기록을
          정리하고 이해를 돕고, 의료진과의 상담을 준비하는 데 집중합니다.
        </p>
      </section>
    </main>
  );
}
