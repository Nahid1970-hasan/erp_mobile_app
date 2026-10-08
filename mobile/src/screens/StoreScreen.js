import React, { useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { colors, ui } from '../utils/theme';
import { count, prettyDate } from '../utils/format';
import { ErpApi, errorDetail } from '../services/api';
import { useScreenData } from '../hooks/useScreenData';
import ScreenHeader from '../components/ScreenHeader';
import { Chip, Field, PrimaryButton } from '../components/ui';

export default function StoreScreen({ navigation }) {
  const role = useSelector((state) => state.auth.user?.role);
  const canWrite = role === 'manager' || role === 'store';
  const { data, loading, error, refreshing, reload } = useScreenData(async () => {
    const [items, movements] = await Promise.all([ErpApi.items(), ErpApi.movements()]);
    return { data: { items: items.data, movements: movements.data } };
  });
  const [sku, setSku] = useState('');
  const [kind, setKind] = useState('receive');
  const [qty, setQty] = useState('');
  const [reference, setReference] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);

  const match = (data?.items || []).find((item) => item.sku.toLowerCase() === sku.trim().toLowerCase());

  async function save() {
    setBusy(true);
    setFormError('');
    try {
      await ErpApi.createMovement({ sku: sku.trim(), kind, qty: Number(qty), reference: reference.trim() });
      setQty('');
      setReference('');
      await reload();
    } catch (err) {
      setFormError(errorDetail(err, 'Could not post the movement.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title="Store" subtitle="Type a SKU or barcode" onBack={() => navigation.goBack()} />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.ink} />}
      >
        {loading && !data ? <ActivityIndicator color={colors.ink} /> : null}
        {error ? <Text style={ui.error}>{error}</Text> : null}
        {canWrite ? (
          <>
            <Field label="SKU or barcode" value={sku} onChangeText={setSku} autoCapitalize="characters" placeholder="YARN-40S" />
            {match ? <Text style={styles.match}>{match.name} · {count(match.qty_on_hand)} {match.uom} on hand · {match.location}</Text> : null}
            <View style={styles.chips}>
              <Chip text="Receive" active={kind === 'receive'} onPress={() => setKind('receive')} />
              <Chip text="Issue" active={kind === 'issue'} onPress={() => setKind('issue')} />
            </View>
            <Field label="Quantity" value={qty} onChangeText={setQty} keyboardType="number-pad" />
            <Field label="Reference" value={reference} onChangeText={setReference} placeholder="PO or challan" />
            {formError ? <Text style={ui.error}>{formError}</Text> : null}
            <PrimaryButton label={busy ? 'Posting...' : 'Post movement'} onPress={save} disabled={busy} />
          </>
        ) : null}
        <Text style={styles.label}>On hand</Text>
        {(data?.items || []).map((item) => (
          <View key={item.id} style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.title}>{item.name}</Text>
              <Text style={ui.muted}>{item.sku} · {item.location}</Text>
            </View>
            <View style={styles.end}>
              <Text style={styles.qty}>{count(item.qty_on_hand)} {item.uom}</Text>
              {item.low ? <Text style={styles.low}>Reorder</Text> : null}
            </View>
          </View>
        ))}
        <Text style={styles.label}>Recent movements</Text>
        {(data?.movements || []).map((row) => (
          <View key={row.id} style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.title}>{row.sku} · {row.reference}</Text>
              <Text style={ui.muted}>{row.moved_by_name} · {prettyDate(row.created_at)}</Text>
            </View>
            <Text style={styles.qty}>{row.kind === 'issue' ? '−' : '+'}{count(row.qty)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10, paddingBottom: 32 },
  match: { color: colors.good, fontWeight: '700' },
  chips: { flexDirection: 'row', gap: 8 },
  label: { fontWeight: '800', color: colors.ink, marginTop: 6 },
  row: { flexDirection: 'row', gap: 10, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 12 },
  flex: { flex: 1 },
  title: { fontWeight: '800', color: colors.ink },
  end: { alignItems: 'flex-end', gap: 4 },
  qty: { fontWeight: '800', color: colors.ink },
  low: { color: colors.bad, fontWeight: '800', fontSize: 12 },
});
