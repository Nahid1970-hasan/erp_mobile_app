import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { colors, ui } from '../utils/theme';
import { prettyDate } from '../utils/format';
import { ErpApi, errorDetail } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';
import { Chip, Field, PrimaryButton, StatusPill } from '../components/ui';

export default function QcScreen({ navigation }) {
  const role = useSelector((state) => state.auth.user?.role);
  const canWrite = role === 'manager' || role === 'supervisor';
  const [stylesList, setStyles] = useState([]);
  const [rows, setRows] = useState([]);
  const [styleId, setStyleId] = useState(null);
  const [result, setResult] = useState('pass');
  const [defect, setDefect] = useState('');
  const [sampleSize, setSampleSize] = useState('32');
  const [defectQty, setDefectQty] = useState('0');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [styleRes, qcRes] = await Promise.all([ErpApi.styles(), ErpApi.inspections()]);
      setStyles(styleRes.data);
      setRows(qcRes.data);
      setStyleId((current) => current || styleRes.data[0]?.id || null);
      setError('');
    } catch (err) {
      setError(errorDetail(err, 'Could not load inspections.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function save() {
    setBusy(true);
    setError('');
    try {
      await ErpApi.createInspection({
        style: styleId,
        result,
        defect: defect.trim(),
        sample_size: Number(sampleSize),
        defect_qty: Number(defectQty || 0),
        note: note.trim(),
      });
      setDefect('');
      setNote('');
      setDefectQty('0');
      await load();
    } catch (err) {
      setError(errorDetail(err, 'Could not save the inspection.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title="QC" subtitle="Sample inspection" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {loading ? <ActivityIndicator color={colors.ink} /> : null}
        {canWrite ? (
          <>
            <Text style={styles.label}>Style</Text>
            <View style={styles.chips}>
              {stylesList.map((style) => (
                <Chip key={style.id} text={style.style_no} active={styleId === style.id} onPress={() => setStyleId(style.id)} />
              ))}
            </View>
            <View style={styles.chips}>
              <Chip text="Pass" active={result === 'pass'} onPress={() => setResult('pass')} />
              <Chip text="Fail" active={result === 'fail'} onPress={() => setResult('fail')} />
            </View>
            {result === 'fail' ? <Field label="Defect" value={defect} onChangeText={setDefect} placeholder="Broken stitch, shade, measurement..." /> : null}
            <Field label="Sample size" value={sampleSize} onChangeText={setSampleSize} keyboardType="number-pad" />
            <Field label="Defect quantity" value={defectQty} onChangeText={setDefectQty} keyboardType="number-pad" />
            <Field label="Note" value={note} onChangeText={setNote} />
            {error ? <Text style={ui.error}>{error}</Text> : null}
            <PrimaryButton label={busy ? 'Saving...' : 'Save inspection'} onPress={save} disabled={busy} />
          </>
        ) : null}
        <Text style={styles.label}>Recent</Text>
        {rows.map((row) => (
          <View key={row.id} style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.title}>{row.style_no} · {row.style_name}</Text>
              <Text style={ui.muted}>{row.defect || row.note || row.inspector_name}</Text>
              <Text style={ui.muted}>{prettyDate(row.created_at)} · {row.defect_qty}/{row.sample_size}</Text>
            </View>
            <StatusPill status={row.result} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10, paddingBottom: 32 },
  label: { fontWeight: '800', color: colors.ink },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  row: { flexDirection: 'row', gap: 8, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 12 },
  flex: { flex: 1, gap: 2 },
  title: { fontWeight: '800', color: colors.ink },
});
