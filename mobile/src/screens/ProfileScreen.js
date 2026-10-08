import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDispatch, useSelector } from 'react-redux';
import { colors, ui } from '../utils/theme';
import { label } from '../utils/format';
import { DEFAULT_API_URL } from '../services/config';
import { logout } from '../redux/authSlice';
import ScreenHeader from '../components/ScreenHeader';
import { Field, Mark, PrimaryButton, SecondaryButton } from '../components/ui';

export default function ProfileScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const [apiUrl, setApiUrl] = useState(DEFAULT_API_URL);
  const [saved, setSaved] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('api_url').then((value) => {
      if (value) setApiUrl(value);
    });
  }, []);

  async function saveServer() {
    await AsyncStorage.setItem('api_url', apiUrl.trim().replace(/\/$/, ''));
    setSaved('Server saved. The next request uses this address.');
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title="More" />
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.identity}>
          <Mark size={64} />
          <View style={styles.flex}>
            <Text style={styles.name}>{user?.full_name}</Text>
            <Text style={ui.muted}>{user?.designation}</Text>
            <Text style={styles.code}>{user?.employee_code} · {label(user?.role)}</Text>
          </View>
        </View>
        <View style={styles.card}>
          <Row label="Department" value={user?.department} />
          <Row label="Phone" value={user?.phone || '—'} />
          <Row label="Username" value={user?.username} />
        </View>
        <Pressable style={styles.link} onPress={() => navigation.navigate('Notifications')}>
          <Text style={styles.linkText}>Alerts</Text>
        </Pressable>
        <Pressable style={styles.link} onPress={() => navigation.navigate('Assistant')}>
          <Text style={styles.linkText}>Ask Isho</Text>
        </Pressable>
        <Field label="API server" value={apiUrl} onChangeText={setApiUrl} autoCapitalize="none" autoCorrect={false} />
        {saved ? <Text style={styles.saved}>{saved}</Text> : null}
        <SecondaryButton label="Save server" onPress={saveServer} />
        <PrimaryButton label="Sign out" tone="ink" onPress={() => dispatch(logout())} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({ label: caption, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{caption}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 12, paddingBottom: 32 },
  identity: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  flex: { flex: 1 },
  name: { fontSize: 24, fontWeight: '800', color: colors.ink },
  code: { color: colors.brassDark, fontWeight: '700', marginTop: 4 },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  rowLabel: { color: colors.muted },
  rowValue: { color: colors.ink, fontWeight: '700', flexShrink: 1, textAlign: 'right' },
  link: { backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 14 },
  linkText: { fontWeight: '800', color: colors.ink },
  saved: { color: colors.good, fontWeight: '700' },
});
