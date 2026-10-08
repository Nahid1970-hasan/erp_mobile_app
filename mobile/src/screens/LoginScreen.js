import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { colors, serif, ui } from '../utils/theme';
import { DEFAULT_API_URL } from '../services/config';
import { clearAuthError, login } from '../redux/authSlice';
import { Field, Mark, PrimaryButton } from '../components/ui';

const DEMOS = [
  ['rahim', 'Manager'],
  ['sadia', 'Merchandiser'],
  ['karim', 'Supervisor'],
  ['farhana', 'Store'],
  ['nusrat', 'Operator'],
];

export default function LoginScreen() {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [username, setUsername] = useState('rahim');
  const [password, setPassword] = useState('Dekko@123');
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [showServer, setShowServer] = useState(false);

  useEffect(() => {
    dispatch(clearAuthError());
    AsyncStorage.getItem('api_url').then((value) => {
      if (value) setApiUrl(value);
    });
  }, [dispatch]);

  async function onSubmit() {
    await AsyncStorage.setItem('api_url', apiUrl.trim().replace(/\/$/, ''));
    dispatch(login({ username: username.trim(), password }));
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.band}>
        <SafeAreaView edges={['top']}>
          <View style={styles.brandRow}>
            <Mark size={64} />
            <View>
              <Text style={styles.brand}>Isho</Text>
              <Text style={styles.brandSub}>Dekko Isho Group · Garments ERP</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <Text style={styles.lead}>Sign in for approvals, the sewing floor, store, and HR.</Text>
          <Field label="Employee ID" value={username} onChangeText={setUsername} autoCapitalize="none" autoCorrect={false} />
          <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry />
          <Pressable onPress={() => setShowServer((value) => !value)}>
            <Text style={styles.link}>{showServer ? 'Hide server' : 'API server'}</Text>
          </Pressable>
          {showServer ? (
            <>
              <Field label="API server" value={apiUrl} onChangeText={setApiUrl} autoCapitalize="none" autoCorrect={false} />
              <Text style={ui.muted}>
                The Android emulator uses http://10.0.2.2:8000. A phone on the same Wi-Fi uses your computer’s IP, for example http://192.168.0.10:8000.
              </Text>
            </>
          ) : null}
          {error ? <Text style={ui.error}>{error}</Text> : null}
          <PrimaryButton label={loading ? 'Signing in...' : 'Sign in'} onPress={onSubmit} disabled={loading || !username.trim() || !password} />
          <Text style={styles.demoTitle}>Demo floor</Text>
          <Text style={ui.muted}>Every demo password is Dekko@123.</Text>
          <View style={styles.chips}>
            {DEMOS.map(([id, role]) => (
              <Pressable key={id} style={styles.chip} onPress={() => { setUsername(id); setPassword('Dekko@123'); }}>
                <Text style={styles.chipId}>{id}</Text>
                <Text style={styles.chipRole}>{role}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.paper },
  flex: { flex: 1 },
  band: { backgroundColor: colors.ink, paddingHorizontal: 20, paddingBottom: 22 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingTop: 12 },
  brand: { fontFamily: serif, color: colors.brass, fontSize: 32 },
  brandSub: { color: '#E6D7B4', marginTop: 2 },
  body: { padding: 20, gap: 12, paddingBottom: 36 },
  lead: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  link: { color: colors.brassDark, fontWeight: '800' },
  demoTitle: { fontFamily: serif, fontSize: 22, color: colors.ink, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.line, paddingHorizontal: 12, paddingVertical: 8 },
  chipId: { fontWeight: '800', color: colors.ink },
  chipRole: { color: colors.muted, fontSize: 12 },
});
