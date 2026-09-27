export default function TimelinePage() {
  const demoEvents = [
    { date: "진단", title: "진단 기록", note: "질환과 진단일을 등록하면 여기에 표시됩니다." },
    { date: "치료", title: "치료 기록", note: "수술·항암·면역·표적·방사선치료를 시간순으로 연결합니다." },
    { date: "평가", title: "영상 및 반응평가", note: "CT/MRI/PET 결과를 쉬운 용어와 함께 정리합니다." }
  ];

  return (
    <main className="shell">
      <p className="eyebrow">TREATMENT TIMELINE</p>
      <h1 className="pageTitle">나의 치료 여정</h1>
      <p className="heroCopy">
        진단부터 검사와 치료, 다음 평가까지 중요한 사건을 시간순으로
        정리합니다.
      </p>

      <section className="section timeline">
        {demoEvents.map((event) => (
          <article className="timelineItem" key={event.date}>
            <div className="timelineDot" />
            <div>
              <p className="timelineDate">{event.date}</p>
              <h3>{event.title}</h3>
              <p>{event.note}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
