import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { colors, ui } from '../utils/theme';
import { count, prettyDate } from '../utils/format';
import { ErpApi, errorDetail, unwrap } from '../services/api';
import { useScreenData } from '../hooks/useScreenData';
import ScreenHeader from '../components/ScreenHeader';
import { Chip, StatusPill } from '../components/ui';

const NEXT = ['booking', 'in_transit', 'customs', 'delivered'];

export default function ShipmentsScreen({ navigation }) {
  const role = useSelector((state) => state.auth.user?.role);
  const canUpdate = role === 'manager' || role === 'supervisor' || role === 'store';
  const { data, loading, error, refreshing, reload } = useScreenData(() => ErpApi.shipments());
  const [busyId, setBusyId] = useState(null);
  const [localError, setLocalError] = useState('');

  async function update(id, status) {
    setBusyId(id);
    setLocalError('');
    try {
      await ErpApi.updateShipment(id, status);
      await reload();
    } catch (err) {
      setLocalError(errorDetail(err, 'Could not update the shipment.'));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title="Shipments" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.ink} />}
      >
        {loading && !data ? <ActivityIndicator color={colors.ink} /> : null}
        {error || localError ? <Text style={ui.error}>{localError || error}</Text> : null}
        {unwrap(data).map((row) => (
          <View key={row.id} style={styles.card}>
            <View style={styles.head}>
              <View style={styles.flex}>
                <Text style={styles.title}>{row.reference}</Text>
                <Text style={ui.muted}>{row.po_number} · {row.style_name}</Text>
              </View>
              <StatusPill status={row.status} />
            </View>
            <Text style={styles.meta}>{row.destination} · {count(row.cartons)} cartons</Text>
            <Text style={ui.muted}>ETD {prettyDate(row.etd)} · ETA {prettyDate(row.eta)}</Text>
            {row.note ? <Text style={styles.note}>{row.note}</Text> : null}
            {canUpdate ? (
              <View style={styles.chips}>
                {NEXT.map((status) => (
                  <Chip key={status} text={status === row.status ? 'Current' : status.replace('_', ' ')} active={status === row.status} onPress={() => update(row.id, status)} />
                ))}
              </View>
            ) : null}
            {busyId === row.id ? <ActivityIndicator color={colors.ink} /> : null}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10, paddingBottom: 28 },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 6 },
  head: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  title: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  meta: { fontWeight: '700', color: colors.ink },
  note: { color: colors.text, lineHeight: 20 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
});
