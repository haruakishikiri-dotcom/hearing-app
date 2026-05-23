import { useEffect, useState } from 'react';
import { CustomerForm } from './components/customer/CustomerForm';
import { SalesDashboard } from './components/sales/SalesDashboard';
import { HearingSession } from './components/sales/HearingSession';
import { ReportGenerator } from './components/sales/ReportGenerator';
import { APP_TITLE, COMPANY } from './constants';

type Route =
  | { name: 'landing' }
  | { name: 'customer' }
  | { name: 'sales' }
  | { name: 'session'; id: string }
  | { name: 'report'; id: string };

function parseHash(): Route {
  const h = window.location.hash.replace(/^#\/?/, '');
  if (h === '' || h === 'home') return { name: 'landing' };
  if (h === 'customer') return { name: 'customer' };
  if (h === 'sales') return { name: 'sales' };
  const sess = h.match(/^session\/([^/]+)$/);
  if (sess) return { name: 'session', id: sess[1] };
  const rep = h.match(/^report\/([^/]+)$/);
  if (rep) return { name: 'report', id: rep[1] };
  return { name: 'landing' };
}

function setHash(path: string) {
  window.location.hash = `#/${path}`;
}

export default function App() {
  const [route, setRoute] = useState<Route>(() => parseHash());

  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {route.name === 'landing' && <Landing />}
        {route.name === 'customer' && <CustomerForm />}
        {route.name === 'sales' && (
          <SalesDashboard
            onOpenSession={(id) => setHash(`session/${id}`)}
            onOpenReport={(id) => setHash(`report/${id}`)}
          />
        )}
        {route.name === 'session' && (
          <HearingSession
            sessionId={route.id}
            onBack={() => setHash('sales')}
            onGoReport={() => setHash(`report/${route.id}`)}
          />
        )}
        {route.name === 'report' && (
          <ReportGenerator sessionId={route.id} onBack={() => setHash('sales')} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-30 bg-white border-b border-ink-100 shadow-soft">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="#/" className="flex items-center gap-2 text-ink-900 no-underline">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-400 to-brand-600 text-white grid place-items-center font-bold">
            N
          </span>
          <div>
            <div className="text-sm font-bold leading-none">{APP_TITLE}</div>
            <div className="text-[10px] text-ink-500">{COMPANY}</div>
          </div>
        </a>
        <nav className="flex items-center gap-1 text-xs">
          <a href="#/customer" className="px-3 py-1.5 rounded-lg hover:bg-ink-100">
            顧客フォーム
          </a>
          <a href="#/sales" className="px-3 py-1.5 rounded-lg hover:bg-ink-100">
            営業ダッシュボード
          </a>
        </nav>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="text-center text-[11px] text-ink-500 py-6">
      © {new Date().getFullYear()} {COMPANY} — {APP_TITLE}
    </footer>
  );
}

function Landing() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-8">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-100 text-brand-700 text-xs font-bold">
        {COMPANY}
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold leading-tight">
        ヒアリングサポート
      </h1>
      <p className="text-ink-500 leading-relaxed">
        お客様の事前ヒアリング → 営業のリアルタイム対面 → AIによるレポート生成 まで、
        <br className="hidden sm:block" />
        ひとつのアプリで完結します。
      </p>
      <div className="grid sm:grid-cols-2 gap-4 mt-12">
        <a
          href="#/customer"
          className="block p-6 rounded-2xl border-2 border-brand-200 bg-white hover:border-brand-500 hover:shadow-pop transition no-underline text-left"
        >
          <div className="text-2xl mb-2">🙋</div>
          <div className="font-bold text-ink-900 mb-1">お客様用フォーム</div>
          <div className="text-sm text-ink-500">
            事前にいくつか情報をいただき、当日のヒアリングをスムーズにします。
          </div>
        </a>
        <a
          href="#/sales"
          className="block p-6 rounded-2xl border-2 border-ink-200 bg-white hover:border-ink-900 hover:shadow-pop transition no-underline text-left"
        >
          <div className="text-2xl mb-2">💼</div>
          <div className="font-bold text-ink-900 mb-1">営業用ダッシュボード</div>
          <div className="text-sm text-ink-500">
            ヒアリングの進行・AIアドバイス表示・レポート生成。営業メンバー限定。
          </div>
        </a>
      </div>
    </div>
  );
}
