import { useEffect, useRef, useState } from 'react';
import { fetchAdvice } from '../../lib/claude';
import type { Customer, ResponseRow } from '../../types';

interface Props {
  customer: Customer | null;
  responses: ResponseRow[];
  currentQuestion: string;
  currentAnswer: string;
  manualSnippets: string[];
}

export function AIAdvicePanel({
  customer,
  responses,
  currentQuestion,
  currentAnswer,
  manualSnippets,
}: Props) {
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<number | null>(null);

  const customerSummary = customer
    ? [
        `氏名: ${customer.name}`,
        customer.age && `年齢: ${customer.age}歳`,
        customer.household && `世帯構成: ${customer.household}`,
        customer.area_pref && `エリア: ${customer.area_pref}`,
        customer.station_pref && `駅: ${customer.station_pref}`,
        customer.property_type && `物件: ${customer.property_type}`,
        customer.layout && `間取り: ${customer.layout}`,
        customer.income_band && `年収: ${customer.income_band}`,
        customer.budget_band && `予算: ${customer.budget_band}`,
        customer.consideration_status && `検討状況: ${customer.consideration_status}`,
      ]
        .filter(Boolean)
        .join('\n')
    : '（顧客情報なし）';

  // 質問または回答が変化したら、500ms 後に AI 助言を取りに行く
  useEffect(() => {
    if (!currentQuestion) return;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const text = await fetchAdvice({
          customerSummary,
          recentQA: responses.slice(-5).map((r) => ({ q: r.question, a: r.answer })),
          currentQuestion,
          currentAnswer,
          manualSnippets,
        });
        setAdvice(text);
      } catch (e: any) {
        setError(e?.message ?? 'AIの呼び出しに失敗しました');
      } finally {
        setLoading(false);
      }
    }, 700);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [currentQuestion, currentAnswer, customerSummary]);

  return (
    <div className="bg-gradient-to-br from-brand-50 to-white rounded-2xl shadow-soft p-4 border border-brand-200">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs font-bold text-brand-700 flex items-center gap-1.5">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
          AIアシスト（営業のみ表示）
        </div>
        {loading && <span className="text-[10px] text-ink-500">考え中…</span>}
      </div>
      {error && <div className="text-xs text-red-600">{error}</div>}
      {!advice && !loading && !error && (
        <div className="text-xs text-ink-500">
          質問を選び、顧客の回答を入力するとClaudeがアドバイスを表示します。
        </div>
      )}
      {advice && (
        <pre className="text-xs whitespace-pre-wrap text-ink-700 leading-relaxed">{advice}</pre>
      )}
    </div>
  );
}
