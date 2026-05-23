import { useEffect, useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import type { Customer, HearingSession } from '../../types';
import { SALES_MEMBERS } from '../../constants';

interface Props {
  onOpenSession: (sessionId: string) => void;
  onOpenReport: (sessionId: string) => void;
}

interface Row {
  session: HearingSession;
  customer?: Customer;
}

export function SalesDashboard({ onOpenSession, onOpenReport }: Props) {
  const [rows, setRows] = useState<Row[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [salesMember, setSalesMember] = useState<string>(SALES_MEMBERS[0]);

  const fetchAll = async () => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: ses }, { data: cus }] = await Promise.all([
      supabase
        .from('hearing_sessions')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase.from('customers').select('*').order('created_at', { ascending: false }),
    ]);
    const cmap = new Map((cus ?? []).map((c) => [c.id, c as Customer]));
    setCustomers((cus as Customer[]) ?? []);
    setRows(
      ((ses as HearingSession[]) ?? []).map((s) => ({
        session: s,
        customer: cmap.get(s.customer_id),
      })),
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const newSession = async (customerId: string) => {
    if (!supabaseConfigured) {
      alert('Supabase が未設定です。.env.local を確認してください。');
      return;
    }
    const { data, error } = await supabase
      .from('hearing_sessions')
      .insert({ customer_id: customerId, sales_member: salesMember, status: 'preparing' })
      .select('id')
      .single();
    if (error) {
      alert(error.message);
      return;
    }
    if (data?.id) onOpenSession(data.id);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">ヒアリングダッシュボード</h1>
          <p className="text-ink-500 text-sm">担当: {salesMember}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={salesMember}
            onChange={(e) => setSalesMember(e.target.value)}
            className="rounded-xl border border-ink-300 px-3 py-2 text-sm"
          >
            {SALES_MEMBERS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          <Button onClick={() => setShowNew(!showNew)} variant="secondary">
            ＋ 新規ヒアリング
          </Button>
        </div>
      </div>

      {!supabaseConfigured && (
        <Card className="border border-yellow-300 bg-yellow-50 text-yellow-900 text-sm">
          Supabase が未設定です。<code className="bg-white px-1 rounded">.env.local</code>{' '}
          に <code className="bg-white px-1 rounded">VITE_SUPABASE_URL</code>{' '}
          と <code className="bg-white px-1 rounded">VITE_SUPABASE_ANON_KEY</code>{' '}
          を設定してください。
        </Card>
      )}

      {showNew && (
        <Card>
          <div className="text-sm font-semibold mb-3">既存顧客から選んでヒアリング開始</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {customers.map((c) => (
              <button
                key={c.id}
                onClick={() => newSession(c.id)}
                className="text-left p-3 rounded-xl border border-ink-300 hover:border-brand-400 hover:bg-brand-50 transition"
              >
                <div className="font-semibold text-ink-900">{c.name}</div>
                <div className="text-xs text-ink-500">
                  {c.station_pref ?? '—'} / {c.budget_band ?? '—'} / {c.layout ?? '—'}
                </div>
              </button>
            ))}
            {customers.length === 0 && (
              <div className="text-sm text-ink-500">
                まだ顧客がいません。顧客フォーム（/customer）から登録するか、Supabase に直接入れてください。
              </div>
            )}
          </div>
        </Card>
      )}

      <Card>
        <div className="text-sm font-semibold mb-3">最近のヒアリングセッション</div>
        {loading && <div className="text-sm text-ink-500">読込中…</div>}
        {!loading && rows.length === 0 && (
          <div className="text-sm text-ink-500">まだセッションがありません。</div>
        )}
        <ul className="divide-y divide-ink-100">
          {rows.map(({ session, customer }) => (
            <li key={session.id} className="py-3 flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="font-semibold">
                  {customer?.name ?? '（顧客不明）'}{' '}
                  <span className="text-xs font-normal text-ink-500 ml-2">
                    {customer?.station_pref ?? ''} / {customer?.budget_band ?? ''}
                  </span>
                </div>
                <div className="text-xs text-ink-500">
                  {session.sales_member ?? '—'} ・{' '}
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      session.status === 'done'
                        ? 'bg-emerald-100 text-emerald-700'
                        : session.status === 'in_progress'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-ink-100 text-ink-700'
                    }`}
                  >
                    {session.status}
                  </span>{' '}
                  ・ {new Date(session.created_at).toLocaleString('ja-JP')}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => onOpenSession(session.id)}>
                  ヒアリング画面
                </Button>
                <Button variant="ghost" onClick={() => onOpenReport(session.id)}>
                  レポート
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
