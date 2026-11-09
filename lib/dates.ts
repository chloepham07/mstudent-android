// Xử lý ngày giờ theo giờ Việt Nam (UTC+7) mà không phụ thuộc múi giờ của máy hay Intl.

const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAY_SHORT = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

const pad = (n: number) => String(n).padStart(2, '0');

/** Date "giả" mà các hàm getUTC* trả về giờ Việt Nam. */
function vn(d: Date | string | number): Date {
  return new Date(new Date(d).getTime() + VN_OFFSET_MS);
}

/** "YYYY-MM-DD" theo giờ Việt Nam. */
export function dayKey(d: Date | string | number): string {
  const x = vn(d);
  return `${x.getUTCFullYear()}-${pad(x.getUTCMonth() + 1)}-${pad(x.getUTCDate())}`;
}

/** Nửa đêm (00:00 giờ VN) của ngày chứa d, dạng Date thật. */
export function startOfDay(d: Date | string | number): Date {
  const x = vn(d);
  return new Date(Date.UTC(x.getUTCFullYear(), x.getUTCMonth(), x.getUTCDate()) - VN_OFFSET_MS);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * DAY_MS);
}

/** Số ngày lịch giữa hai thời điểm (theo giờ VN). */
export function dayDiff(from: Date | string, to: Date | string): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / DAY_MS);
}

export function fmtTime(d: Date | string): string {
  const x = vn(d);
  return `${pad(x.getUTCHours())}:${pad(x.getUTCMinutes())}`;
}

export function fmtDayShort(d: Date | string): string {
  const x = vn(d);
  return `${WEEKDAY_SHORT[x.getUTCDay()]} ${pad(x.getUTCDate())}/${pad(x.getUTCMonth() + 1)}`;
}

export function fmtDayLong(d: Date | string): string {
  const x = vn(d);
  return `${WEEKDAY_LONG[x.getUTCDay()]}, ${pad(x.getUTCDate())}/${pad(x.getUTCMonth() + 1)}`;
}

export function fmtDue(due: string | null): string {
  return due ? `${fmtTime(due)} ${fmtDayShort(due)}` : 'Không có hạn';
}

/** Mô tả tương đối: "hôm nay", "ngày mai", "còn 3 ngày", "quá hạn 2 ngày". */
export function relativeDay(due: string, now: Date): string {
  const n = dayDiff(now, due);
  if (new Date(due).getTime() < now.getTime()) return n === 0 ? 'quá hạn hôm nay' : `quá hạn ${-n} ngày`;
  if (n === 0) return 'hôm nay';
  if (n === 1) return 'ngày mai';
  return `còn ${n} ngày`;
}

/** Đổi ngày của một mốc ISO "+07:00" sang dayKey khác, giữ nguyên giờ. */
export function moveToDay(iso: string, newDayKey: string): string {
  const m = iso.match(/T.*$/);
  return newDayKey + (m ? m[0] : 'T23:59:00+07:00');
}

export type Bucket = 'Quá hạn' | 'Hôm nay' | 'Ngày mai' | 'Tuần này' | 'Sau đó' | 'Không có hạn';
export const BUCKET_ORDER: Bucket[] = ['Quá hạn', 'Hôm nay', 'Ngày mai', 'Tuần này', 'Sau đó', 'Không có hạn'];

export function bucketOf(due: string | null, now: Date): Bucket {
  if (!due) return 'Không có hạn';
  if (new Date(due).getTime() < now.getTime()) return 'Quá hạn';
  const n = dayDiff(now, due);
  if (n === 0) return 'Hôm nay';
  if (n === 1) return 'Ngày mai';
  if (n < 7) return 'Tuần này';
  return 'Sau đó';
}
