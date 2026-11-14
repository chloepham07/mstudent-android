// Quy chuẩn giao diện MStudent UI Kit v1 (artifact "MStudent UI Kit": Quy chuẩn giao diện + Chế độ tối).
// Nguyên tắc: không viền xám, tách khối bằng màu nền; màu thẻ (hồng / vàng chanh / tím nhạt / bạc hà) GIỮ NGUYÊN ở
// chế độ tối, chữ trên thẻ luôn là mực #141414; ở chế độ tối "đen" (mục đang chọn, nút tối) đổi thành vàng chanh.

import { useColorScheme } from '@/components/useColorScheme';

/** Màu thẻ / nhân vật: như nhau ở sáng và tối. */
export const BRAND = {
  cobalt: '#1D3AA0', // nền màn chào, bong bóng của bạn, khung "3 việc hôm nay"
  lime: '#D6F07A', // nút chính, ưu tiên Vừa, Meme
  limeSoft: '#E9FAB5',
  pink: '#F4A3DE', // ưu tiên Gấp
  pinkDeep: '#D63FB9', // nhân vật Thi
  periwinkle: '#9AAEFC', // ưu tiên Thong thả
  mint: '#BDEFD9', // bản tin, AI trực tiếp
  mintInk: '#0E5A3E',
  mintInkDeep: '#0E3D2B',
  amber: '#FFE7A8', // nhãn Bộ luật (offline)
  amberInk: '#6B4A00',
  ink: '#141414', // chữ trên thẻ màu
  cloud: '#E4E6EF',
} as const;

const light = {
  bg: '#FFFFFF',
  surface: '#FFFFFF', // thanh tab, tấm dưới màn Đăng nhập / Dán thông báo
  panel: '#FFFFFF',
  soft: '#F3F4FA', // ô nhập, bong bóng trợ lý, chip
  text: '#141414',
  muted: '#4D5262', // 7.6:1 trên trắng
  line: '#E4E6EF',
  active: '#141414', // tab đang chọn, nút tối
  onActive: '#D6F07A',
  accent: '#1D3AA0', // liên kết, bong bóng của bạn
  accentSoft: '#E8ECFA',
  onAccent: '#FFFFFF',
  high: '#F4A3DE',
  medium: '#D6F07A',
  low: '#9AAEFC',
  ok: '#1A9E6A',
  bad: '#A61E8A', // quá hạn, xoá
  shadow: 'rgba(20,20,20,0.12)',
  limbs: '#141414', // tay chân Meme
};

const dark: typeof light = {
  bg: '#12131A',
  surface: '#1C1E29',
  panel: '#1C1E29',
  soft: '#262938',
  text: '#F3F4FA',
  muted: '#A3A8BD',
  line: '#33364A',
  active: '#D6F07A',
  onActive: '#141414',
  accent: '#9AAEFC',
  accentSoft: '#262938',
  onAccent: '#141414',
  high: '#F4A3DE',
  medium: '#D6F07A',
  low: '#9AAEFC',
  ok: '#6EE7A8',
  bad: '#F28BD3',
  shadow: 'rgba(0,0,0,0.5)',
  limbs: '#F3F4FA',
};

export type Palette = typeof light;

export function usePalette(): Palette {
  return useColorScheme() === 'dark' ? dark : light;
}

export const PALETTES = { light, dark };

/** Nền thẻ việc theo ưu tiên (giữ nguyên ở chế độ tối). */
export const PRIORITY_BG = { high: BRAND.pink, medium: BRAND.lime, low: BRAND.periwinkle } as const;
export const PRIORITY_LABEL = { high: 'Gấp', medium: 'Vừa', low: 'Thong thả' } as const;

/** Font: Lexend cho mọi chữ; Baloo 2 ExtraBold chỉ cho tiêu đề IN HOA. Tên khớp @expo-google-fonts. */
export const FONT = {
  regular: 'Lexend_400Regular',
  medium: 'Lexend_500Medium',
  semibold: 'Lexend_600SemiBold',
  bold: 'Lexend_700Bold',
  display: 'Baloo2_800ExtraBold',
} as const;

/** Thang chữ: display 40/42 · h1 26/32 · title 17/22 · body 15/22 · label 12 IN HOA giãn 1. */
export const TYPE = {
  display: { fontFamily: FONT.display, fontSize: 40, lineHeight: 42 },
  h1: { fontFamily: FONT.bold, fontSize: 26, lineHeight: 32 },
  title: { fontFamily: FONT.semibold, fontSize: 17, lineHeight: 22 },
  body: { fontFamily: FONT.regular, fontSize: 15, lineHeight: 22 },
  small: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: FONT.semibold, fontSize: 12, letterSpacing: 1 },
} as const;

/** Bo góc: thẻ 28 · ô 20 · nút 16 · viên 999. Khoảng cách bước 4; lề màn hình 20. */
export const RADIUS = { card: 28, tile: 20, button: 16, pill: 999 } as const;
export const SCREEN_PAD = 20;
/** Khoảng trống cuối màn để nội dung không bị thanh tab nổi (68 + lề 24) che. */
export const TAB_BAR_SPACE = 68 + 24 + 16;
