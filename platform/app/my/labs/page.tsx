export default function LabsPage() {
  return (
    <main className="shell">
      <p className="eyebrow">LAB RECORDS</p>
      <h1 className="pageTitle">검사결과</h1>
      <p className="heroCopy">
        검사지를 사진으로 읽거나 직접 입력하고, 이전 결과와 변화만
        차분하게 비교합니다.
      </p>

      <section className="section">
        <div className="emptyState">
          <div className="largeIcon">▤</div>
          <h3>아직 등록한 검사결과가 없어요.</h3>
          <p>첫 검사결과를 기록해볼까요?</p>
          <div className="buttonRow">
            <button className="primaryButton">사진으로 등록</button>
            <button className="secondaryButton">직접 입력</button>
          </div>
        </div>
      </section>

      <p className="safetyNote">
        검사 수치 하나만으로 질환 진행이나 치료효과를 판단하지 않습니다.
      </p>
    </main>
  );
}
