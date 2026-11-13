import type { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { usePalette } from '@/constants/theme';
import { fmtDue, relativeDay } from '@/lib/dates';
import { taskSourcesLabel } from '@/lib/sources';
import { CATEGORY_LABEL, type Task } from '@/lib/types';

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const c = usePalette();
  return <View style={[s.card, { backgroundColor: c.panel, borderColor: c.line }, style]}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  const c = usePalette();
  return <Text style={[s.title, { color: c.text }]}>{children}</Text>;
}

export function Muted({ children, style }: { children: ReactNode; style?: StyleProp<any> }) {
  const c = usePalette();
  return <Text style={[s.muted, { color: c.muted }, style]}>{children}</Text>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled,
  busy,
  small,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
  busy?: boolean;
  small?: boolean;
}) {
  const c = usePalette();
  const primary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || busy}
      style={({ pressed }) => [
        s.btn,
        small && s.btnSmall,
        primary ? { backgroundColor: c.accent } : { borderColor: c.line, borderWidth: 1 },
        (pressed || disabled) && { opacity: 0.6 },
      ]}>
      {busy ? (
        <ActivityIndicator color={primary ? c.onAccent : c.accent} />
      ) : (
        <Text style={[s.btnText, small && { fontSize: 13 }, { color: primary ? c.onAccent : c.accent }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Chip({ label, onPress, active }: { label: string; onPress?: () => void; active?: boolean }) {
  const c = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={[s.chip, { backgroundColor: active ? c.accent : c.accentSoft }]}
      accessibilityRole={onPress ? 'button' : 'text'}>
      <Text style={{ color: active ? c.onAccent : c.accent, fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Tag({ label }: { label: string }) {
  const c = usePalette();
  return (
    <View style={[s.tag, { borderColor: c.line }]}>
      <Text style={{ color: c.muted, fontSize: 12 }}>{label}</Text>
    </View>
  );
}

export function Dot({ priority }: { priority: Task['priority'] }) {
  const c = usePalette();
  return <View style={[s.dot, { backgroundColor: c[priority] }]} />;
}

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = usePalette();
  return (
    <View style={[s.error, { backgroundColor: c.accentSoft }]}>
      <Text style={{ color: c.bad, flex: 1 }}>⚠️ {message}</Text>
      {onRetry && <Button small variant="ghost" label="Thử lại" onPress={onRetry} />}
    </View>
  );
}

export function TaskRow({
  task,
  now,
  onDone,
  onLongPress,
}: {
  task: Task;
  now: Date;
  onDone?: () => void;
  onLongPress?: () => void;
}) {
  const c = usePalette();
  return (
    <Pressable onLongPress={onLongPress} style={[s.row, { borderColor: c.line }]}>
      <Dot priority={task.priority} />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: c.text, fontSize: 15 }} numberOfLines={2}>
          {task.title}
        </Text>
        <View style={s.metaRow}>
          <Tag label={CATEGORY_LABEL[task.category]} />
          <Text style={{ color: c.muted, fontSize: 13 }}>
            {fmtDue(task.due_at)}
            {task.due_at ? ` · ${relativeDay(task.due_at, now)}` : ''}
            {task.location ? ` · ${task.location}` : ''}
            {task.updated_from.length ? ' · đã cập nhật' : ''}
          </Text>
          <Text style={{ color: c.muted, fontSize: 12 }}>{taskSourcesLabel(task.sources ?? [], task.source)}</Text>
        </View>
        {task.note ? <Text style={{ color: c.muted, fontSize: 12, fontStyle: 'italic' }}>{task.note}</Text> : null}
      </View>
      {onDone && (
        <Pressable
          onPress={onDone}
          hitSlop={10}
          accessibilityLabel={`Đánh dấu xong: ${task.title}`}
          style={[s.check, { borderColor: c.accent }]}>
          <Text style={{ color: c.accent, fontSize: 16 }}>✓</Text>
        </Pressable>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: 14, padding: 14 },
  title: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
  muted: { fontSize: 13 },
  btn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  btnSmall: { paddingVertical: 5, paddingHorizontal: 10 },
  btnText: { fontSize: 15, fontWeight: '600' },
  chip: { borderRadius: 99, paddingVertical: 6, paddingHorizontal: 12 },
  tag: { borderWidth: 1, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6 },
  error: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 10, marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 11, borderTopWidth: StyleSheet.hairlineWidth, alignItems: 'flex-start' },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  check: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
