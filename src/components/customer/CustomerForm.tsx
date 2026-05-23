import { useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Field } from '../ui/Field';
import { customerFormQuestions } from '../../lib/questions';
import { supabase, supabaseConfigured } from '../../lib/supabase';

export function CustomerForm() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof customerFormQuestions>();
    for (const q of customerFormQuestions) {
      const list = map.get(q.category) ?? [];
      list.push(q);
      map.set(q.category, list);
    }
    return Array.from(map.entries());
  }, []);

  const setA = (id: string, v: string) =>
    setAnswers((prev) => ({ ...prev, [id]: v }));

  const canSubmit =
    agree && Boolean(answers.name) && !submitting;

  const onSubmit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      if (!supabaseConfigured) {
        // フォーム送信のスモークテスト（Supabase未設定でも動作確認できるよう）
        await new Promise((r) => setTimeout(r, 500));
        setDone(true);
        return;
      }
      const { error: e } = await supabase.from('customers').insert({
        name: answers.name,
        gender: answers.gender || null,
        age: answers.age ? Number(answers.age) : null,
        phone: answers.phone || null,
        email: answers.email || null,
        line_name: answers.line_name || null,
        hearing_method: answers.hearing_method || null,
        area_pref: answers.area_pref || null,
        station_pref: answers.station_pref || null,
        household: answers.household || null,
        consideration_status: answers.consideration || null,
        job: answers.job || null,
        current_station: answers.current_station || null,
        workplace_station: answers.workplace_station || null,
        property_type: answers.property_type || null,
        layout: answers.layout || null,
        age_pref: answers.age_pref || null,
        income_band: answers.income_band || null,
        budget_band: answers.budget_band || null,
        consult_topics: answers.consult_topics
          ? answers.consult_topics.split('||')
          : null,
        other_notes: answers.other_notes || null,
        source_form: answers,
      });
      if (e) throw e;
      setDone(true);
    } catch (e: any) {
      setError(e?.message ?? '送信に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Card className="text-center">
          <div className="text-5xl mb-4">🙇</div>
          <h2 className="text-xl font-bold mb-2">ご回答ありがとうございました</h2>
          <p className="text-ink-500 text-sm">
            担当者より追って、ヒアリングの日程ご相談のご連絡をいたします。
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
          ないけんぼーいず
        </div>
        <h1 className="text-2xl font-bold">事前ヒアリングシート</h1>
        <p className="text-ink-500 text-sm">
          スムーズなご提案のため、いくつかお伺いします。<br />
          わかる範囲で大丈夫です（後から営業がフォローします）
        </p>
      </div>

      {grouped.map(([category, items]) => (
        <Card key={category}>
          <div className="text-xs font-bold text-brand-600 mb-3">{category}</div>
          <div className="space-y-4">
            {items.map((q) => (
              <div key={q.id}>
                <label className="block text-sm font-semibold text-ink-700 mb-1.5">
                  {q.question}
                  {q.required && <span className="text-red-500 ml-1">*</span>}
                </label>
                <Field
                  q={q}
                  value={answers[q.id] ?? ''}
                  onChange={(v) => setA(q.id, v)}
                />
              </div>
            ))}
          </div>
        </Card>
      ))}

      <Card>
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1"
          />
          <span className="text-sm text-ink-700">
            株式会社ないけんぼーいずの
            <a href="#" className="text-brand-600 underline">利用規約</a>
            および
            <a href="#" className="text-brand-600 underline">プライバシーポリシー</a>
            に同意します
          </span>
        </label>
      </Card>

      {error && (
        <Card className="border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </Card>
      )}

      <div className="flex justify-center pb-12">
        <Button onClick={onSubmit} disabled={!canSubmit} className="px-8 py-3 text-base">
          {submitting ? '送信中…' : '送信する'}
        </Button>
      </div>
    </div>
  );
}
