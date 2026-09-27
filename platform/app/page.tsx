import Link from "next/link";

const actions = [
  { title: "검사결과 기록", description: "사진 또는 직접 입력으로 검사 변화를 남겨요.", icon: "▤", href: "/my/labs" },
  { title: "오늘 상태 기록", description: "증상과 컨디션을 짧게 기록해요.", icon: "＋", href: "/my/symptoms" },
  { title: "진료 준비", description: "최근 기록을 모아 다음 진료를 준비해요.", icon: "✓", href: "/my" }
];

export default function HomePage() {
  return (
    <main className="shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">아프지만, 다행이다.</p>
          <h1>My ApuDa</h1>
        </div>
        <Link className="profileButton linkButton" href="/login" aria-label="ApuDa ID">
          MY
        </Link>
      </header>

      <section className="hero">
        <p className="eyebrow">MY APUDA</p>
        <h2>
          내 건강의 흐름을
          <br />
          차근차근 정리해요.
        </h2>
        <p className="heroCopy">
          검사, 증상, 치료와 다음 진료까지 필요한 기록을 한곳에 모으는
          ApuDa의 새로운 건강관리 공간입니다.
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

      <section className="section">
        <div className="sectionHeading">
          <div>
            <p className="eyebrow">TODAY</p>
            <h3>오늘은 이것만 확인해 주세요</h3>
          </div>
          <span className="statusPill">Beta</span>
        </div>

        <div className="actionGrid">
          {actions.map((action) => (
            <Link className="card cardLink" href={action.href} key={action.title}>
              <div className="cardIcon" aria-hidden="true">{action.icon}</div>
              <div>
                <h4>{action.title}</h4>
                <p>{action.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section softSection">
        <p className="eyebrow">RECORD → UNDERSTAND → ACT → REPEAT</p>
        <h3>기록이 쌓일수록 다음 행동이 쉬워집니다.</h3>
        <p>
          ApuDa는 진단이나 처방을 대신하지 않습니다. 사용자의 기록을
          정리하고 이해를 돕고, 의료진과의 상담을 준비하는 데 집중합니다.
        </p>
      </section>
    </main>
  );
}
