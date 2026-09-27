export default function ApuDaAIPage() {
  return (
    <main className="shell">
      <p className="eyebrow">APUDA AI</p>
      <h1 className="pageTitle">기록을 이해하기 쉽게 정리해요.</h1>
      <p className="heroCopy">
        ApuDa AI는 내 기록의 맥락을 바탕으로 설명과 진료 준비를 돕는 Care Navigation 기능으로 설계합니다.
      </p>

      <section className="section">
        <div className="emptyState">
          <div className="largeIcon">✦</div>
          <h3>최근 기록을 같이 볼까요?</h3>
          <p>
            Supabase와 Health Graph 연결 후 최근 검사·증상·치료를 문맥으로 사용합니다.
          </p>
          <button className="primaryButton" type="button">최근 기록 요약</button>
        </div>
      </section>

      <p className="safetyNote">
        ApuDa AI는 진단, 처방, 약 중단·용량변경을 지시하지 않습니다.
      </p>
    </main>
  );
}
