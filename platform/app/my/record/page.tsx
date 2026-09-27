import Link from "next/link";

export default function RecordPage() {
  return (
    <main className="shell">
      <p className="eyebrow">QUICK RECORD</p>
      <h1 className="pageTitle">어떻게 기록할까요?</h1>
      <p className="heroCopy">
        가장 편한 방법 하나만 고르면 됩니다. 저장 전에는 항상 내용을 다시 확인합니다.
      </p>

      <section className="recordChoices">
        <Link className="recordChoice" href="/my/labs">
          <div className="recordChoiceIcon">▤</div>
          <div>
            <h2>사진으로</h2>
            <p>검사결과를 찍어서 기록해요.</p>
          </div>
        </Link>

        <Link className="recordChoice" href="/my/symptoms">
          <div className="recordChoiceIcon">●</div>
          <div>
            <h2>말로</h2>
            <p>오늘 상태를 편하게 말해주세요.</p>
          </div>
        </Link>

        <Link className="recordChoice" href="/my/symptoms">
          <div className="recordChoiceIcon">⌨</div>
          <div>
            <h2>직접 입력</h2>
            <p>검사나 증상을 직접 기록할게요.</p>
          </div>
        </Link>
      </section>
    </main>
  );
}
