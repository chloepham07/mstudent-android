import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ColorValue } from 'react-native';

import { useClientOnlyValue } from '@/components/useClientOnlyValue';
import { usePalette } from '@/constants/theme';

type Icon = { ios: string; android: string; web: string };

function TabIcon({ name, color }: { name: Icon; color: ColorValue }) {
  // Tên icon: SF Symbols (iOS) và Material Symbols (Android/web).
  return <SymbolView name={name as any} tintColor={color} size={26} />;
}

export default function TabLayout() {
  const c = usePalette();
  const headerShown = useClientOnlyValue(false, true);
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: c.accent,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.panel, borderTopColor: c.line },
        headerStyle: { backgroundColor: c.panel },
        headerTintColor: c.text,
        headerShown,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Trợ lý',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} name={{ ios: 'bubble.left.and.bubble.right', android: 'chat', web: 'chat' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Việc',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} name={{ ios: 'checklist', android: 'checklist', web: 'checklist' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Lịch',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} name={{ ios: 'calendar', android: 'calendar_month', web: 'calendar_month' }} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Cài đặt',
          tabBarIcon: ({ color }) => (
            <TabIcon color={color} name={{ ios: 'gearshape', android: 'settings', web: 'settings' }} />
          ),
        }}
      />
    </Tabs>
  );
}
