// Logic thuần cho làm mới nền (002 US4, iPhone bản ký miễn phí không có thông báo đẩy):
// so danh sách việc đã biết với danh sách mới tải → việc mới / việc đổi hạn để báo và đặt lại nhắc.

import type { Task } from './types';

export interface TaskSnapshot {
  [taskId: string]: string; // due_at hoặc '' nếu không có hạn
}

export function snapshotOf(tasks: Task[]): TaskSnapshot {
  const s: TaskSnapshot = {};
  for (const t of tasks) if (t.status === 'open') s[String(t.id)] = t.due_at ?? '';
  return s;
}

/** Việc mới (chưa có trong ảnh chụp) và việc còn mở bị đổi hạn. Ảnh chụp rỗng (lần đầu) → không báo gì. */
export function diffTasks(prev: TaskSnapshot | null, tasks: Task[]): { added: Task[]; moved: Task[] } {
  if (!prev || Object.keys(prev).length === 0) return { added: [], moved: [] };
  const added: Task[] = [];
  const moved: Task[] = [];
  for (const t of tasks) {
    if (t.status !== 'open') continue;
    const key = String(t.id);
    if (!(key in prev)) added.push(t);
    else if ((t.due_at ?? '') !== prev[key]) moved.push(t);
  }
  return { added, moved };
}

/** Một thông báo gộp cho lần làm mới nền (giống thông báo đẩy phía máy chủ). */
export function summaryOf(added: Task[], moved: Task[], fmt: (due: string | null) => string): { title: string; body: string } | null {
  const list = added.length ? added : moved;
  if (!list.length) return null;
  const soonest = [...list].sort((a, b) => (a.due_at ?? '9999').localeCompare(b.due_at ?? '9999'))[0];
  const line = `${soonest.title} · ${fmt(soonest.due_at)}`;
  if (list.length === 1) return { title: added.length ? 'MStudent: việc mới' : 'MStudent: cập nhật hạn', body: line };
  return {
    title: added.length ? `MStudent: ${list.length} việc mới` : `MStudent: ${list.length} việc được cập nhật`,
    body: `Sớm nhất: ${line}`,
  };
}
