// Kiểu dữ liệu khớp với backend/app/models.py

export type Category = 'deadline' | 'exam' | 'class_change' | 'event' | 'admin' | 'other';
export type Priority = 'high' | 'medium' | 'low';
export type Source = 'email' | 'lms' | 'zalo' | 'manual';

export interface Task {
  id: number;
  title: string;
  course: string | null;
  category: Category;
  due_at: string | null; // ISO 8601, +07:00
  location: string | null;
  action: string | null;
  priority: Priority;
  source: Source;
  message_id: string;
  status: string;
  reminders: string[];
  updated_from: string[];
}

export interface TraceStep {
  agent: string;
  kind: 'llm' | 'rules' | 'python';
  ms: number;
  output?: unknown;
  error?: string;
}

export interface IngestResult {
  message_id: string;
  relevant: boolean;
  category: Category;
  reason: string;
  created: Task[];
  updated: Task[];
  mode: 'llm' | 'offline' | 'cache';
  trace: TraceStep[];
  duplicate: boolean;
}

export interface ToolCall {
  tool: string;
  args: Record<string, unknown>;
  result: string;
}

export interface ChatTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatResponse {
  reply: string;
  mode: 'llm' | 'offline';
  tool_calls: ToolCall[];
}

export interface Health {
  ok: boolean;
  mode: 'llm' | 'offline';
  model: string;
  now: string;
}

export const CATEGORY_LABEL: Record<Category, string> = {
  deadline: 'Hạn nộp',
  exam: 'Thi',
  class_change: 'Đổi lịch',
  event: 'Sự kiện',
  admin: 'Thủ tục',
  other: 'Khác',
};

// ---- Tài khoản & tích hợp ----

export interface User {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
  has_password: boolean;
  google_linked: boolean;
  gmail_connected: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
}

export interface PublicConfig {
  registration_open: boolean;
  google: { enabled: boolean; web_client_id: string; ios_client_id: string; gmail: boolean };
}

export interface Stats {
  messages_read: number;
  noise_filtered: number;
  tasks_created: number;
  tasks_done: number;
  tasks_open: number;
  changes_caught: number;
  ai_runs: number;
  by_source: Record<string, number>;
}

export interface AiCheck {
  ok: boolean;
  mode: 'llm' | 'offline';
  model: string;
  latency_ms?: number;
  error?: string;
}

export interface GmailStatus {
  connected: boolean;
  email?: string;
  last_sync_at?: string | null;
}

export interface GmailSyncResult {
  scanned: number;
  new: number;
  tasks_created: number;
  tasks_updated: number;
  noise_filtered: number;
  results: IngestResult[];
}
