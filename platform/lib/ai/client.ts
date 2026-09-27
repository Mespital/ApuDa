export type AIJobResult<T> = {
  job_id: string;
  status: string;
  result?: T;
  error?: string;
};

export async function pollAIJob<T>(
  jobId: string,
  onStatus?: (status: string) => void
): Promise<T> {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const response = await fetch(`/api/ai/jobs/${encodeURIComponent(jobId)}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error("AI 작업 상태를 확인하지 못했습니다.");
    }

    const body = (await response.json()) as AIJobResult<T>;
    onStatus?.(body.status);

    if (body.status === "finished" && body.result) {
      return body.result;
    }

    if (body.status === "failed") {
      throw new Error("AI 처리 중 오류가 발생했습니다.");
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error("처리 시간이 길어지고 있습니다. 잠시 후 다시 시도해 주세요.");
}
