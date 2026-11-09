import { DarkTheme, DefaultTheme, router, Stack, ThemeProvider } from 'expo-router';
import { ShareIntentModule, ShareIntentProvider, useShareIntentContext } from 'expo-share-intent';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { PALETTES } from '@/constants/theme';
import { configureNotifications } from '@/lib/notifications';
import { StoreProvider } from '@/lib/store';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = { anchor: '(tabs)' };

configureNotifications();

// Native module chỉ có trong development build; Expo Go và web → tắt nhận chia sẻ thay vì crash.
const SHARE_ENABLED = !!ShareIntentModule;

export default function RootLayout() {
  return (
    <ShareIntentProvider options={{ disabled: !SHARE_ENABLED, resetOnBackground: true }}>
      <StoreProvider>
        <RootNav />
      </StoreProvider>
    </ShareIntentProvider>
  );
}

/** Có nội dung được chia sẻ từ Zalo/app khác → mở màn hình xử lý. */
function ShareRedirect() {
  const { hasShareIntent } = useShareIntentContext();
  useEffect(() => {
    if (hasShareIntent) router.push('/share');
  }, [hasShareIntent]);
  return null;
}

function RootNav() {
  const scheme = useColorScheme();
  const c = PALETTES[scheme];
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: { ...base.colors, primary: c.accent, background: c.bg, card: c.panel, text: c.text, border: c.line },
  };
  return (
    <ThemeProvider value={theme}>
      {SHARE_ENABLED && <ShareRedirect />}
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="share" options={{ presentation: 'modal', title: 'Thêm thông báo' }} />
      </Stack>
    </ThemeProvider>
  );
}
