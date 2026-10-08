import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { colors, ui } from '../utils/theme';
import { count, hourLabel } from '../utils/format';
import { ErpApi, errorDetail } from '../services/api';
import { enqueueEntry, flushQueue, queuedEntries } from '../services/offlineQueue';
import ScreenHeader from '../components/ScreenHeader';
import { Chip, Field, PrimaryButton } from '../components/ui';

export default function ProductionScreen({ navigation }) {
  const role = useSelector((state) => state.auth.user?.role);
  const canWrite = role === 'manager' || role === 'supervisor';
  const [lines, setLines] = useState([]);
  const [entries, setEntries] = useState([]);
  const [queued, setQueued] = useState(0);
  const [lineId, setLineId] = useState(null);
  const [hour, setHour] = useState(String(new Date().getHours()));
  const [outputQty, setOutputQty] = useState('');
  const [rejectQty, setRejectQty] = useState('0');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [lineRes, entryRes, queue] = await Promise.all([ErpApi.lines(), ErpApi.entries(), queuedEntries()]);
      setLines(lineRes.data);
      setEntries(entryRes.data);
      setQueued(queue.length);
      setLineId((current) => current || lineRes.data[0]?.id || null);
      setError('');
    } catch (err) {
      setError(errorDetail(err, 'Could not load production.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function syncQueue() {
    const result = await flushQueue();
    const queue = await queuedEntries();
    setQueued(queue.length);
    if (result.sent) setInfo(`Synced ${result.sent} queued entr${result.sent === 1 ? 'y' : 'ies'}.`);
    return result;
  }

  async function save() {
    const body = {
      line: lineId,
      hour: Number(hour),
      output_qty: Number(outputQty),
      reject_qty: Number(rejectQty || 0),
      note: note.trim(),
    };
    if (!lineId || Number.isNaN(body.hour) || Number.isNaN(body.output_qty)) {
      setError('Choose a line and enter the hour and output.');
      return;
    }
    setBusy(true);
    setError('');
    setInfo('');
    try {
      await ErpApi.createEntry(body);
      setOutputQty('');
      setNote('');
      setInfo('Hour recorded.');
      await syncQueue();
      await load();
    } catch (err) {
      if (!err.response) {
        await enqueueEntry(body);
        setQueued((countValue) => countValue + 1);
        setInfo('No connection. This hour is saved on the phone and will sync later.');
        setOutputQty('');
        setNote('');
      } else {
        setError(errorDetail(err, 'Could not record this hour.'));
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title="Output" subtitle="Hourly line record" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {loading ? <ActivityIndicator color={colors.ink} /> : null}
        {queued > 0 ? <Text style={styles.queue}>{queued} entr{queued === 1 ? 'y' : 'ies'} waiting to sync.</Text> : null}
        {canWrite ? (
          <>
            <Text style={styles.label}>Line</Text>
            <View style={styles.chips}>
              {lines.map((line) => (
                <Chip key={line.id} text={line.code} active={lineId === line.id} onPress={() => setLineId(line.id)} />
              ))}
            </View>
            <Field label="Hour (0–23)" value={hour} onChangeText={setHour} keyboardType="number-pad" />
            <Field label="Output quantity" value={outputQty} onChangeText={setOutputQty} keyboardType="number-pad" />
            <Field label="Rejects" value={rejectQty} onChangeText={setRejectQty} keyboardType="number-pad" />
            <Field label="Note" value={note} onChangeText={setNote} placeholder="Optional" />
            {error ? <Text style={ui.error}>{error}</Text> : null}
            {info ? <Text style={styles.info}>{info}</Text> : null}
            <PrimaryButton label={busy ? 'Saving...' : 'Record hour'} onPress={save} disabled={busy} />
            {queued > 0 ? <PrimaryButton label="Sync queued hours" tone="ink" onPress={async () => { await syncQueue(); await load(); }} /> : null}
          </>
        ) : (
          <Text style={ui.muted}>You can review today’s hours. Supervisors record them.</Text>
        )}
        <Text style={styles.label}>Today</Text>
        {entries.map((entry) => (
          <View key={entry.id} style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>{entry.line_code} · {hourLabel(entry.hour)}</Text>
              <Text style={ui.muted}>{entry.note || entry.recorded_by_name}</Text>
            </View>
            <Text style={styles.qty}>{count(entry.output_qty)}{entry.reject_qty ? ` / ${entry.reject_qty} rej` : ''}</Text>
          </View>
        ))}
        {!loading && entries.length === 0 ? <Text style={ui.muted}>No hours recorded for today.</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10, paddingBottom: 32 },
  label: { fontWeight: '800', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  queue: { backgroundColor: '#F8EFD9', color: colors.warn, fontWeight: '700', padding: 10, borderRadius: 12 },
  info: { color: colors.good, fontWeight: '700' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 12 },
  rowTitle: { fontWeight: '800', color: colors.ink },
  qty: { fontWeight: '800', color: colors.ink },
});
