import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, ui } from '../utils/theme';
import { ErpApi, errorDetail } from '../services/api';
import ScreenHeader from '../components/ScreenHeader';

const SUGGESTIONS = [
  'Which orders are at risk of delaying shipment this week?',
  "What is today's production versus target?",
  'How many approvals are waiting?',
  'Which materials are below reorder level?',
  'এই সপ্তাহে কোন অর্ডার দেরি হতে পারে?',
];

export default function AssistantScreen({ navigation }) {
  const scrollRef = useRef(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState([
    { from: 'isho', text: 'Ask about live orders, production, approvals, stock, leave, or pay. Bangla and English both work.' },
  ]);

  async function send(text) {
    const question = (text ?? draft).trim();
    if (!question || busy) return;
    setDraft('');
    setMessages((current) => [...current, { from: 'me', text: question }]);
    setBusy(true);
    try {
      const response = await ErpApi.ask(question);
      setMessages((current) => [...current, { from: 'isho', text: response.data.answer }]);
    } catch (error) {
      setMessages((current) => [...current, { from: 'isho', text: errorDetail(error, 'Isho could not answer that.') }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={ui.screen} edges={['top']}>
      <ScreenHeader title="Ask Isho" subtitle="Answers come from ERP data" onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.body}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((message, index) => (
            <View key={`${message.from}-${index}`} style={[styles.bubble, message.from === 'me' ? styles.mine : styles.theirs]}>
              <Text style={[styles.copy, message.from === 'me' && styles.copyMine]}>{message.text}</Text>
            </View>
          ))}
          <View style={styles.suggestions}>
            {SUGGESTIONS.map((item) => (
              <Pressable key={item} style={styles.suggestion} onPress={() => send(item)}>
                <Text style={styles.suggestionText}>{item}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
        <View style={styles.composer}>
          <TextInput
            style={[ui.input, styles.input]}
            value={draft}
            onChangeText={setDraft}
            placeholder={busy ? 'Looking up ERP data...' : 'Ask a question'}
            placeholderTextColor={colors.muted}
            editable={!busy}
          />
          <Pressable style={styles.send} onPress={() => send()} disabled={busy}>
            <Text style={styles.sendText}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  body: { padding: 16, gap: 8, paddingBottom: 16 },
  bubble: { maxWidth: '88%', borderRadius: 16, padding: 12 },
  mine: { alignSelf: 'flex-end', backgroundColor: colors.ink },
  theirs: { alignSelf: 'flex-start', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line },
  copy: { color: colors.text, lineHeight: 21 },
  copyMine: { color: colors.white },
  suggestions: { gap: 8, marginTop: 8 },
  suggestion: { borderRadius: 12, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, padding: 10 },
  suggestionText: { color: colors.ink, fontWeight: '600' },
  composer: { flexDirection: 'row', gap: 8, padding: 12, borderTopWidth: 1, borderTopColor: colors.line },
  input: { flex: 1 },
  send: { backgroundColor: colors.brass, borderRadius: 12, paddingHorizontal: 14, justifyContent: 'center' },
  sendText: { fontWeight: '800', color: colors.ink },
});
