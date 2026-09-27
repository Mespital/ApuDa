import Link from "next/link";

const choices = [
  {
    href: "/my/labs",
    icon: "▤",
    title: "검사결과",
    description: "검사지를 사진으로 읽거나 검사명과 결과를 직접 기록해요."
  },
  {
    href: "/my/symptoms",
    icon: "●",
    title: "오늘 상태",
    description: "말로 기록하거나 통증, 피로, 손발저림 같은 증상을 직접 남겨요."
  },
  {
    href: "/my/medications",
    icon: "Rx",
    title: "복약",
    description: "현재 복용 중인 약과 용량을 정리해요."
  },
  {
    href: "/my/appointments",
    icon: "□",
    title: "병원 일정",
    description: "외래, 검사, 치료 일정을 추가해요."
  },
  {
    href: "/my/timeline",
    icon: "↗",
    title: "질환·치료",
    description: "진단과 치료 과정을 시간순으로 정리해요."
  },
  {
    href: "/my/biomarkers",
    icon: "◎",
    title: "바이오마커",
    description: "HER2, PD-L1, EGFR 같은 병리·분자검사 결과를 정리해요."
  }
];

export default function RecordPage() {
  return (
    <main className="shell">
      <p className="eyebrow">QUICK RECORD</p>
      <h1 className="pageTitle">무엇을 기록할까요?</h1>
      <p className="heroCopy">
        지금 필요한 것 하나만 선택하면 됩니다. ApuDa는 기록을 모아 다음 진료 준비에 다시 활용합니다.
      </p>

      <section className="recordChoices">
        {choices.map((choice) => (
          <Link className="recordChoice" href={choice.href} key={choice.href}>
            <div className="recordChoiceIcon">{choice.icon}</div>
            <div>
              <h2>{choice.title}</h2>
              <p>{choice.description}</p>
            </div>
          </Link>
        ))}
      </section>
    </main>
  );
}
