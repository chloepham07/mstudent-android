import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { ShareIntentModule, ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { PALETTES } from '@/constants/theme';
import { configureNotifications } from '@/lib/notifications';
import { StoreProvider, useStore } from '@/lib/store';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { anchor: '(tabs)' };

SplashScreen.preventAutoHideAsync().catch(() => {});
configureNotifications();

// Native module chỉ có trong development/production build; Expo Go và web → tắt nhận chia sẻ thay vì crash.
const SHARE_ENABLED = !!ShareIntentModule;

export default function RootLayout() {
  return (
    <ShareIntentProvider options={{ disabled: !SHARE_ENABLED, resetOnBackground: false }}>
      <StoreProvider>
        <RootNav />
      </StoreProvider>
    </ShareIntentProvider>
  );
}

/** Có nội dung chia sẻ từ Zalo/app khác và đã đăng nhập → mở màn hình xử lý. */
function ShareRedirect() {
  const { hasShareIntent } = useShareIntentContext();
  const { status } = useStore();
  useEffect(() => {
    if (hasShareIntent && status === 'signedIn') router.push('/share');
  }, [hasShareIntent, status]);
  return null;
}

function RootNav() {
  const scheme = useColorScheme();
  const { status } = useStore();
  const c = PALETTES[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, primary: c.accent, background: c.bg, card: c.panel, text: c.text, border: c.line },
  };

  // Giữ splash cho tới khi biết đã đăng nhập hay chưa → không nháy màn hình đăng nhập khi mở lại app.
  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync().catch(() => {});
  }, [status]);
  if (status === 'loading') return null;

  const signedIn = status === 'signedIn';
  return (
    <ThemeProvider value={theme}>
      {SHARE_ENABLED && <ShareRedirect />}
      <Stack>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="share" options={{ presentation: 'modal', title: 'Thêm thông báo' }} />
          <Stack.Screen name="sources" options={{ title: 'Nguồn tự động' }} />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
