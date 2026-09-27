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

function mockAnswer(context: TalkContext, question: string) {
  const symptomNames = [...new Set(context.symptoms.map((item) => item.symptom_name))];
  const labNames = [...new Set(context.labs.map((item) => item.test_name))];
  const treatment = context.treatments[0];
  const biomarkerNames = context.biomarkers
    .slice(0, 5)
    .map((item) => `${item.name} ${item.result_text ?? item.result_numeric ?? ""}`.trim());

  const contextLines = [
    symptomNames.length ? `최근 기록된 증상: ${symptomNames.slice(0, 4).join(", ")}` : null,
    labNames.length ? `최근 기록된 검사: ${labNames.slice(0, 5).join(", ")}` : null,
    treatment ? `현재 기록된 치료: ${treatment.name} ${treatment.cycle_label ?? ""}`.trim() : null,
    biomarkerNames.length ? `등록된 바이오마커: ${biomarkerNames.join(", ")}` : null,
    context.next_appointment ? `다음 일정: ${context.next_appointment.title}` : null
  ].filter(Boolean);

  return [
    "현재 ApuDa Talk는 외부 생성형 AI가 연결되지 않은 안전한 기본 모드입니다.",
    contextLines.length ? contextLines.join("\n") : "아직 연결해 참고할 건강기록이 많지 않습니다.",
    "",
    `질문: ${question}`,
    "",
    "이 기록만으로 진단이나 치료효과를 판단하지는 않습니다. 다음 진료에서 확인할 질문으로 정리해두는 것이 좋습니다."
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
