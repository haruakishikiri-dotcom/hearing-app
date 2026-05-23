import { useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Field, displayValue } from '../ui/Field';
import { AIAdvicePanel } from './AIAdvicePanel';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import type { Customer, HearingSession as Session, Manual, ResponseRow } from '../../types';
import { salesHearingQuestions } from '../../lib/questions';

interface Props {
  sessionId: string;
  onBack: () => void;
  onGoReport: () => void;
}

export function HearingSession({ sessionId, onBack, onGoReport }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [idx, setIdx] = useState(0);
  const [draftAnswer, setDraftAnswer] = useState('');

  const currentQ = salesHearingQuestions[idx];

  useEffect(() => {
    let cancel = false;
    (async () => {
      if (!supabaseConfigured) return;
      const { data: s } = await supabase
        .from('hearing_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (cancel || !s) return;
      setSession(s as Session);
      const [{ data: c }, { data: r }, { data: m }] = await Promise.all([
        supabase.from('customers').select('*').eq('id', (s as Session).customer_id).single(),
        supabase
          .from('responses')
          .select('*')
          .eq('session_id', sessionId)
          .order('order_index'),
        supabase.from('manuals').select('*').eq('is_active', true),
      ]);
      if (cancel) return;
      setCustomer((c as Customer) ?? null);
      setResponses((r as ResponseRow[]) ?? []);
      setManuals((m as Manual[]) ?? []);
      // 既に保存された質問はスキップ
      const answered = new Set(((r as ResponseRow[]) ?? []).map((x) => x.question_id));
      const first = salesHearingQuestions.findIndex((q) => !answered.has(q.id));
      if (first >= 0) setIdx(first);
      if (s && (s as Session).status === 'preparing') {
        await supabase
          .from('hearing_sessions')
          .update({ status: 'in_progress', started_at: new Date().toISOString() })
          .eq('id', sessionId);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [sessionId]);

  const manualSnippets = useMemo(
    () => manuals.map((m) => `## ${m.title}\n${m.content}`),
    [manuals],
  );

  const saveAnswer = async () => {
    if (!currentQ || !draftAnswer.trim()) return;
    if (!supabaseConfigured) {
      // ローカルだけ更新（開発用）
      const row: ResponseRow = {
        id: crypto.randomUUID(),
        session_id: sessionId,
        question_id: currentQ.id,
        question: currentQ.question,
        answer: draftAnswer,
        ai_advice: null,
        order_index: idx,
        created_at: new Date().toISOString(),
      };
      setResponses((prev) => [...prev, row]);
      setDraftAnswer('');
      if (idx < salesHearingQuestions.length - 1) setIdx(idx + 1);
      return;
    }
    const { data, error } = await supabase
      .from('responses')
      .insert({
        session_id: sessionId,
        question_id: currentQ.id,
        question: currentQ.question,
        answer: draftAnswer,
        order_index: idx,
      })
      .select('*')
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    setResponses((prev) => [...prev, data as ResponseRow]);
    setDraftAnswer('');
    if (idx < salesHearingQuestions.length - 1) setIdx(idx + 1);
  };

  const finish = async () => {
    if (supabaseConfigured) {
      await supabase
        .from('hearing_sessions')
        .update({ status: 'done', ended_at: new Date().toISOString() })
        .eq('id', sessionId);
    }
    onGoReport();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid lg:grid-cols-[1fr_320px] gap-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <Button variant="ghost" onClick={onBack}>
            ← 一覧へ
          </Button>
          <div className="text-sm text-ink-500">
            {idx + 1} / {salesHearingQuestions.length} 問
          </div>
          <Button variant="secondary" onClick={finish}>
            ヒアリング終了 → レポート
          </Button>
        </div>

        {customer && (
          <Card>
            <div className="text-xs text-brand-700 font-bold mb-1">顧客情報</div>
            <div className="grid sm:grid-cols-2 gap-x-4 gap-y-1 text-sm">
              <div><span className="text-ink-500">氏名:</span> {customer.name}</div>
              <div><span className="text-ink-500">エリア:</span> {customer.station_pref ?? '—'}</div>
              <div><span className="text-ink-500">予算:</span> {customer.budget_band ?? '—'}</div>
              <div><span className="text-ink-500">年収:</span> {customer.income_band ?? '—'}</div>
              <div><span className="text-ink-500">物件:</span> {customer.property_type ?? '—'} / {customer.layout ?? '—'}</div>
              <div><span className="text-ink-500">検討:</span> {customer.consideration_status ?? '—'}</div>
            </div>
          </Card>
        )}

        {currentQ && (
          <Card>
            <div className="text-xs font-bold text-brand-600 mb-2">{currentQ.category}</div>
            <div className="text-lg font-semibold mb-2">{currentQ.question}</div>
            {currentQ.hint && (
              <div className="text-xs text-ink-500 bg-ink-100 rounded-lg p-2 mb-3">
                💡 {currentQ.hint}
              </div>
            )}
            <Field q={currentQ} value={draftAnswer} onChange={setDraftAnswer} />
            <div className="flex justify-between mt-4 gap-2">
              <Button
                variant="ghost"
                onClick={() => setIdx(Math.max(0, idx - 1))}
                disabled={idx === 0}
              >
                ← 前へ
              </Button>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => setIdx(Math.min(salesHearingQuestions.length - 1, idx + 1))}
                >
                  スキップ →
                </Button>
                <Button onClick={saveAnswer} disabled={!draftAnswer.trim()}>
                  記録して次へ →
                </Button>
              </div>
            </div>
          </Card>
        )}

        {responses.length > 0 && (
          <Card>
            <div className="text-xs font-bold text-ink-500 mb-2">これまでの回答</div>
            <ul className="space-y-2">
              {responses.map((r) => (
                <li key={r.id} className="text-sm border-l-2 border-brand-300 pl-3">
                  <div className="text-ink-500 text-xs">{r.question}</div>
                  <div className="text-ink-900">{displayValue(r.answer)}</div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      <div className="space-y-4">
        <AIAdvicePanel
          customer={customer}
          responses={responses}
          currentQuestion={currentQ?.question ?? ''}
          currentAnswer={draftAnswer}
          manualSnippets={manualSnippets}
        />

        <Card>
          <div className="text-xs font-bold text-ink-500 mb-2">参照マニュアル</div>
          <ul className="space-y-1 text-xs">
            {manuals.length === 0 && (
              <li className="text-ink-500">マニュアル未登録</li>
            )}
            {manuals.map((m) => (
              <li key={m.id} className="text-ink-700">
                ・{m.title}{' '}
                <span className="text-ink-500">({m.category ?? 'misc'})</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
