import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { ShareIntentModule, ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import { Baloo2_800ExtraBold } from '@expo-google-fonts/baloo-2';
import { Lexend_400Regular, Lexend_500Medium, Lexend_600SemiBold, Lexend_700Bold, useFonts } from '@expo-google-fonts/lexend';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { FONT, PALETTES } from '@/constants/theme';
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
  // Font của UI Kit: Lexend (mọi chữ) + Baloo 2 ExtraBold (tiêu đề IN HOA). Lỗi tải font → vẫn chạy bằng font hệ thống.
  const [fontsLoaded, fontError] = useFonts({
    Lexend_400Regular,
    Lexend_500Medium,
    Lexend_600SemiBold,
    Lexend_700Bold,
    Baloo2_800ExtraBold,
  });
  const ready = status !== 'loading' && (fontsLoaded || !!fontError);
  const c = PALETTES[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, primary: c.accent, background: c.bg, card: c.bg, text: c.text, border: c.bg },
  };

  // Giữ splash cho tới khi biết đã đăng nhập hay chưa → không nháy màn hình đăng nhập khi mở lại app.
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Bấm thông báo "việc mới" (đẩy từ máy chủ hoặc làm mới nền) → mở tab Việc (FR-077).
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((r) => {
      if ((r.notification.request.content.data as { type?: string } | undefined)?.type === 'tasks') router.navigate('/tasks');
    });
    return () => sub.remove();
  }, []);
  if (!ready) return null;

  const signedIn = status === 'signedIn';
  return (
    <ThemeProvider value={theme}>
      {SHARE_ENABLED && <ShareRedirect />}
      <Stack>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="share" options={{ presentation: 'modal', headerShown: false }} />
          <Stack.Screen
            name="sources"
            options={{
              title: 'Nguồn tự động',
              headerShadowVisible: false,
              headerTitleStyle: { fontFamily: FONT.semibold, fontSize: 17 },
              headerBackTitle: 'Cài đặt',
            }}
          />
        </Stack.Protected>
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="login" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
    </ThemeProvider>
  );
}
