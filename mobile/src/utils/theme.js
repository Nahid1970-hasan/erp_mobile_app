import { Platform, StyleSheet } from 'react-native';

export const colors = {
  ink: '#10243E',
  inkSoft: '#1C3658',
  brass: '#C4A15A',
  brassDark: '#8C6A2F',
  paper: '#F3F0E8',
  card: '#FFFCF7',
  line: '#E4DDD0',
  text: '#1A2332',
  muted: '#6E675C',
  good: '#1F7A5A',
  bad: '#9D2C2C',
  warn: '#8A5A00',
  info: '#1D4E89',
  white: '#FFFFFF',
};

export const serif = Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' });

export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  primary: {
    backgroundColor: colors.brass,
    borderRadius: 14,
    minHeight: 50,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  primaryText: { color: colors.ink, fontWeight: '800', fontSize: 16 },
  ghost: {
    backgroundColor: colors.card,
    borderRadius: 14,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
  },
  ghostText: { color: colors.ink, fontWeight: '700', fontSize: 15 },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.bad, fontSize: 14, lineHeight: 20 },
});
