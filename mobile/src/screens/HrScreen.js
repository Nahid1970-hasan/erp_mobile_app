import React, { useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, ui } from '../utils/theme';
import { label, prettyDate, prettyTime } from '../utils/format';
import { ErpApi, errorDetail } from '../services/api';
import { useScreenData } from '../hooks/useScreenData';
import ScreenHeader from '../components/ScreenHeader';
import { Chip, Field, PrimaryButton, StatusPill } from '../components/ui';

export default function HrScreen({ navigation }) {
  const { data, loading, error, refreshing, reload } = useScreenData(async () => {
    const [attendance, leaves] = await Promise.all([ErpApi.attendance(), ErpApi.leaves()]);
    return { data: { attendance: attendance.data, leaves: leaves.data } };
  });
  const [leaveType, setLeaveType] = useState('casual');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [clocking, setClocking] = useState(false);

  const today = data?.attendance?.today;
  const clockLabel = !today?.check_in ? 'Check in' : !today?.check_out ? 'Check out' : 'Completed today';

  async function clock() {
    setClocking(true);
    setFormError('');
    try {
      await ErpApi.clock();
      await reload();
    } catch (err) {
      setFormError(errorDetail(err, 'Could not update attendance.'));
    } finally {
      setClocking(false);
    }
  }

  async function requestLeave() {
    setBusy(true);
    setFormError('');
    try {
      await ErpApi.createLeave({ leave_type: leaveType, start_date: startDate, end_date: endDate, reason: reason.trim() });
      setReason('');
      await reload();
    } catch (err) {
      setFormError(errorDetail(err, 'Could not submit leave.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title="HR" subtitle="Attendance, leave, pay, notices" />
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.ink} />}
      >
        {loading && !data ? <ActivityIndicator color={colors.ink} /> : null}
        {error ? <Text style={ui.error}>{error}</Text> : null}
        <View style={styles.clock}>
          <Text style={styles.clockKicker}>Today</Text>
          <Text style={styles.clockTime}>
            {today?.check_in ? `${prettyTime(today.check_in)} – ${today.check_out ? prettyTime(today.check_out) : 'open'}` : 'Not checked in'}
          </Text>
          <PrimaryButton label={clocking ? 'Saving...' : clockLabel} onPress={clock} disabled={clocking || Boolean(today?.check_out)} tone="ink" />
        </View>
        <View style={styles.links}>
          <Pressable style={styles.link} onPress={() => navigation.navigate('Payslips')}><Text style={styles.linkText}>Payslips</Text></Pressable>
          <Pressable style={styles.link} onPress={() => navigation.navigate('Notices')}><Text style={styles.linkText}>Notices</Text></Pressable>
        </View>
        <Text style={styles.label}>Request leave</Text>
        <View style={styles.chips}>
          {['casual', 'sick', 'earned'].map((type) => (
            <Chip key={type} text={label(type)} active={leaveType === type} onPress={() => setLeaveType(type)} />
          ))}
        </View>
        <Field label="Start date" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        <Field label="End date" value={endDate} onChangeText={setEndDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
        <Field label="Reason" value={reason} onChangeText={setReason} multiline />
        {formError ? <Text style={ui.error}>{formError}</Text> : null}
        <PrimaryButton label={busy ? 'Sending...' : 'Submit leave'} onPress={requestLeave} disabled={busy} />
        <Text style={styles.label}>Your leave</Text>
        {(data?.leaves || []).map((leave) => (
          <View key={leave.id} style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.title}>{label(leave.leave_type)} · {leave.reference}</Text>
              <Text style={ui.muted}>{prettyDate(leave.start_date)} – {prettyDate(leave.end_date)}</Text>
            </View>
            <StatusPill status={leave.status} />
          </View>
        ))}
        <Text style={styles.label}>Recent attendance</Text>
        {(data?.attendance?.history || []).map((row) => (
          <View key={row.id} style={styles.row}>
            <Text style={styles.title}>{prettyDate(row.work_date)}</Text>
            <Text style={ui.muted}>{prettyTime(row.check_in)} – {prettyTime(row.check_out)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10, paddingBottom: 32 },
  clock: { backgroundColor: colors.ink, borderRadius: 18, padding: 16, gap: 8 },
  clockKicker: { color: colors.brass, fontWeight: '800' },
  clockTime: { color: colors.white, fontSize: 28, fontWeight: '800' },
  links: { flexDirection: 'row', gap: 8 },
  link: { flex: 1, backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 14, alignItems: 'center' },
  linkText: { fontWeight: '800', color: colors.ink },
  label: { fontWeight: '800', color: colors.ink, marginTop: 4 },
  chips: { flexDirection: 'row', gap: 8 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 8, alignItems: 'center', backgroundColor: colors.card, borderRadius: 14, borderWidth: 1, borderColor: colors.line, padding: 12 },
  flex: { flex: 1 },
  title: { fontWeight: '800', color: colors.ink },
});
