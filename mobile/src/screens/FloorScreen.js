import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { colors, ui } from '../utils/theme';
import ScreenHeader from '../components/ScreenHeader';

const LINKS = [
  { title: 'Hourly output', body: 'Line output, rejects, and offline queue.', screen: 'Production', icon: 'speedometer-outline', roles: ['manager', 'supervisor', 'merchandiser'] },
  { title: 'QC inspection', body: 'Pass or fail a sample and name the defect.', screen: 'QC', icon: 'search-outline', roles: ['manager', 'supervisor', 'merchandiser'] },
  { title: 'Shipments', body: 'Booking, vessel, and customs.', screen: 'Shipments', icon: 'boat-outline', roles: ['manager', 'supervisor', 'store', 'merchandiser'] },
  { title: 'Store', body: 'Receive or issue by SKU or barcode.', screen: 'Store', icon: 'cube-outline', roles: ['manager', 'store', 'supervisor', 'merchandiser'] },
];

export default function FloorScreen({ navigation }) {
  const role = useSelector((state) => state.auth.user?.role);
  const links = LINKS.filter((item) => item.roles.includes(role));

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title="Floor" subtitle="Sewing, QC, store, and shipment" />
      <ScrollView contentContainerStyle={styles.body}>
        {links.map((item) => (
          <Pressable key={item.screen} style={styles.card} onPress={() => navigation.navigate(item.screen)}>
            <View style={styles.icon}>
              <Ionicons name={item.icon} size={22} color={colors.brass} />
            </View>
            <View style={styles.copy}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={ui.muted}>{item.body}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 16, gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  icon: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.ink, alignItems: 'center', justifyContent: 'center' },
  copy: { flex: 1, gap: 2 },
  title: { fontWeight: '800', color: colors.ink, fontSize: 16 },
});
