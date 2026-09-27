export default function SymptomsPage() {
  return (
    <main className="shell">
      <p className="eyebrow">TODAY CONDITION</p>
      <h1 className="pageTitle">오늘 상태</h1>
      <p className="heroCopy">
        아픈 곳이나 불편한 점을 짧게 남겨두면 다음 진료 전에 다시 확인할
        수 있습니다.
      </p>

      <section className="section">
        <div className="emptyState">
          <div className="largeIcon">＋</div>
          <h3>오늘 어떠셨어요?</h3>
          <p>말로 기록하거나 직접 선택해서 남길 수 있습니다.</p>
          <div className="buttonRow">
            <button className="primaryButton">말로 기록</button>
            <button className="secondaryButton">직접 입력</button>
          </div>
        </div>
      </section>
    </main>
  );
}
