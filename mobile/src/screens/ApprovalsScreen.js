import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, ui } from '../utils/theme';
import { money, prettyDate } from '../utils/format';
import { ErpApi, errorDetail, unwrap } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import { Chip, StatusPill } from '../components/ui';

const KINDS = [
  ['', 'All'],
  ['requisition', 'Requisition'],
  ['leave', 'Leave'],
  ['work_order', 'Work order'],
  ['costing', 'Costing'],
];
const STATUSES = [
  ['pending', 'Pending'],
  ['approved', 'Approved'],
  ['rejected', 'Rejected'],
  ['', 'Any'],
];

export default function ApprovalsScreen({ navigation }) {
  const [kind, setKind] = useState('');
  const [status, setStatus] = useState('pending');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (refresh) => {
    setRefreshing(refresh);
    if (!refresh) setLoading(true);
    setError('');
    try {
      const params = {};
      if (kind) params.kind = kind;
      if (status) params.status = status;
      const response = await ErpApi.approvals(params);
      setRows(unwrap(response.data));
    } catch (err) {
      setError(errorDetail(err, 'Could not load approvals.'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [kind, status]);

  useFocusEffect(useCallback(() => { load(false); }, [load]));

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title="Approvals" subtitle="Requisitions, leave, work orders, costing" />
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.ink} />}
      >
        <View style={styles.chips}>
          {KINDS.map(([value, text]) => (
            <Chip key={text} text={text} active={kind === value} onPress={() => setKind(value)} />
          ))}
        </View>
        <View style={styles.chips}>
          {STATUSES.map(([value, text]) => (
            <Chip key={text} text={text} active={status === value} onPress={() => setStatus(value)} />
          ))}
        </View>
        {loading ? <ActivityIndicator color={colors.ink} /> : null}
        {error ? <Text style={ui.error}>{error}</Text> : null}
        {!loading && rows.length === 0 ? <Text style={ui.muted}>Nothing in this filter.</Text> : null}
        {rows.map((item) => (
          <Pressable key={item.id} style={styles.card} onPress={() => navigation.navigate('ApprovalDetail', { id: item.id })}>
            <View style={styles.head}>
              <Text style={styles.ref}>{item.reference}</Text>
              <StatusPill status={item.status} />
            </View>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={ui.muted}>{item.requester_name} · {prettyDate(item.created_at)}</Text>
            {item.amount ? <Text style={styles.amount}>{money(item.amount)}</Text> : null}
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10, paddingBottom: 28 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 14, gap: 4 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  ref: { fontWeight: '800', color: colors.brassDark },
  title: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  amount: { color: colors.ink, fontWeight: '800', marginTop: 4 },
});
