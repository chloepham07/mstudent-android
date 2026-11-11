// Đăng nhập / đăng ký. Bước 1: kết nối server (chạy trên máy tính trong cùng mạng). Bước 2: tài khoản.

import { useCallback, useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Muted } from '@/components/ui';
import { usePalette } from '@/constants/theme';
import { api } from '@/lib/api';
import { googleAvailable } from '@/lib/google';
import { useStore } from '@/lib/store';
import type { Health, PublicConfig } from '@/lib/types';
import { normalizeUrl } from '@/lib/url';

export default function LoginScreen() {
  const c = usePalette();
  const { settings, updateSettings, signIn, signUp, signInWithGoogle } = useStore();
  const [url, setUrl] = useState(settings.baseUrl);
  const [server, setServer] = useState<{ health: Health; cfg: PublicConfig } | null>(null);
  const [serverErr, setServerErr] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [register, setRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [probe, setProbe] = useState(0); // tăng lên để kiểm tra lại cùng một địa chỉ

  // Bấm "Kết nối": lưu địa chỉ; effect bên dưới sẽ gọi thử server.
  const check = useCallback(
    async (value: string) => {
      const normalized = normalizeUrl(value);
      if (!normalized) return;
      setChecking(true);
      setServerErr(null);
      await updateSettings({ baseUrl: normalized });
      setProbe((n) => n + 1);
    },
    [updateSettings],
  );

  // Gọi thử server mỗi khi địa chỉ đổi (kể cả địa chỉ đã lưu từ lần mở app trước).
  useEffect(() => {
    if (!settings.baseUrl) return;
    let alive = true;
    Promise.all([api.health(), api.publicConfig()])
      .then(([health, cfg]) => {
        if (!alive) return;
        setServer({ health, cfg });
        setServerErr(null);
      })
      .catch((e: Error) => {
        if (!alive) return;
        setServer(null);
        setServerErr(e.message);
      })
      .finally(() => alive && setChecking(false));
    return () => {
      alive = false;
    };
  }, [settings.baseUrl, probe]);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      if (register) await signUp(email.trim(), password, name.trim());
      else await signIn(email.trim(), password);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    if (!server) return;
    setErr(null);
    setBusy(true);
    try {
      await signInWithGoogle(server.cfg.google);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const input = [styles.input, { color: c.text, borderColor: c.line, backgroundColor: c.bg }];
  const canSubmit = !!server && email.includes('@') && password.length >= 8;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: 'center', gap: 4, marginBottom: 8 }}>
            <Text style={{ fontSize: 44 }}>📥</Text>
            <Text style={{ color: c.text, fontSize: 26, fontWeight: '700' }}>MStudent</Text>
            <Muted style={{ textAlign: 'center' }}>AI đọc thông báo từ email, LMS, Zalo và nhắc bạn đúng hạn</Muted>
          </View>

          <Card>
            <Text style={[styles.step, { color: c.muted }]}>1 · MÁY CHỦ</Text>
            <TextInput
              value={url}
              onChangeText={setUrl}
              onSubmitEditing={() => check(url)}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              placeholder="vd: 192.168.1.5:8000"
              placeholderTextColor={c.muted}
              style={input}
              accessibilityLabel="Địa chỉ server"
            />
            <View style={{ marginTop: 8 }}>
              <Button variant="ghost" label={server ? 'Kiểm tra lại' : 'Kết nối'} busy={checking} disabled={!url.trim()} onPress={() => check(url)} />
            </View>
            {server && (
              <Text style={{ color: server.health.mode === 'llm' ? c.ok : c.medium, marginTop: 8 }}>
                {server.health.mode === 'llm'
                  ? `✓ Đã kết nối · AI trực tiếp (${server.health.model})`
                  : '✓ Đã kết nối · ⚠️ server đang chạy bằng luật, chưa bật AI'}
              </Text>
            )}
            {serverErr && <Text style={{ color: c.bad, marginTop: 8 }}>✗ {serverErr}</Text>}
            {!server && (
              <Muted style={{ marginTop: 8 }}>
                Chạy `python run_local.py` trên máy tính rồi nhập địa chỉ nó in ra. Điện thoại và máy tính cùng Wi-Fi/hotspot.
              </Muted>
            )}
          </Card>

          <Card style={{ opacity: server ? 1 : 0.5 }}>
            <Text style={[styles.step, { color: c.muted }]}>2 · {register ? 'TẠO TÀI KHOẢN' : 'ĐĂNG NHẬP'}</Text>
            {register && (
              <TextInput value={name} onChangeText={setName} placeholder="Tên của bạn" placeholderTextColor={c.muted} style={[input, styles.gap]} maxLength={100} editable={!!server} />
            )}
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={c.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              textContentType="username"
              style={[input, styles.gap]}
              editable={!!server}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Mật khẩu (ít nhất 8 ký tự)"
              placeholderTextColor={c.muted}
              secureTextEntry
              autoComplete={register ? 'new-password' : 'current-password'}
              textContentType={register ? 'newPassword' : 'password'}
              style={[input, styles.gap]}
              maxLength={128}
              editable={!!server}
              onSubmitEditing={() => canSubmit && submit()}
            />
            {err && <Text style={{ color: c.bad, marginBottom: 8 }}>⚠️ {err}</Text>}
            <Button label={register ? 'Đăng ký' : 'Đăng nhập'} busy={busy} disabled={!canSubmit} onPress={submit} />
            {server?.cfg.google.enabled && googleAvailable && (
              <View style={{ marginTop: 8 }}>
                <Button variant="ghost" label="Tiếp tục với Google" disabled={busy} onPress={google} />
              </View>
            )}
            {(!register || server?.cfg.registration_open !== false) && (
              <Pressable onPress={() => { setRegister((r) => !r); setErr(null); }} style={{ marginTop: 12, alignItems: 'center' }} accessibilityRole="button">
                <Text style={{ color: c.accent }}>{register ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}</Text>
              </Pressable>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 12, flexGrow: 1, justifyContent: 'center', maxWidth: 480, width: '100%', alignSelf: 'center' },
  step: { fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16 },
  gap: { marginBottom: 8 },
});
