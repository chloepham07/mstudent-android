// Tab Việc (UI Kit, artboard "3 · Việc"): tiêu đề + nút Thêm, Bản tin sáng (bạc hà), nhóm theo thời hạn,
// thẻ việc màu theo ưu tiên xếp chồng nhau.

import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, SectionList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/Icon';
import { Meme } from '@/components/Mascot';
import { Display, ErrorBanner, Muted, T, TaskCard } from '@/components/ui';
import { BRAND, FONT, SCREEN_PAD, TAB_BAR_SPACE, usePalette } from '@/constants/theme';
import { api } from '@/lib/api';
import { BUCKET_ORDER, bucketOf } from '@/lib/dates';
import { useStore } from '@/lib/store';

export default function TasksScreen() {
  const c = usePalette();
  const insets = useSafeAreaInsets();
  const { tasks, now, loading, error, refresh, markDone, health } = useStore();
  const [digest, setDigest] = useState<string | null>(null);
  const [showDigest, setShowDigest] = useState(true);

  const loadDigest = useCallback(() => {
    api
      .digest()
      .then((d) => setDigest(d.text))
      .catch(() => setDigest(null));
  }, []);

  useEffect(() => {
    if (health) loadDigest();
  }, [health, tasks.length, loadDigest]);

  const sections = useMemo(() => {
    const groups = new Map<string, typeof tasks>();
    for (const t of tasks) {
      const b = bucketOf(t.due_at, now);
      groups.set(b, [...(groups.get(b) ?? []), t]);
    }
    return BUCKET_ORDER.filter((b) => groups.has(b)).map((b) => ({ title: b, data: groups.get(b)! }));
  }, [tasks, now]);

  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 12 }}>
      <View style={{ paddingHorizontal: SCREEN_PAD, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <T v="h1" accessibilityRole="header">
          Việc của bạn
        </T>
        <Pressable
          onPress={() => router.push('/share')}
          accessibilityRole="button"
          accessibilityLabel="Thêm thông báo"
          style={{ height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: c.active, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="plus" color={c.onActive} size={18} stroke={2.6} />
          <T style={{ fontFamily: FONT.semibold, fontSize: 14 }} color={c.onActive}>
            Thêm
          </T>
        </Pressable>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(t) => String(t.id)}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => {
              refresh();
              loadDigest();
            }}
          />
        }
        contentContainerStyle={{ paddingHorizontal: SCREEN_PAD, paddingBottom: TAB_BAR_SPACE + insets.bottom }}
        stickySectionHeadersEnabled={false}
        ListHeaderComponent={
          <View style={{ gap: 12, marginBottom: 4 }}>
            {error && <ErrorBanner message={error} onRetry={refresh} />}
            {digest && (
              <View style={{ borderRadius: 24, backgroundColor: BRAND.mint, paddingVertical: 14, paddingHorizontal: 16, gap: 6 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Display size={20} color={BRAND.mintInk}>
                    Bản tin sáng
                  </Display>
                  <Pressable onPress={() => setShowDigest((v) => !v)} hitSlop={12} accessibilityRole="button">
                    <T style={{ fontFamily: FONT.semibold, fontSize: 12 }} color={BRAND.mintInk}>
                      {showDigest ? 'Thu gọn' : 'Mở'}
                    </T>
                  </Pressable>
                </View>
                {showDigest && (
                  <T style={{ fontSize: 14, lineHeight: 20 }} color={BRAND.mintInkDeep}>
                    {digest}
                  </T>
                )}
              </View>
            )}
          </View>
        }
        renderSectionHeader={({ section }) => (
          <View style={{ marginTop: 14, marginBottom: 8 }}>
            <T v="label" color={section.title === 'Quá hạn' ? c.bad : c.muted}>
              {section.title.toUpperCase()} · {section.data.length}
            </T>
          </View>
        )}
        renderItem={({ item, index }) => (
          <TaskCard task={item} now={now} overlap={index > 0} onDone={() => markDone(item.id)} />
        )}
        ListEmptyComponent={
          !loading && !error ? (
            <View style={{ borderRadius: 28, backgroundColor: c.soft, padding: 24, alignItems: 'center', gap: 8, marginTop: 12 }}>
              <Meme size={110} wave />
              <T v="title">Chưa có việc nào</T>
              <Muted style={{ textAlign: 'center' }}>
                Chia sẻ một thông báo từ Zalo sang MStudent, bấm “Thêm”, hoặc kết nối nguồn tự động trong Cài đặt.
              </Muted>
            </View>
          ) : undefined
        }
      />
    </View>
  );
}
