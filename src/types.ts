// ---------- DB row types ----------
export interface Customer {
  id: string;
  name: string;
  name_kana?: string | null;
  gender?: string | null;
  age?: number | null;
  phone?: string | null;
  email?: string | null;
  line_name?: string | null;
  hearing_method?: string | null;
  area_pref?: string | null;
  station_pref?: string | null;
  household?: string | null;
  consideration_status?: string | null;
  job?: string | null;
  current_station?: string | null;
  workplace_station?: string | null;
  property_type?: string | null;
  layout?: string | null;
  age_pref?: string | null;
  income_band?: string | null;
  budget_band?: string | null;
  consult_topics?: string[] | null;
  other_notes?: string | null;
  source_form?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface HearingSession {
  id: string;
  customer_id: string;
  sales_member?: string | null;
  status: 'preparing' | 'in_progress' | 'done';
  started_at?: string | null;
  ended_at?: string | null;
  transcript?: string | null;
  report_md?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ResponseRow {
  id: string;
  session_id: string;
  question_id: string;
  question: string;
  answer: string;
  ai_advice?: string | null;
  order_index: number;
  created_at: string;
}

export interface Manual {
  id: string;
  title: string;
  category?: string | null;
  content: string;
  tags?: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ---------- Question tree ----------
export type QuestionKind =
  | 'text'
  | 'longtext'
  | 'select'
  | 'multiselect'
  | 'number';

export interface Question {
  id: string;
  category: string;
  question: string;
  hint?: string;            // 営業向け補足
  kind: QuestionKind;
  options?: string[];       // select / multiselect 用
  required?: boolean;
  // 表示条件: 直前までの answers を見て表示判定（あれば）
  showIf?: (answers: Record<string, string>) => boolean;
}
