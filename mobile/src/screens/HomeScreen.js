import React from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { colors } from '../utils/theme';
import { count } from '../utils/format';
import { ErpApi, unwrap } from '../services/api';
import { useScreenData } from '../hooks/useScreenData';

const ORDER_COLORS = ['#F5A623', '#2D9CDB', '#EB5757', '#5C6570', '#27AE60', '#9B51E0'];

export default function HomeScreen({ navigation }) {
  const user = useSelector((state) => state.auth.user);
  const { data, loading, error, refreshing, reload } = useScreenData(async () => {
    const board = await ErpApi.dashboard();
    let orders = [];
    try {
      const orderResponse = await ErpApi.orders();
      orders = unwrap(orderResponse.data).slice(0, 6);
    } catch (orderError) {
      orders = [];
    }
    return { data: { ...board.data, orders } };
  });
  const kpis = data?.kpis;
  const initial = (user?.first_name || user?.username || 'I').slice(0, 1).toUpperCase();

  function openApprovals() {
    const parent = navigation.getParent();
    if (user?.role === 'manager' || user?.role === 'merchandiser') parent?.navigate('ApprovalsTab');
    else parent?.navigate('HrTab');
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topRow}>
            <Text style={styles.wordmark}>ISHO</Text>
            <View style={styles.topActions}>
              <Pressable style={styles.avatar} onPress={() => navigation.getParent()?.navigate('MoreTab')}>
                <Text style={styles.avatarText}>{initial}</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={() => navigation.navigate('Notifications')}>
                <Ionicons name="menu" size={26} color={colors.white} />
              </Pressable>
            </View>
          </View>
          <Text style={styles.company}>Dekko Isho</Text>
          <Text style={styles.lead}>Let's get to start work</Text>
          <Text style={styles.date}>{longDate()}</Text>
        </SafeAreaView>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={reload} tintColor={colors.white} />}
      >
        {loading && !data ? <ActivityIndicator color={colors.purple} style={styles.spinner} /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {kpis ? (
          <View style={styles.kpiRow}>
            <Kpi color="#2EAE5B" icon="stats-chart" value={count(kpis.output_today)} label="Output today" />
            <Kpi color="#E34B4B" icon="alert-circle" value={count(kpis.at_risk_orders)} label="At risk" onPress={() => navigation.navigate('Orders')} />
            <Kpi color="#3B6FE0" icon="checkmark-done" value={count(kpis.pending_approvals)} label="Approvals" onPress={openApprovals} />
          </View>
        ) : null}

        <View style={styles.chartRow}>
          <ChartCard title="Units" caption="Orders">
            <BarChart values={(data?.orders || []).map((order) => order.qty)} color="#C4B5FD" />
          </ChartCard>
          <ChartCard title="Orders" caption="Status">
            <BarChart values={(data?.orders_by_status || []).map((row) => row.count)} color="#34D399" />
          </ChartCard>
        </View>

        <View style={styles.sectionHead}>
          <Ionicons name="grid" size={14} color={colors.purple} />
          <Text style={styles.section}>ORDERS</Text>
        </View>
        {(data?.orders || []).map((order, index) => (
          <Pressable key={order.id} style={[styles.order, { backgroundColor: ORDER_COLORS[index % ORDER_COLORS.length] }]} onPress={() => navigation.navigate('Orders')}>
            <View style={styles.orderAvatar}>
              <Text style={styles.orderAvatarText}>{(order.buyer_name || 'I').slice(0, 1)}</Text>
            </View>
            <View style={styles.orderText}>
              <Text style={styles.orderName} numberOfLines={1}>{order.style_name}</Text>
              <Text style={styles.orderMeta} numberOfLines={1}>{order.buyer_name}</Text>
            </View>
            <Text style={styles.orderQty}>{count(order.qty)}</Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

function Kpi({ color, icon, value, label, onPress }) {
  return (
    <Pressable style={[styles.kpi, { backgroundColor: color }]} onPress={onPress} disabled={!onPress}>
      <Ionicons name={icon} size={16} color={colors.white} />
      <Text style={styles.kpiValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </Pressable>
  );
}

function ChartCard({ title, caption, children }) {
  return (
    <View style={styles.chartCard}>
      <View style={styles.chartHead}>
        <Text style={styles.chartTitle}>{title}</Text>
        <Text style={styles.chartCaption}>{caption}</Text>
      </View>
      {children}
    </View>
  );
}

function BarChart({ values, color }) {
  const series = values.length ? values : [0];
  const max = Math.max(1, ...series.map((value) => Number(value) || 0));
  return (
    <View style={styles.plot}>
      {series.map((value, index) => (
        <View key={index} style={styles.slot}>
          <View style={[styles.bar, { height: Math.max(8, ((Number(value) || 0) / max) * 72), backgroundColor: color }]} />
        </View>
      ))}
    </View>
  );
}

function longDate() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' });
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.canvas },
  header: {
    backgroundColor: colors.purple,
    paddingHorizontal: 18,
    paddingBottom: 22,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  wordmark: { color: colors.white, fontSize: 18, fontWeight: '800', letterSpacing: 1 },
  topActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EDE9FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.purpleDeep, fontWeight: '800' },
  company: { color: colors.white, fontSize: 28, fontWeight: '700', marginTop: 18 },
  lead: { color: 'rgba(255,255,255,0.88)', fontSize: 16, marginTop: 2 },
  date: { color: 'rgba(255,255,255,0.75)', fontSize: 12, marginTop: 8 },
  body: { padding: 14, paddingBottom: 28, gap: 12 },
  spinner: { marginTop: 12 },
  error: { color: '#E34B4B', fontSize: 14 },
  kpiRow: { flexDirection: 'row', gap: 8 },
  kpi: { flex: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 12, minHeight: 86, justifyContent: 'space-between' },
  kpiValue: { color: colors.white, fontSize: 18, fontWeight: '800', marginTop: 8 },
  kpiLabel: { color: 'rgba(255,255,255,0.92)', fontSize: 11, marginTop: 2 },
  chartRow: { flexDirection: 'row', gap: 10 },
  chartCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 10,
    minHeight: 140,
    shadowColor: '#1F1B3A',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  chartHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  chartTitle: { color: '#6B7280', fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  chartCaption: { color: colors.purple, fontSize: 10, fontWeight: '700' },
  plot: { height: 84, flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  slot: { flex: 1, justifyContent: 'flex-end' },
  bar: { borderRadius: 4, width: '100%' },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  section: { color: '#4B5163', fontSize: 13, fontWeight: '800', letterSpacing: 0.6 },
  order: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 10, gap: 10 },
  orderAvatar: { width: 34, height: 34, borderRadius: 17, backgroundColor: 'rgba(255,255,255,0.28)', alignItems: 'center', justifyContent: 'center' },
  orderAvatarText: { color: colors.white, fontWeight: '800' },
  orderText: { flex: 1 },
  orderName: { color: colors.white, fontWeight: '800', fontSize: 14 },
  orderMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 1 },
  orderQty: { color: colors.white, fontWeight: '800', fontSize: 13 },
});
