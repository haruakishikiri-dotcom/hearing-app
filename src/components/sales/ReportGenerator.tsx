import { useEffect, useMemo, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { generateReport } from '../../lib/claude';
import type {
  Customer,
  HearingSession as Session,
  Manual,
  ResponseRow,
} from '../../types';

interface Props {
  sessionId: string;
  onBack: () => void;
}

function renderMarkdown(md: string): string {
  // 軽量Markdown→HTML（見出し・リスト・太字程度）
  const escape = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let html = escape(md);
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/^\- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
  html = html.replace(/\n\n+/g, '</p><p>');
  html = `<p>${html}</p>`;
  html = html.replace(/<p>(<(h1|h2|h3|ul)>)/g, '$1').replace(/(<\/(h1|h2|h3|ul)>)<\/p>/g, '$1');
  return html;
}

export function ReportGenerator({ sessionId, onBack }: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [manuals, setManuals] = useState<Manual[]>([]);
  const [transcript, setTranscript] = useState('');
  const [report, setReport] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!supabaseConfigured) return;
      const { data: s } = await supabase
        .from('hearing_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();
      if (!s) return;
      setSession(s as Session);
      setTranscript((s as Session).transcript ?? '');
      setReport((s as Session).report_md ?? '');
      const [{ data: c }, { data: r }, { data: m }] = await Promise.all([
        supabase.from('customers').select('*').eq('id', (s as Session).customer_id).single(),
        supabase
          .from('responses')
          .select('*')
          .eq('session_id', sessionId)
          .order('order_index'),
        supabase.from('manuals').select('*').eq('is_active', true),
      ]);
      setCustomer((c as Customer) ?? null);
      setResponses((r as ResponseRow[]) ?? []);
      setManuals((m as Manual[]) ?? []);
    })();
  }, [sessionId]);

  const manualSnippets = useMemo(
    () => manuals.map((m) => `## ${m.title}\n${m.content}`),
    [manuals],
  );

  const onGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const md = await generateReport({
        transcript,
        customerJson: JSON.stringify(customer ?? {}, null, 2),
        qaJson: JSON.stringify(
          responses.map((r) => ({ q: r.question, a: r.answer })),
          null,
          2,
        ),
        manualSnippets,
      });
      setReport(md);
      if (supabaseConfigured) {
        await supabase
          .from('hearing_sessions')
          .update({ transcript, report_md: md })
          .eq('id', sessionId);
      }
    } catch (e: any) {
      setError(e?.message ?? 'レポート生成に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const onSaveTranscript = async () => {
    if (!supabaseConfigured) return;
    await supabase
      .from('hearing_sessions')
      .update({ transcript })
      .eq('id', sessionId);
  };

  const onCopy = () => {
    if (!report) return;
    navigator.clipboard.writeText(report);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Button variant="ghost" onClick={onBack}>
          ← 一覧へ
        </Button>
        <h1 className="text-xl font-bold">レポート生成</h1>
        <div />
      </div>

      {customer && (
        <Card>
          <div className="text-xs text-brand-700 font-bold mb-1">対象顧客</div>
          <div className="text-sm">
            <span className="font-semibold">{customer.name}</span>{' '}
            <span className="text-ink-500">
              / {customer.station_pref ?? '—'} / {customer.budget_band ?? '—'} /{' '}
              {customer.property_type ?? '—'}
            </span>
          </div>
          <div className="text-xs text-ink-500 mt-1">
            記録済みQ&A: {responses.length} 件 ／ 担当: {session?.sales_member ?? '—'}
          </div>
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm font-semibold">文字起こし（任意・貼り付け）</div>
          <Button variant="ghost" onClick={onSaveTranscript}>
            下書き保存
          </Button>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          rows={10}
          placeholder="ZoomやGoogle Meetの文字起こしをここに貼り付けてください。空でもQ&Aログだけからレポート生成できます。"
          className="w-full rounded-xl border border-ink-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
        />
      </Card>

      <div className="flex justify-center">
        <Button onClick={onGenerate} disabled={loading} className="px-8 py-3 text-base">
          {loading ? 'Claudeで生成中…（10〜30秒）' : '🤖 レポートを生成'}
        </Button>
      </div>

      {error && (
        <Card className="border border-red-200 bg-red-50 text-red-700 text-sm">{error}</Card>
      )}

      {report && (
        <Card>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">生成レポート</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onCopy}>
                コピー
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  const blob = new Blob([report], { type: 'text/markdown' });
                  const a = document.createElement('a');
                  a.href = URL.createObjectURL(blob);
                  a.download = `hearing-report-${customer?.name ?? 'unknown'}.md`;
                  a.click();
                }}
              >
                .md ダウンロード
              </Button>
            </div>
          </div>
          <div
            className="markdown text-sm text-ink-900"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(report) }}
          />
        </Card>
      )}
    </div>
  );
}
