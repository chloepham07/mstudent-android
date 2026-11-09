// Client gọi backend MStudent. Không bao giờ chứa API key của LLM — key chỉ nằm trên server.

import type { ChatResponse, ChatTurn, Health, IngestResult, Source, Task } from './types';

export interface Conn {
  baseUrl: string;
  token: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function call<T>(conn: Conn, path: string, init: RequestInit = {}, timeoutMs = 30000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (conn.token) headers.Authorization = `Bearer ${conn.token}`;
  try {
    const res = await fetch(conn.baseUrl.replace(/\/+$/, '') + path, { ...init, headers, signal: ctrl.signal });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      const d = (body as { detail?: unknown }).detail;
      const msg = Array.isArray(d) ? d.map((x: { msg?: string }) => x.msg).join('; ') : String(d ?? res.statusText);
      throw new ApiError(res.status === 401 ? 'Sai hoặc thiếu token (Cài đặt → Token)' : msg, res.status);
    }
    return (await res.json()) as T;
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if ((e as Error).name === 'AbortError') throw new ApiError('Server không phản hồi (quá thời gian)', 0);
    throw new ApiError(`Không kết nối được ${conn.baseUrl} — kiểm tra địa chỉ server trong Cài đặt`, 0);
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  health: (c: Conn) => call<Health>(c, '/api/health', {}, 8000),
  tasks: (c: Conn) => call<Task[]>(c, '/api/tasks'),
  done: (c: Conn, id: number) => call<Task>(c, `/api/tasks/${id}/done`, { method: 'POST' }),
  patch: (c: Conn, id: number, body: Partial<Pick<Task, 'title' | 'due_at' | 'status'>>) =>
    call<Task>(c, `/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  ingest: (c: Conn, body: string, source: Source) =>
    call<IngestResult>(c, '/api/ingest', { method: 'POST', body: JSON.stringify({ body, source }) }, 60000),
  chat: (c: Conn, message: string, history: ChatTurn[]) =>
    call<ChatResponse>(c, '/api/chat', { method: 'POST', body: JSON.stringify({ message, history }) }, 90000),
  digest: (c: Conn) => call<{ mode: string; text: string }>(c, '/api/digest', {}, 60000),
  seed: (c: Conn) => call<IngestResult[]>(c, '/api/demo/seed', { method: 'POST' }, 120000),
};
