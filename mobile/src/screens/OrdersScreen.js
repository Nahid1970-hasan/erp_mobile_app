import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, ui } from '../utils/theme';
import { count, prettyDate } from '../utils/format';
import { ErpApi, unwrap } from '../services/api';
import { useScreenData } from '../hooks/useScreenData';
import ScreenHeader from '../components/ScreenHeader';
import { Card, StatusPill } from '../components/ui';

export default function OrdersScreen({ navigation }) {
  const { data, loading, error, refreshing, reload } = useScreenData(() => ErpApi.orders());
  const rows = unwrap(data);

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title="Orders" subtitle="Ex-factory and shipment risk" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.ink} />}
      >
        {loading && !data ? <ActivityIndicator color={colors.ink} /> : null}
        {error ? <Text style={ui.error}>{error}</Text> : null}
        {rows.map((order) => {
          const ratio = order.qty ? Math.min(order.shipped_qty / order.qty, 1) : 0;
          return (
            <Card key={order.id} style={order.status === 'at_risk' ? styles.risk : null}>
              <View style={styles.head}>
                <View style={styles.flex}>
                  <Text style={styles.po}>{order.po_number}</Text>
                  <Text style={styles.style}>{order.style_no} · {order.style_name}</Text>
                </View>
                <StatusPill status={order.status} />
              </View>
              <Text style={ui.muted}>{order.buyer_name} → {order.destination}</Text>
              <Text style={styles.meta}>Ex-factory {prettyDate(order.ex_factory)} · {count(order.shipped_qty)} / {count(order.qty)} shipped</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
              </View>
            </Card>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10, paddingBottom: 28 },
  head: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  flex: { flex: 1 },
  po: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  style: { color: colors.text, marginTop: 2 },
  meta: { color: colors.ink, marginTop: 8, fontWeight: '600' },
  track: { height: 6, borderRadius: 99, backgroundColor: '#EFE8DC', marginTop: 8, overflow: 'hidden' },
  fill: { height: 6, backgroundColor: colors.ink },
  risk: { borderColor: '#E7C2BE' },
});
