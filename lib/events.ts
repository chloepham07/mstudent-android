// Logic thuần cho lời mời sự kiện (003): sắp xếp, ẩn sự kiện đã qua, nhãn mức phù hợp, link an toàn, lời mời mới.

import type { Task } from './types';

export const FIT_LABEL = { high: 'Rất hợp ngành', medium: 'Có ích', low: 'Ít liên quan' } as const;
const FIT_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

/** Thời điểm sự kiện kết thúc (không có giờ kết thúc → giờ bắt đầu); null nếu chưa rõ giờ. */
function endOf(t: Task): number | null {
  const ms = new Date(t.event_end ?? t.due_at ?? '').getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** Lời mời còn hiệu lực, xếp theo mức phù hợp (hợp ngành trước) rồi theo thời gian; chưa rõ giờ xếp cuối nhóm. */
export function sortInvites(invites: Task[], now: Date): Task[] {
  const time = (t: Task) => {
    const ms = new Date(t.due_at ?? '').getTime();
    return Number.isNaN(ms) ? Number.MAX_SAFE_INTEGER : ms;
  };
  return invites
    .filter((t) => {
      const end = endOf(t);
      return end === null || end >= now.getTime();
    })
    .sort((a, b) => (FIT_RANK[a.fit_level ?? ''] ?? 3) - (FIT_RANK[b.fit_level ?? ''] ?? 3) || time(a) - time(b) || a.id - b.id);
}

/** Chỉ mở link http(s) có host; mọi thứ khác (javascript:, intent:, file:…) → null. */
export function openableUrl(u: string | null | undefined): string | null {
  const s = (u ?? '').trim();
  return /^https?:\/\/[^\s/?#@\\]+(?:[/?#]\S*)?$/i.test(s) && s.length <= 2000 ? s : null;
}

/** Lời mời chưa từng thấy (để làm mới nền báo một lần). Lần đầu (chưa có danh sách đã thấy) → không báo. */
export function newInvites(seen: number[] | null, invites: Task[]): Task[] {
  if (!seen) return [];
  const known = new Set(seen);
  return invites.filter((t) => !known.has(t.id));
}

/** Nội dung thông báo lời mời (giống thông báo đẩy của máy chủ). */
export function inviteNotice(t: Task, when: string): { title: string; body: string } {
  const fit = t.fit_level ? FIT_LABEL[t.fit_level] : '';
  return { title: `Sự kiện mới: ${t.title}`.slice(0, 120), body: [fit, when || 'chưa rõ giờ', 'Tham gia không?'].filter(Boolean).join(' · ') };
}
