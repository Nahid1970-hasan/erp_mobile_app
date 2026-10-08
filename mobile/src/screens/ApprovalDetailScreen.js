import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { colors, ui } from '../utils/theme';
import { label, money, prettyDate } from '../utils/format';
import { ErpApi, errorDetail } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import { Field, PrimaryButton, SecondaryButton, StatusPill } from '../components/ui';

export default function ApprovalDetailScreen({ navigation, route }) {
  const role = useSelector((state) => state.auth.user?.role);
  const [item, setItem] = useState(null);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await ErpApi.approval(route.params.id);
      setItem(response.data);
      setError('');
    } catch (err) {
      setError(errorDetail(err, 'Could not open this approval.'));
    }
  }, [route.params.id]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function decide(action) {
    setBusy(true);
    setError('');
    try {
      const response = await ErpApi.decide(item.id, { action, comment });
      setItem(response.data);
      setComment('');
    } catch (err) {
      setError(errorDetail(err, 'Could not save the decision.'));
    } finally {
      setBusy(false);
    }
  }

  const canDecide = role === 'manager' && item?.status === 'pending';

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title={item?.reference || 'Approval'} onBack={() => navigation.goBack()} />
      {!item && !error ? <ActivityIndicator color={colors.ink} style={styles.pad} /> : null}
      {error && !item ? <Text style={[ui.error, styles.pad]}>{error}</Text> : null}
      {item ? (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.head}>
            <Text style={styles.kind}>{label(item.kind)}</Text>
            <StatusPill status={item.status} />
          </View>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={ui.muted}>{item.requester_name} · {item.requester_role}</Text>
          <Text style={styles.summary}>{item.summary}</Text>
          {item.amount ? <Text style={styles.amount}>{money(item.amount)}</Text> : null}
          <Payload payload={item.payload} />
          {item.comment ? (
            <View style={styles.note}>
              <Text style={styles.noteLabel}>{item.decided_by_name || 'Decision'}</Text>
              <Text style={styles.summary}>{item.comment}</Text>
              <Text style={ui.muted}>{prettyDate(item.decided_at)}</Text>
            </View>
          ) : null}
          {canDecide ? (
            <>
              <Field label="Comment" value={comment} onChangeText={setComment} placeholder="Required when rejecting" multiline />
              {error ? <Text style={ui.error}>{error}</Text> : null}
              <PrimaryButton label={busy ? 'Saving...' : 'Approve'} onPress={() => decide('approve')} disabled={busy} tone="ink" />
              <SecondaryButton label="Reject" onPress={() => decide('reject')} disabled={busy} />
            </>
          ) : null}
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

function Payload({ payload }) {
  if (!payload || typeof payload !== 'object') return null;
  const entries = Object.entries(payload);
  if (!entries.length) return null;
  return (
    <View style={styles.payload}>
      {entries.map(([key, value]) => (
        <View key={key} style={styles.payloadRow}>
          <Text style={styles.noteLabel}>{key.replace(/_/g, ' ')}</Text>
          <Text style={styles.summary}>{Array.isArray(value) ? value.join('\n') : String(value)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { margin: 16 },
  body: { padding: 16, gap: 10, paddingBottom: 32 },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kind: { color: colors.brassDark, fontWeight: '800' },
  title: { fontSize: 26, color: colors.ink, fontWeight: '800' },
  summary: { color: colors.text, fontSize: 16, lineHeight: 22 },
  amount: { fontSize: 22, fontWeight: '800', color: colors.ink },
  note: { backgroundColor: colors.card, borderRadius: 16, padding: 12, borderWidth: 1, borderColor: colors.line, gap: 4 },
  noteLabel: { fontWeight: '800', color: colors.muted, textTransform: 'capitalize' },
  payload: { gap: 8 },
  payloadRow: { backgroundColor: colors.card, borderRadius: 14, padding: 12, borderWidth: 1, borderColor: colors.line, gap: 4 },
});
