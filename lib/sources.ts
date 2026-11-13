// Logic thuần cho màn hình Nguồn tự động (002): nhãn, trạng thái, thời gian tương đối giờ VN.

import type { SourceConnection, SourceKind } from './types';

export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  gmail: 'Gmail',
  classroom: 'Google Classroom',
  ics: 'Lịch LMS',
  sheet: 'Bảng lớp',
};

/** Nhãn ngắn hiện trên từng việc (FR-073). Nguồn lạ → giữ nguyên. */
export const TASK_SOURCE_LABEL: Record<string, string> = {
  email: 'Email',
  lms: 'LMS',
  zalo: 'Zalo',
  manual: 'Tự thêm',
  classroom: 'Classroom',
  sheet: 'Bảng lớp',
};

export function taskSourcesLabel(sources: string[], fallback: string): string {
  const list = sources.length ? sources : [fallback];
  return [...new Set(list)].map((s) => TASK_SOURCE_LABEL[s] ?? s).join(' + ');
}

const TZ = 'Asia/Ho_Chi_Minh';
const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ });
const hhmm = (d: Date) =>
  d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: TZ });

/** "vừa xong", "5 phút trước", "2 giờ trước", "hôm qua 21:30", "13/11 21:30" — theo giờ Việt Nam (FR-079). */
export function relativeTime(iso: string | null | undefined, now: Date): string {
  if (!iso) return 'chưa có';
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return 'chưa có';
  const sec = Math.round((now.getTime() - t.getTime()) / 1000);
  if (sec < 60) return 'vừa xong';
  if (sec < 3600) return `${Math.floor(sec / 60)} phút trước`;
  const yesterday = new Date(now.getTime() - 86400000);
  if (dayKey(t) === dayKey(now)) return `${Math.floor(sec / 3600)} giờ trước`;
  if (dayKey(t) === dayKey(yesterday)) return `hôm qua ${hhmm(t)}`;
  const [, m, d] = dayKey(t).split('-');
  return `${d}/${m} ${hhmm(t)}`;
}

export type SourceStatus = 'ok' | 'error' | 'off' | 'pending';

export function statusOf(s: Pick<SourceConnection, 'enabled' | 'last_error' | 'last_ok_at'>): SourceStatus {
  if (!s.enabled) return s.last_error ? 'error' : 'off';
  if (s.last_error) return 'error';
  return s.last_ok_at ? 'ok' : 'pending';
}

/** Một dòng tóm tắt dưới tên nguồn. */
export function statusText(s: SourceConnection, now: Date): string {
  switch (statusOf(s)) {
    case 'off':
      return 'Đang tắt';
    case 'error':
      return s.last_error ?? 'Lỗi';
    case 'pending':
      return 'Đang đồng bộ lần đầu…';
    default: {
      const last = s.last;
      const extra = last && (last.created || last.updated) ? ` · +${last.created} việc, ${last.updated} cập nhật` : '';
      return `Đồng bộ ${relativeTime(s.last_ok_at, now)}${extra}`;
    }
  }
}
