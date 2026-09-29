import OpenAI from "openai";

export type TalkContext = {
  conditions: Array<{ name: string; diagnosed_on: string | null }>;
  treatments: Array<{ name: string; cycle_label: string | null; treatment_type: string }>;
  biomarkers: Array<{
    name: string;
    result_text: string | null;
    result_numeric: number | null;
    unit: string | null;
    tested_on: string | null;
  }>;
  imaging: Array<{
    modality: string;
    body_part: string | null;
    study_date: string;
    summary: string | null;
    response_category: string | null;
  }>;
  medications: Array<{ name: string; dose_text: string | null; frequency_text: string | null }>;
  labs: Array<{
    test_name: string;
    value_numeric: number | null;
    value_text: string | null;
    unit: string | null;
    measured_at: string;
  }>;
  symptoms: Array<{
    symptom_name: string;
    severity: number | null;
    recorded_at: string;
  }>;
  next_appointment: {
    title: string;
    scheduled_at: string;
    department: string | null;
  } | null;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("ko-KR");
}

function formatLab(item: TalkContext["labs"][number]) {
  const value = item.value_numeric ?? item.value_text ?? "-";
  return `${item.test_name} ${value}${item.unit ? " " + item.unit : ""} (${formatDate(item.measured_at)})`;
}

function uniqueSymptoms(context: TalkContext) {
  const grouped = new Map<string, { count: number; maxSeverity: number }>();
  for (const item of context.symptoms) {
    const current = grouped.get(item.symptom_name) ?? { count: 0, maxSeverity: 0 };
    grouped.set(item.symptom_name, {
      count: current.count + 1,
      maxSeverity: Math.max(current.maxSeverity, item.severity ?? 0)
    });
  }
  return [...grouped.entries()];
}

function mockAnswer(context: TalkContext, question: string) {
  const q = question.toLowerCase();
  const symptoms = uniqueSymptoms(context);
  const treatment = context.treatments[0];
  const appointment = context.next_appointment;

  const header = "저장된 ApuDa 기록을 기준으로 정리했습니다.";

  if (/검사|수치|혈액|lab|결과/.test(q)) {
    if (!context.labs.length) {
      return [
        header,
        "",
        "아직 등록된 검사결과가 없습니다.",
        "검사지를 업로드하거나 검사명·수치를 기록하면 최근 결과를 날짜순으로 정리해드릴 수 있어요.",
        "",
        "검사 하나만으로 진단이나 치료효과를 판단하지는 않습니다."
      ].join("\n");
    }

    return [
      header,
      "",
      "최근 검사:",
      ...context.labs.slice(0, 5).map((item) => `• ${formatLab(item)}`),
      "",
      "다음 진료에서 확인하기 좋은 질문:",
      "• 이 중 현재 치료와 관련해 특히 추적해야 할 항목은 무엇인가요?",
      "• 이전 결과와 비교해 의료진이 중요하게 보는 변화가 있나요?",
      "",
      "참고: 기준범위와 의미는 검사실·질환·치료 상황에 따라 달라질 수 있어 수치만으로 상태를 단정하지 않습니다."
    ].join("\n");
  }

  if (/증상|통증|피로|메스꺼|저림|불편/.test(q)) {
    if (!symptoms.length) {
      return [
        header,
        "",
        "최근 14일에 등록된 증상 기록이 없습니다.",
        "오늘 상태를 기록하면 반복 횟수와 가장 높은 불편 정도를 진료용으로 요약할 수 있어요."
      ].join("\n");
    }

    return [
      header,
      "",
      "최근 14일 증상:",
      ...symptoms.slice(0, 6).map(
        ([name, info]) => `• ${name}: ${info.count}회 기록, 최대 ${info.maxSeverity}/4`
      ),
      "",
      "다음 진료에서 확인하기 좋은 질문:",
      "• 이 증상이 치료나 약과 관련될 가능성을 어떻게 평가하나요?",
      "• 어느 정도가 되면 병원에 바로 연락해야 하나요?",
      "• 생활 중 관찰해서 기록하면 좋은 항목이 있나요?"
    ].join("\n");
  }

  if (/약|복약|복용|medication/.test(q)) {
    if (!context.medications.length) {
      return [
        header,
        "",
        "현재 활성 상태로 등록된 복약 정보가 없습니다.",
        "복용 중인 약 이름·용량·복용 횟수를 등록하면 한 번에 정리해드릴 수 있어요."
      ].join("\n");
    }

    return [
      header,
      "",
      "현재 복약 기록:",
      ...context.medications.slice(0, 10).map((item) =>
        `• ${[item.name, item.dose_text, item.frequency_text].filter(Boolean).join(" · ")}`
      ),
      "",
      "약을 중단하거나 용량을 바꾸는 판단은 하지 않습니다. 복용법이나 부작용이 궁금하면 처방 의료진·약사에게 확인할 질문으로 정리해드릴 수 있어요."
    ].join("\n");
  }

  if (/진료|질문|외래|예약|준비/.test(q)) {
    const lines = [
      header,
      "",
      appointment
        ? `다음 일정: ${appointment.title} · ${formatDate(appointment.scheduled_at)}${appointment.department ? " · " + appointment.department : ""}`
        : "등록된 다음 진료 일정이 없습니다.",
      treatment
        ? `현재 치료 기록: ${treatment.name}${treatment.cycle_label ? " · " + treatment.cycle_label : ""}`
        : "현재 치료 기록이 없습니다.",
      context.labs.length ? `최근 검사 ${context.labs.length}건이 연결되어 있습니다.` : "최근 검사 기록이 없습니다.",
      symptoms.length ? `최근 증상 ${symptoms.length}종이 기록되어 있습니다.` : "최근 증상 기록이 없습니다.",
      "",
      "진료실에서 확인할 질문:",
      "1. 현재 치료의 다음 단계와 평가 시점은 언제인가요?",
      "2. 최근 검사 중 특히 추적해야 할 항목은 무엇인가요?",
      "3. 최근 증상 중 치료와 관련해 주의 깊게 볼 것은 무엇인가요?",
      "4. 집에서 새로 기록하면 좋은 증상이나 수치가 있나요?"
    ];

    return lines.join("\n");
  }

  if (/영상|ct|mri|pet|판독/.test(q)) {
    if (!context.imaging.length) {
      return [
        header,
        "",
        "등록된 영상검사 결과가 없습니다.",
        "CT·MRI·PET 등의 검사 날짜와 판독 요약을 기록하면 최근 영상 흐름을 정리할 수 있어요."
      ].join("\n");
    }

    return [
      header,
      "",
      "최근 영상검사:",
      ...context.imaging.slice(0, 5).map((item) =>
        `• ${item.modality} ${item.body_part ?? ""} · ${formatDate(item.study_date)}${item.response_category ? " · " + item.response_category : ""}${item.summary ? "\n  " + item.summary : ""}`
      ),
      "",
      "영상 한 건만으로 치료효과를 독립적으로 판정하지 않습니다. 판독 결과의 의미와 다음 평가 시점을 의료진과 확인하세요."
    ].join("\n");
  }

  if (/바이오|marker|her2|pd-l1|egfr|유전자/.test(q)) {
    if (!context.biomarkers.length) {
      return [
        header,
        "",
        "등록된 바이오마커 결과가 없습니다.",
        "HER2, PD-L1, EGFR 같은 병리·분자검사 결과를 기록하면 치료 상담용으로 정리할 수 있어요."
      ].join("\n");
    }

    return [
      header,
      "",
      "등록된 바이오마커:",
      ...context.biomarkers.slice(0, 8).map((item) =>
        `• ${item.name}: ${item.result_text ?? item.result_numeric ?? "-"}${item.unit ? " " + item.unit : ""}`
      ),
      "",
      "결과의 치료 의미는 암종·병기·검사법·다른 검사결과와 함께 해석해야 합니다. 현재 치료 선택에 어떤 의미가 있는지 의료진과 확인하세요."
    ].join("\n");
  }

  const contextLines = [
    context.conditions.length
      ? `등록된 질환: ${context.conditions.slice(0, 4).map((item) => item.name).join(", ")}`
      : null,
    treatment ? `최근 치료: ${treatment.name} ${treatment.cycle_label ?? ""}`.trim() : null,
    context.labs.length ? `최근 검사: ${context.labs.slice(0, 4).map((item) => item.test_name).join(", ")}` : null,
    symptoms.length ? `최근 증상: ${symptoms.slice(0, 4).map(([name]) => name).join(", ")}` : null,
    appointment ? `다음 일정: ${appointment.title} · ${formatDate(appointment.scheduled_at)}` : null
  ].filter(Boolean);

  return [
    header,
    "",
    contextLines.length ? contextLines.join("\n") : "아직 연결해 참고할 건강기록이 많지 않습니다.",
    "",
    `질문: ${question}`,
    "",
    "질문을 검사결과, 증상, 복약, 영상검사, 바이오마커 또는 다음 진료 준비와 연결해 물어보면 저장된 기록을 더 구체적으로 정리해드릴 수 있어요.",
    "",
    "ApuDa Talk는 진단·처방·치료효과 판정을 대신하지 않습니다."
  ].join("\n");
}

export async function generateTalkAnswer(context: TalkContext, question: string) {
  const provider = process.env.AI_PROVIDER ?? "mock";

  if (provider !== "openai") {
    return {
      provider: "mock",
      answer: mockAnswer(context, question)
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL;

  if (!apiKey || !model) {
    return {
      provider: "mock",
      answer: mockAnswer(context, question)
    };
  }

  const client = new OpenAI({ apiKey });

  const instructions = [
    "You are ApuDa Talk, a Korean care-navigation assistant.",
    "Use only the supplied user-record context plus general medical knowledge needed to explain terms.",
    "Do not diagnose, prescribe, recommend stopping or changing medication doses, or conclude treatment efficacy.",
    "Do not state that a lab change alone means cancer progression, improvement, response, or failure.",
    "Distinguish clearly between the user's recorded facts and general explanation.",
    "When the question could involve urgent symptoms, advise appropriate urgent professional evaluation without exaggeration.",
    "Prefer concise Korean and prepare useful questions for the clinician.",
    "Do not claim to have reviewed records that are not in the provided context."
  ].join(" ");

  const response = await client.responses.create({
    model,
    instructions,
    input: [
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text:
              "ApuDa에 저장된 최소화된 건강기록:\n" +
              JSON.stringify(context) +
              "\n\n사용자 질문:\n" +
              question
          }
        ]
      }
    ]
  });

  return {
    provider: "openai",
    answer: response.output_text || "답변을 생성하지 못했습니다."
  };
}
