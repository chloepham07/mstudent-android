/** Host chỉ truy cập được trong mạng nội bộ: localhost, 10.x, 172.16–31.x, 192.168.x, 169.254.x, *.local. */
export function isPrivateHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^\[|\]$/g, '');
  if (h === 'localhost' || h === '::1' || h.endsWith('.local')) return true;
  const m = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (!m) return false;
  const [a, b] = [Number(m[1]), Number(m[2])];
  return a === 127 || a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254);
}

function hostOf(rest: string): string {
  const authority = rest.split(/[/?#]/)[0];
  if (authority.startsWith('[')) return authority.slice(0, authority.indexOf(']') + 1);
  return authority.split(':')[0];
}

/**
 * Chuẩn hoá địa chỉ server; bỏ dấu / cuối.
 * - Địa chỉ mạng nội bộ: cho phép http (demo với backend chạy trên máy tính), mặc định http nếu thiếu scheme.
 * - Mọi địa chỉ khác: luôn là https — token không bao giờ đi qua HTTP thường trên Internet.
 */
export function normalizeUrl(input: string): string {
  const v = input.trim().replace(/\/+$/, '');
  if (!v) return '';
  const m = /^(https?):\/\/(.*)$/i.exec(v);
  const rest = m ? m[2] : v;
  if (isPrivateHost(hostOf(rest))) return m ? v : `http://${v}`;
  return `https://${rest}`;
}
