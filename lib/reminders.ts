// Logic thuần (không gọi native): từ danh sách việc → danh sách thông báo cần đặt trên máy.

import { fmtDue } from './dates';
import type { Task } from './types';

/** iOS chỉ giữ tối đa 64 thông báo chờ; để dư một chút cho thông báo thử. */
export const MAX_SCHEDULED = 60;

export interface PlannedReminder {
  key: string; // duy nhất theo (task, mốc nhắc)
  taskId: number;
  date: Date;
  title: string;
  body: string;
}

function leadText(due: Date, at: Date): string {
  const mins = Math.round((due.getTime() - at.getTime()) / 60000);
  if (mins < 60) return `còn ${mins} phút`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `còn ${hours} giờ`;
  return `còn ${Math.round(hours / 24)} ngày`;
}

/** Chọn các mốc nhắc trong tương lai của việc đang mở, sớm nhất trước, tối đa `max`. */
export function planReminders(tasks: Task[], now: Date, max = MAX_SCHEDULED): PlannedReminder[] {
  const out: PlannedReminder[] = [];
  for (const t of tasks) {
    if (t.status !== 'open' || !t.due_at) continue;
    const due = new Date(t.due_at);
    const marks = [...t.reminders, t.due_at]; // nhắc thêm đúng giờ hạn
    for (const r of marks) {
      const at = new Date(r);
      if (Number.isNaN(at.getTime()) || at.getTime() <= now.getTime()) continue;
      const atDue = at.getTime() === due.getTime();
      out.push({
        key: `${t.id}@${at.toISOString()}`,
        taskId: t.id,
        date: at,
        title: `${atDue ? '⏰ Đến hạn' : '🔔 Sắp đến hạn'}: ${t.title}`,
        body: [atDue ? fmtDue(t.due_at) : `${leadText(due, at)} · ${fmtDue(t.due_at)}`, t.location]
          .filter(Boolean)
          .join(' · '),
      });
    }
  }
  out.sort((a, b) => a.date.getTime() - b.date.getTime());
  const seen = new Set<string>();
  return out.filter((r) => !seen.has(r.key) && seen.add(r.key)).slice(0, max);
}

/** Chữ ký để biết kế hoạch nhắc có đổi không (tránh huỷ/đặt lại liên tục). */
export function signature(plan: PlannedReminder[]): string {
  return plan.map((r) => `${r.key}|${r.title}`).join('\n');
}
