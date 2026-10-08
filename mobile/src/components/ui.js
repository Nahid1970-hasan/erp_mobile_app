import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, serif, ui } from '../utils/theme';
import { label } from '../utils/format';

const mark = require('../../assets/icon.png');

const tones = {
  at_risk: ['#F8E6E4', colors.bad],
  pending: ['#F8EFD9', colors.warn],
  rejected: ['#F8E6E4', colors.bad],
  fail: ['#F8E6E4', colors.bad],
  issue: ['#F8E6E4', colors.bad],
  approved: ['#E5F4EE', colors.good],
  pass: ['#E5F4EE', colors.good],
  ready: ['#E5F4EE', colors.good],
  shipped: ['#E5F4EE', colors.good],
  delivered: ['#E5F4EE', colors.good],
  receive: ['#E5F4EE', colors.good],
  in_production: ['#E7EEF6', colors.info],
  in_transit: ['#E7EEF6', colors.info],
  booking: ['#F8EFD9', colors.warn],
  customs: ['#F8EFD9', colors.warn],
};

export function Mark({ size = 56 }) {
  return <Image source={mark} style={{ width: size, height: size, borderRadius: size * 0.22 }} />;
}

export function Card({ children, style }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Field({ label: caption, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.caption}>{caption}</Text>
      <TextInput placeholderTextColor={colors.muted} style={ui.input} {...props} />
    </View>
  );
}

export function Chip({ text, active, onPress }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipOn]}>
      <Text style={[styles.chipText, active && styles.chipTextOn]}>{text}</Text>
    </Pressable>
  );
}

export function StatusPill({ status }) {
  const [bg, fg] = tones[status] || ['#EEEAE2', colors.ink];
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color: fg }]}>{label(status)}</Text>
    </View>
  );
}

export function PrimaryButton({ label: caption, onPress, disabled, tone = 'brass' }) {
  const background = tone === 'danger' ? colors.bad : tone === 'ink' ? colors.ink : colors.brass;
  const color = tone === 'brass' ? colors.ink : colors.white;
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[ui.primary, { backgroundColor: background }, disabled && styles.disabled]}>
      <Text style={[ui.primaryText, { color }]}>{caption}</Text>
    </Pressable>
  );
}

export function SecondaryButton({ label: caption, onPress, disabled }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[ui.ghost, disabled && styles.disabled]}>
      <Text style={ui.ghostText}>{caption}</Text>
    </Pressable>
  );
}

export function SectionTitle({ children }) {
  return <Text style={styles.section}>{children}</Text>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  field: { gap: 6 },
  caption: { fontWeight: '700', color: colors.ink, fontSize: 13 },
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.card,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  chipOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.ink, fontWeight: '700', fontSize: 13 },
  chipTextOn: { color: colors.brass },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontWeight: '800' },
  disabled: { opacity: 0.55 },
  section: { fontFamily: serif, fontSize: 22, color: colors.ink, marginTop: 8 },
});
