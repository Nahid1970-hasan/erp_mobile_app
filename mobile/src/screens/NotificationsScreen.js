import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, ui } from '../utils/theme';
import { prettyDate } from '../utils/format';
import { ErpApi, errorDetail, unwrap } from '../services/api';
import { useScreenData } from '../hooks/useScreenData';
import ScreenHeader from '../components/ScreenHeader';

export default function NotificationsScreen({ navigation }) {
  const { data, loading, error, refreshing, reload } = useScreenData(() => ErpApi.notifications());
  const [localError, setLocalError] = useState('');

  async function readOne(item) {
    if (item.is_read) return;
    try {
      await ErpApi.readNotification(item.id);
      await reload();
    } catch (err) {
      setLocalError(errorDetail(err, 'Could not update the alert.'));
    }
  }

  async function readAll() {
    try {
      await ErpApi.readAll();
      await reload();
    } catch (err) {
      setLocalError(errorDetail(err, 'Could not mark alerts as read.'));
    }
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader
        title="Alerts"
        onBack={() => navigation.goBack()}
        right={<Pressable onPress={readAll}><Text style={styles.mark}>Read</Text></Pressable>}
      />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.ink} />}
      >
        {loading && !data ? <ActivityIndicator color={colors.ink} /> : null}
        {error || localError ? <Text style={ui.error}>{localError || error}</Text> : null}
        {unwrap(data).map((item) => (
          <Pressable key={item.id} style={[styles.card, !item.is_read && styles.unread]} onPress={() => readOne(item)}>
            <View style={styles.head}>
              <Text style={styles.title}>{item.title}</Text>
              {!item.is_read ? <View style={styles.dot} /> : null}
            </View>
            <Text style={styles.copy}>{item.body}</Text>
            <Text style={ui.muted}>{prettyDate(item.created_at)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mark: { color: colors.brassDark, fontWeight: '800' },
  body: { padding: 16, gap: 10, paddingBottom: 28 },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 6 },
  unread: { borderColor: colors.brass },
  head: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  title: { fontWeight: '800', color: colors.ink, flex: 1 },
  copy: { color: colors.text, lineHeight: 20 },
  dot: { width: 8, height: 8, borderRadius: 8, backgroundColor: colors.brassDark, marginTop: 6 },
});
