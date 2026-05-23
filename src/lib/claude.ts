// /api/claude を呼ぶ薄いクライアント
export interface AdvicePayload {
  customerSummary: string;
  recentQA: { q: string; a: string }[];
  currentQuestion?: string;
  currentAnswer?: string;
  manualSnippets?: string[];
}

export interface ReportPayload {
  transcript: string;
  customerJson: string;
  qaJson: string;
  manualSnippets?: string[];
}

async function call(payload: unknown): Promise<string> {
  const res = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = data?.detail || data?.error || res.statusText;
    throw new Error(`Claude API エラー: ${detail}`);
  }
  return (data?.text as string) || '';
}

export function fetchAdvice(p: AdvicePayload): Promise<string> {
  return call({ mode: 'advice', ...p });
}

export function generateReport(p: ReportPayload): Promise<string> {
  return call({ mode: 'report', ...p });
}
