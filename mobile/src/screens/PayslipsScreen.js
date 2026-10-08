import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, ui } from '../utils/theme';
import { money, prettyDate } from '../utils/format';
import { ErpApi } from '../services/api';
import { useScreenData } from '../hooks/useScreenData';
import ScreenHeader from '../components/ScreenHeader';

export default function PayslipsScreen({ navigation }) {
  const { data, loading, error, refreshing, reload } = useScreenData(() => ErpApi.payslips());

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title="Payslips" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.ink} />}
      >
        {loading && !data ? <ActivityIndicator color={colors.ink} /> : null}
        {error ? <Text style={ui.error}>{error}</Text> : null}
        {(data || []).map((slip) => (
          <View key={slip.id} style={styles.card}>
            <Text style={styles.period}>{prettyDate(slip.period).replace(/^\d{2}\s/, '')}</Text>
            <Text style={styles.net}>{money(slip.net)}</Text>
            <Text style={ui.muted}>Basic {money(slip.basic)} · Allowance {money(slip.allowance)}</Text>
            <Text style={ui.muted}>Deduction {money(slip.deduction)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10, paddingBottom: 28 },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 4 },
  period: { color: colors.muted, fontWeight: '800' },
  net: { fontSize: 28, fontWeight: '800', color: colors.ink },
});
