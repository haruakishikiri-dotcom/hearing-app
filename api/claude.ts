// Vercel Serverless Function: /api/claude
// Claude API (Anthropic) を呼び出す。APIキーは Vercel の環境変数 ANTHROPIC_API_KEY に格納する。
// クライアントからは送らない（漏洩防止のためサーバー側のみ）。

type Mode = 'advice' | 'report';

interface RequestBody {
  mode: Mode;
  // mode === 'advice'
  customerSummary?: string;       // 顧客プロフィールサマリ
  recentQA?: { q: string; a: string }[]; // 直近Q&A履歴
  currentQuestion?: string;       // 今この瞬間に出している質問
  currentAnswer?: string;         // 顧客のその回答
  // mode === 'report'
  transcript?: string;            // 文字起こし全文
  customerJson?: string;          // 顧客プロフィールJSON
  qaJson?: string;                // Q&AログJSON
  // 共通
  manualSnippets?: string[];      // マニュアル抜粋
}

const ADVICE_SYSTEM = `あなたは株式会社ないけんぼーいず（不動産会社）の営業に同席するアシスタントです。
役割: 営業が顧客にヒアリングしている最中に、次に聞くと有効な深掘り質問と、注意点を即座に提案する。

出力スタイル:
- 営業の頭の中だけに届くメモのつもりで簡潔に
- マークダウン見出しは使わない、箇条書きで3〜5項目
- 各項目は最大40文字程度
- 最後に「★今この瞬間の最優先質問: …」を1つだけ提示
- マニュアル抜粋がある場合はそれに沿った提案を優先

絶対NG: 顧客の前で読み上げる前提のため、敬語の長文・前置きは禁止。`;

const REPORT_SYSTEM = `あなたは株式会社ないけんぼーいずの営業アシスタントです。
ヒアリングの文字起こし・顧客プロフィール・Q&Aログを統合して、社内共有用のヒアリングレポートをMarkdownで作成します。

レポート構成（この順番で出力）:
# ヒアリングレポート - {顧客名}

## 1. サマリ（5行以内）
- 温度感
- 購入時期
- 予算 vs 期待値
- 意思決定者
- 次回アクション

## 2. 顧客プロフィール
（提供情報をテーブル形式で整理）

## 3. ヒアリングで判明した重要事項
- 箇条書きで網羅

## 4. 懸念点・リスク
- 箇条書き

## 5. 次回アクション提案
- 営業として打つべき次の手を3つ

## 6. 提案物件の方向性
- エリア・価格帯・築年数・タイプの推奨

## 7. AIメモ（営業向け）
- クロージング戦略
- 注意したい地雷ワード

トーン: 簡潔・営業現場で読みやすい。冗長な前置きや言い回しは避ける。`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: 'ANTHROPIC_API_KEY is not configured on the server.' });
    return;
  }
  let body: RequestBody;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  const { mode } = body;
  let system = '';
  let userMessage = '';

  if (mode === 'advice') {
    system = ADVICE_SYSTEM;
    const manuals = (body.manualSnippets ?? []).slice(0, 4).join('\n\n---\n\n');
    userMessage = `# 顧客プロフィール
${body.customerSummary ?? '（未入力）'}

# 直近のQ&A
${(body.recentQA ?? [])
  .slice(-5)
  .map((qa, i) => `Q${i + 1}: ${qa.q}\nA${i + 1}: ${qa.a || '（未回答）'}`)
  .join('\n\n')}

# 今出ている質問
${body.currentQuestion ?? '（未設定）'}

# 顧客のその回答（途中でもOK）
${body.currentAnswer ?? '（まだない）'}

# 参考マニュアル
${manuals || '（特になし）'}

→ この情報を踏まえて、営業が次に取るべきアクションと深掘り質問を箇条書きで。`;
  } else if (mode === 'report') {
    system = REPORT_SYSTEM;
    const manuals = (body.manualSnippets ?? []).join('\n\n---\n\n');
    userMessage = `# 顧客プロフィール (JSON)
${body.customerJson ?? '{}'}

# Q&Aログ (JSON)
${body.qaJson ?? '[]'}

# 文字起こし
${body.transcript ?? '（なし）'}

# 参考マニュアル
${manuals || '（なし）'}

→ レポートをMarkdownで出力。`;
  } else {
    res.status(400).json({ error: `Unknown mode: ${mode}` });
    return;
  }

  try {
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: mode === 'report' ? 3000 : 600,
        system,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      res.status(r.status).json({ error: 'Anthropic API error', detail: errText });
      return;
    }
    const data = await r.json();
    const text =
      Array.isArray(data?.content) && data.content[0]?.type === 'text'
        ? data.content[0].text
        : '';
    res.status(200).json({ text, model: data?.model });
  } catch (e: any) {
    res.status(500).json({ error: 'Unhandled error', detail: String(e?.message ?? e) });
  }
}
