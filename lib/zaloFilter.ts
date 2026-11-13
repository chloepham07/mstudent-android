// Logic thuần cho đọc thông báo Zalo trên Android (002 US5): quyết định thông báo nào được gửi lên máy chủ.
// Mặc định KHÔNG gửi: chỉ gói Zalo, chỉ nhóm người dùng đã chọn; mọi thông báo khác không rời khỏi máy (FR-050).

export const ZALO_PACKAGE = 'com.zing.zalo';
export const MAX_CHARS = 8000;
const DEDUP_MS = 10 * 60 * 1000;

export interface ZaloNotification {
  packageName: string;
  title: string; // tên nhóm (với tin nhóm) hoặc tên người gửi
  text: string;
  postedAt: number; // ms
}

const norm = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ').toLowerCase();

export class ZaloFilter {
  private groups: Set<string>;
  private recent = new Map<string, number>();

  constructor(selectedGroups: string[]) {
    this.groups = new Set(selectedGroups.map(norm).filter(Boolean));
  }

  /** Trả nội dung cần gửi (đã cắt độ dài) hoặc null nếu không được gửi. */
  accept(n: ZaloNotification): { group: string; body: string } | null {
    if (n.packageName !== ZALO_PACKAGE) return null;
    const group = norm(n.title);
    if (!group || !this.groups.has(group)) return null;
    const body = n.text.trim().slice(0, MAX_CHARS);
    if (!body) return null;
    const key = `${group}\u001f${body}`;
    for (const [k, at] of this.recent) if (n.postedAt - at > DEDUP_MS) this.recent.delete(k);
    const last = this.recent.get(key);
    if (last !== undefined && n.postedAt - last <= DEDUP_MS) return null; // Zalo hay hiện lại cùng thông báo
    this.recent.set(key, n.postedAt);
    return { group: n.title.trim(), body };
  }
}
