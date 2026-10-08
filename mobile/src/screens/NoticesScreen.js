import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, ui } from '../utils/theme';
import { prettyDate } from '../utils/format';
import { ErpApi } from '../services/api';
import { useScreenData } from '../hooks/useScreenData';
import ScreenHeader from '../components/ScreenHeader';

export default function NoticesScreen({ navigation }) {
  const { data, loading, error, refreshing, reload } = useScreenData(() => ErpApi.notices());

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title="Notices" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.ink} />}
      >
        {loading && !data ? <ActivityIndicator color={colors.ink} /> : null}
        {error ? <Text style={ui.error}>{error}</Text> : null}
        {(data || []).map((notice) => (
          <View key={notice.id} style={styles.card}>
            <Text style={styles.date}>{prettyDate(notice.published_at)}</Text>
            <Text style={styles.title}>{notice.title}</Text>
            <Text style={styles.bodyText}>{notice.body}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10, paddingBottom: 28 },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 6 },
  date: { color: colors.brassDark, fontWeight: '800', fontSize: 12 },
  title: { fontWeight: '800', color: colors.ink, fontSize: 18 },
  bodyText: { color: colors.text, lineHeight: 22 },
});
