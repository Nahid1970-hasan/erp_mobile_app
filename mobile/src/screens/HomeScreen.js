import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { colors, serif, ui } from '../utils/theme';
import { count, greeting, label } from '../utils/format';
import { ErpApi } from '../services/api';
import { useScreenData } from '../hooks/useScreenData';
import { Card, Mark, SectionTitle, StatusPill } from '../components/ui';

export default function HomeScreen({ navigation }) {
  const user = useSelector((state) => state.auth.user);
  const { data, loading, error, refreshing, reload } = useScreenData(() => ErpApi.dashboard());
  const kpis = data?.kpis;

  function openApprovals() {
    const parent = navigation.getParent();
    if (user?.role === 'manager' || user?.role === 'merchandiser') parent?.navigate('ApprovalsTab');
    else parent?.navigate('HrTab');
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.ink} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.kicker}>{greeting()}</Text>
            <Text style={styles.name}>{user?.first_name || 'there'}</Text>
            <Text style={styles.role}>{user?.designation} · {label(user?.role)}</Text>
          </View>
          <Mark size={52} />
        </View>

        {loading && !data ? <ActivityIndicator color={colors.ink} /> : null}
        {error ? <Text style={ui.error}>{error}</Text> : null}

        {kpis ? (
          <View style={styles.grid}>
            <Kpi title="Output today" value={count(kpis.output_today)} hint={`Target ${count(kpis.target_today)}`} />
            <Kpi title="Efficiency" value={`${kpis.efficiency}%`} hint={`${count(kpis.rejects_today)} rejects`} />
            <Kpi title="At risk" value={count(kpis.at_risk_orders)} hint="Next 7 days" onPress={() => navigation.navigate('Orders')} warn={kpis.at_risk_orders > 0} />
            <Kpi title="Approvals" value={count(kpis.pending_approvals)} hint="Waiting" onPress={openApprovals} />
          </View>
        ) : null}

        <SectionTitle>Lines today</SectionTitle>
        {(data?.lines || []).map((line) => {
          const ratio = line.target ? Math.min(line.output / line.target, 1) : 0;
          return (
            <Card key={line.id}>
              <View style={styles.lineHead}>
                <Text style={styles.lineName}>{line.name}</Text>
                <Text style={styles.eff}>{line.efficiency}%</Text>
              </View>
              <Text style={ui.muted}>{count(line.output)} of {count(line.target)} · {line.rejects} rejects · {line.operators} operators</Text>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${ratio * 100}%`, backgroundColor: ratio < 0.9 ? colors.warn : colors.good }]} />
              </View>
            </Card>
          );
        })}

        <SectionTitle>Orders</SectionTitle>
        <View style={styles.wrap}>
          {(data?.orders_by_status || []).map((row) => (
            <Pressable key={row.status} onPress={() => navigation.navigate('Orders')}>
              <Card style={styles.mini}>
                <Text style={styles.miniCount}>{row.count}</Text>
                <StatusPill status={row.status} />
              </Card>
            </Pressable>
          ))}
        </View>

        <SectionTitle>Shipments</SectionTitle>
        <View style={styles.wrap}>
          {(data?.shipments_by_status || []).map((row) => (
            <Card key={row.status} style={styles.mini}>
              <Text style={styles.miniCount}>{row.count}</Text>
              <StatusPill status={row.status} />
            </Card>
          ))}
        </View>

        <View style={styles.rowTitle}>
          <SectionTitle>Alerts</SectionTitle>
          <Pressable onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        {(data?.notifications || []).slice(0, 3).map((item) => (
          <Card key={item.id}>
            <Text style={styles.alertTitle}>{item.title}</Text>
            <Text style={ui.muted}>{item.body}</Text>
          </Card>
        ))}

        <Pressable style={styles.ask} onPress={() => navigation.navigate('Assistant')}>
          <Text style={styles.askKicker}>Ask Isho</Text>
          <Text style={styles.askText}>Which orders are at risk of delaying shipment this week?</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Kpi({ title, value, hint, onPress, warn }) {
  return (
    <Pressable style={styles.kpiPress} onPress={onPress} disabled={!onPress}>
      <Card style={[styles.kpi, warn && styles.kpiWarn]}>
        <Text style={styles.kpiTitle}>{title}</Text>
        <Text style={styles.kpiValue}>{value}</Text>
        <Text style={ui.muted}>{hint}</Text>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10, paddingBottom: 28 },
  hero: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroText: { flex: 1, paddingRight: 12 },
  kicker: { color: colors.brassDark, fontWeight: '800', letterSpacing: 0.4 },
  name: { fontFamily: serif, fontSize: 34, color: colors.ink },
  role: { color: colors.muted, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
  kpiPress: { width: '48.5%' },
  kpi: { gap: 2 },
  kpiWarn: { borderColor: '#E7C2BE' },
  kpiTitle: { color: colors.muted, fontWeight: '700', fontSize: 12 },
  kpiValue: { fontFamily: serif, fontSize: 28, color: colors.ink },
  lineHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lineName: { fontWeight: '800', color: colors.ink, fontSize: 16 },
  eff: { fontWeight: '800', color: colors.ink },
  track: { height: 8, borderRadius: 99, backgroundColor: '#EFE8DC', marginTop: 10, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 99 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  mini: { minWidth: 108, gap: 6 },
  miniCount: { fontFamily: serif, fontSize: 24, color: colors.ink },
  rowTitle: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  link: { color: colors.brassDark, fontWeight: '800', marginBottom: 4 },
  alertTitle: { fontWeight: '800', color: colors.ink, marginBottom: 4 },
  ask: { backgroundColor: colors.ink, borderRadius: 18, padding: 16, marginTop: 6 },
  askKicker: { color: colors.brass, fontWeight: '800', marginBottom: 4 },
  askText: { color: colors.white, fontSize: 16, lineHeight: 22 },
});
