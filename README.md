# hearing-app

ないけんぼーいず ヒアリングサポートアプリ。
お客様の事前ヒアリング → 営業の対面ヒアリング → AIによるレポート生成までを1アプリで。

## 構成

- **Vite + React 18 + TypeScript**: フロントエンド
- **Tailwind CSS**: スタイリング（ブランドカラー: orange #f5a623）
- **Supabase**: 顧客・セッション・回答・マニュアルのDB保存
- **Vercel Serverless Function (`/api/claude.ts`)**: Claude API (Anthropic) を呼ぶ
- **Claude (claude-sonnet-4-5)**: 
  - ヒアリング中のリアルタイム助言
  - 文字起こし＋Q&Aから議事録レポート自動生成

## ディレクトリ

```
hearing-app/
├── api/claude.ts            # Vercel Serverless: Claude API
├── supabase/schema.sql      # DB スキーマ + サンプルマニュアル
├── src/
│   ├── App.tsx              # ハッシュベースのルーター
│   ├── main.tsx
│   ├── types.ts
│   ├── constants.ts         # 営業メンバー名簿
│   ├── index.css
│   ├── lib/
│   │   ├── supabase.ts
│   │   ├── claude.ts        # /api/claude 呼び出し
│   │   └── questions.ts     # 顧客フォーム & 営業ヒアリング質問ツリー
│   └── components/
│       ├── ui/              # Button / Card / Field
│       ├── customer/        # CustomerForm
│       └── sales/           # SalesDashboard / HearingSession / AIAdvicePanel / ReportGenerator
└── vercel.json              # SPA リライト
```

## セットアップ

### 1. Supabase スキーマを流す

1. `sales-task-app` と同じ Supabase プロジェクトでも別プロジェクトでもOK
2. ダッシュボード → SQL Editor → New query
3. `supabase/schema.sql` を全文コピペ → Run
4. テーブル `customers / hearing_sessions / responses / manuals` ができていること、
   `manuals` にサンプル3件入っていることを確認

### 2. ローカル環境変数

`.env.local` を作って以下を設定:

```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=ey...your-anon-key...
```

Anthropic APIキーはローカル不要（Vercelに直接設定）。

### 3. 依存インストール → 起動

```powershell
cd C:\Users\wimbs\Desktop\claude code\hearing-app
npm install
npm run dev
```

http://localhost:5174 が開きます。

### 4. Anthropic API キー取得

1. https://console.anthropic.com/ → Sign up
2. Plans & Billing → クレジットカード登録（$5〜入金）
3. API Keys → Create Key（名前: `hearing-app-prod`）
4. `sk-ant-...` をコピー（再表示不可）

### 5. Vercel デプロイ

1. `vercel link`（または Web UI でプロジェクト作成）
2. プロジェクト設定 → Settings → Environment Variables で
   - `ANTHROPIC_API_KEY` = `sk-ant-...`
   - `VITE_SUPABASE_URL` = `https://xxxxx.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `ey...`
3. `vercel --prod` または GitHub 連携で自動デプロイ

## 使い方

### お客様用フォーム `/customer`
- LINEや事前メールでこのURLを送る
- お客様に基本情報を入力していただく
- 送信されると `customers` テーブルに保存

### 営業用ダッシュボード `/sales`
- ログイン不要（社内利用前提）。担当者をプルダウンで切替
- 顧客一覧から「ヒアリング開始」→ セッション作成
- ヒアリング画面: 質問が順番に出る／顧客の回答を記録／**右側にAIアドバイス表示**
- 「ヒアリング終了 → レポート」で次画面
- 文字起こしを貼り付け → 「レポート生成」でClaudeがMarkdownレポート作成

## カスタマイズしたい時

### 質問項目を増やす/減らす
`src/lib/questions.ts` の `customerFormQuestions` / `salesHearingQuestions` を編集。

### マニュアルを追加
Supabase ダッシュボード → Table Editor → `manuals` で追加。
`is_active = true` のものがAIに参照される。

### AIへのプロンプトを調整
`api/claude.ts` の `ADVICE_SYSTEM` / `REPORT_SYSTEM` を編集。

### 営業メンバー名簿を変更
`src/constants.ts` の `SALES_MEMBERS` を編集。

## TODO（フェーズ2以降）

- Googleドライブのマニュアル取込（MCP経由でDBにインポート）
- 営業メンバーごとのログイン（Supabase Auth）
- 音声ファイルアップロード→Whisper文字起こし
- Slackへのレポート自動投稿
- 顧客のヒアリング履歴タイムライン
