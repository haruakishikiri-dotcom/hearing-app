-- ===================================================================
-- ないけんぼーいず ヒアリングサポート Supabase スキーマ
-- 流し方: Supabase Dashboard → SQL Editor → New query → このファイル全文 → Run
-- ===================================================================

-- 必要拡張
create extension if not exists "pgcrypto";

-- -------------------------------------------------------------------
-- customers: 顧客 / リード情報（顧客フォーム + 営業の補完）
-- -------------------------------------------------------------------
create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_kana text,
  gender text,                       -- 男性/女性/その他
  age int,
  phone text,
  email text,
  line_name text,
  hearing_method text,               -- 対面/オンライン/電話
  area_pref text,                    -- 検討エリア（都道府県）
  station_pref text,                 -- 検討エリア（路線/最寄駅）
  household text,                    -- 同棲/夫婦/家族/単身
  consideration_status text,         -- 購入の検討状況
  job text,
  current_station text,
  workplace_station text,
  property_type text,                -- 戸建て/マンション
  layout text,                       -- 3LDK 等
  age_pref text,                     -- 築年数希望
  income_band text,                  -- 1200万円台 等
  budget_band text,                  -- 4000万円台 等
  consult_topics text[],             -- 特に相談したいこと（タグ）
  other_notes text,
  source_form jsonb,                 -- 顧客フォームから来た原データ
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists customers_created_at_idx on customers (created_at desc);

-- -------------------------------------------------------------------
-- hearing_sessions: ヒアリング1回ごと
-- -------------------------------------------------------------------
create table if not exists hearing_sessions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete cascade,
  sales_member text,                  -- 担当営業（とりあえずテキスト）
  status text default 'preparing',    -- preparing / in_progress / done
  started_at timestamptz,
  ended_at timestamptz,
  transcript text,                    -- 文字起こし貼付
  report_md text,                     -- Claude が生成したレポート (Markdown)
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists hearing_sessions_customer_idx on hearing_sessions (customer_id);
create index if not exists hearing_sessions_status_idx on hearing_sessions (status);

-- -------------------------------------------------------------------
-- responses: ヒアリング中のQ&Aログ
-- -------------------------------------------------------------------
create table if not exists responses (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references hearing_sessions(id) on delete cascade,
  question_id text,                   -- constants.ts の質問ID
  question text,                      -- 質問文（変更後も追跡できるようsnapshot）
  answer text,
  ai_advice text,                     -- 営業向けAI助言（顧客には非表示）
  order_index int default 0,
  created_at timestamptz default now()
);

create index if not exists responses_session_idx on responses (session_id, order_index);

-- -------------------------------------------------------------------
-- manuals: AIに参照させるマニュアル文書
-- -------------------------------------------------------------------
create table if not exists manuals (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text,                      -- talk_script / area_guide / closing 等
  content text not null,
  tags text[],
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists manuals_active_idx on manuals (is_active, category);

-- -------------------------------------------------------------------
-- RLS: 社内利用前提でフルオープン（必要なら後で締める）
-- -------------------------------------------------------------------
alter table customers          enable row level security;
alter table hearing_sessions   enable row level security;
alter table responses          enable row level security;
alter table manuals            enable row level security;

drop policy if exists customers_open on customers;
drop policy if exists sessions_open  on hearing_sessions;
drop policy if exists responses_open on responses;
drop policy if exists manuals_open   on manuals;

create policy customers_open on customers          for all using (true) with check (true);
create policy sessions_open  on hearing_sessions   for all using (true) with check (true);
create policy responses_open on responses          for all using (true) with check (true);
create policy manuals_open   on manuals            for all using (true) with check (true);

-- -------------------------------------------------------------------
-- Realtime: 営業同士で同じセッションを見るときのため
-- -------------------------------------------------------------------
alter publication supabase_realtime add table customers;
alter publication supabase_realtime add table hearing_sessions;
alter publication supabase_realtime add table responses;

-- -------------------------------------------------------------------
-- updated_at 自動更新
-- -------------------------------------------------------------------
create or replace function set_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists customers_updated_at on customers;
drop trigger if exists sessions_updated_at on hearing_sessions;
drop trigger if exists manuals_updated_at on manuals;

create trigger customers_updated_at before update on customers
  for each row execute function set_updated_at();
create trigger sessions_updated_at before update on hearing_sessions
  for each row execute function set_updated_at();
create trigger manuals_updated_at before update on manuals
  for each row execute function set_updated_at();

-- -------------------------------------------------------------------
-- サンプルマニュアル（後で差し替え or 追加してください）
-- -------------------------------------------------------------------
insert into manuals (title, category, content, tags) values
('鷺沼エリア 基本ガイド', 'area_guide',
 E'■ 鷺沼駅（東急田園都市線・神奈川県川崎市宮前区）\n- 渋谷まで急行約20分・各停約25分\n- ファミリー層に人気、教育環境良好（鷺沼小学校学区が特に人気）\n- 周辺施設: フレル鷺沼・鷺沼プール・東急ストア\n- 中古戸建相場（参考）: 駅徒歩10〜15分圏で4000万〜6000万円台が中心\n- 新築戸建相場（参考）: 5000万〜8000万円台が中心\n- 代替候補エリア: 宮前平・たまプラーザ・あざみ野・梶が谷\n- 注意点: 坂道が多いエリア、駅から物件までの徒歩動線要確認',
 ARRAY['鷺沼','神奈川','エリア']),
('予算 vs 借入 早見メモ', 'finance',
 E'■ 住宅ローン早見\n- 年収倍率の目安: 7倍\n- 例) 年収1200万 → 借入余力 約8400万\n- 月返済額の目安（35年・元利均等）\n  - 変動0.5%: 4000万借入 ≒ 月10.4万\n  - フラット35 1.85%: 4000万借入 ≒ 月13.0万\n- 諸費用: 物件価格の7〜10%（仲介手数料・登記・ローン手数料等）\n- 返済負担率の目安: 25%以下が健全',
 ARRAY['資金計画','住宅ローン']),
('クロージング会話 基本', 'closing',
 E'■ クロージングの型\n1. 共感: 「将来の話なので慎重になるのは当然ですよね」\n2. 仮確定: 「もし条件が揃ったらいつ頃イメージしてますか?」\n3. 次のアクション小提案: 内見1件 / 事前審査 / 物件情報定期送付の3択\n4. クロージング: 「次回◯月◯日にお話する時間いただけますか?」\n- 「考えます」と言われた時: 何を考えるかを具体化する質問で深掘り\n- 「他社も見ます」と言われた時: 他社で見られない弊社独自の付加価値（鷺沼エリアの濃さ等）を提示',
 ARRAY['クロージング','トーク'])
on conflict do nothing;
