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
  mode: 'llm' | 'offline';
  trace: TraceStep[];
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
