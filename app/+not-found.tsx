import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

import { usePalette } from '@/constants/theme';

export default function NotFoundScreen() {
  const c = usePalette();
  return (
    <>
      <Stack.Screen options={{ title: 'Không tìm thấy' }} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, backgroundColor: c.bg }}>
        <Text style={{ color: c.text, fontSize: 18, fontWeight: '600' }}>Trang này không tồn tại.</Text>
        <Link href="/" style={{ marginTop: 15, paddingVertical: 15 }}>
          <Text style={{ color: c.accent }}>Về màn hình chính</Text>
        </Link>
      </View>
    </>
  );
}
