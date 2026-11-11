// Google Sign-In gốc (native). Thư viện chỉ có trong development/production build —
// trong Expo Go hoặc bản web thì `available` = false và app dùng đăng nhập email/mật khẩu.

import type { PublicConfig } from './types';

const GMAIL_SCOPE = 'https://www.googleapis.com/auth/gmail.readonly';

type Lib = typeof import('@react-native-google-signin/google-signin');

let lib: Lib | null = null;
try {
  // require trong try/catch: module native thiếu sẽ ném lỗi ngay khi import.
  lib = require('@react-native-google-signin/google-signin') as Lib;
} catch {
  lib = null;
}

export const googleAvailable = lib !== null;

export interface GoogleResult {
  idToken: string;
  serverAuthCode: string | null;
  email: string;
}

async function run(cfg: PublicConfig['google'], withGmail: boolean): Promise<GoogleResult | null> {
  if (!lib) throw new Error('Bản app này chưa có Google Sign-In (cần development build)');
  if (!cfg.enabled) throw new Error('Server chưa cấu hình Google (GOOGLE_WEB_CLIENT_ID)');
  const { GoogleSignin } = lib;
  GoogleSignin.configure({
    webClientId: cfg.web_client_id, // server dùng client này để kiểm ID token và đổi mã uỷ quyền
    iosClientId: cfg.ios_client_id || undefined,
    scopes: withGmail ? [GMAIL_SCOPE] : [],
    offlineAccess: withGmail, // xin serverAuthCode để SERVER giữ refresh token, không phải app
    forceCodeForRefreshToken: withGmail,
  });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();
  if (res.type !== 'success') return null; // người dùng bấm huỷ
  const { idToken, serverAuthCode, user } = res.data;
  if (!idToken) throw new Error('Google không trả ID token — kiểm tra webClientId');
  return { idToken, serverAuthCode: serverAuthCode ?? null, email: user.email };
}

/** Đăng nhập: chỉ xin thông tin cơ bản (email, tên). */
export const googleSignIn = (cfg: PublicConfig['google']) => run(cfg, false);

/** Cấp quyền đọc Gmail: trả về serverAuthCode để gửi cho backend. */
export const googleGrantGmail = (cfg: PublicConfig['google']) => run(cfg, true);

export async function googleSignOut() {
  try {
    await lib?.GoogleSignin.signOut();
  } catch {
    // không sao: phiên của MStudent đã được xoá ở phía mình
  }
}
