import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import api from '../../src/services/api.client';

type CoachMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
};

type SendResponse = {
  conversationId: string;
  reply: string;
};

const COLORS = {
  bgDark: '#15241a',
  surface: 'rgba(255,255,255,0.05)',
  surfaceUser: 'rgba(13,242,89,0.18)',
  brand: '#0df259',
  textPrimary: '#fff',
  textMuted: 'rgba(255,255,255,0.6)',
  danger: '#ff4444',
};

const WELCOME: CoachMessage = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hola, soy tu coach Habixa. Puedo ver tu plan de hoy y tu racha real, así que pregúntame cualquier cosa: qué entreno toca, cómo vas de adherencia, o si quieres adaptar la semana. ¿Por dónde empezamos?',
  createdAt: new Date().toISOString(),
};

export default function CoachScreen() {
  const router = useRouter();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<CoachMessage[]>([WELCOME]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  // Optionally, on first mount we could fetch the user's most recent
  // conversation. Keeping it simple for v1 — every open starts a new chat
  // unless the user comes from a list view.

  const send = async () => {
    const message = draft.trim();
    if (!message || sending) return;

    setError('');
    setDraft('');
    const optimisticUser: CoachMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content: message,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticUser]);
    setSending(true);

    try {
      const res = await api.post<SendResponse>('/coach/message', {
        message,
        conversationId: conversationId ?? undefined,
      });
      setConversationId(res.data.conversationId);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          content: res.data.reply,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      console.error('Coach send failed', err);
      setError('No se pudo enviar el mensaje. Intenta de nuevo.');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    // Scroll to bottom whenever messages change.
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [messages.length, sending]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Coach</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.list}
        contentContainerStyle={styles.listContent}
      >
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        {sending ? (
          <View style={styles.bubbleAssistant}>
            <ActivityIndicator color={COLORS.brand} />
          </View>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Escribe a tu coach…"
          placeholderTextColor={COLORS.textMuted}
          editable={!sending}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
          onPress={send}
          disabled={!draft.trim() || sending}
        >
          <Ionicons name="arrow-up" size={20} color={COLORS.bgDark} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message }: { message: CoachMessage }) {
  const isUser = message.role === 'user';
  return (
    <View
      style={[
        styles.bubbleBase,
        isUser ? styles.bubbleUser : styles.bubbleAssistant,
      ]}
    >
      <Text style={[styles.bubbleText, isUser && { color: COLORS.textPrimary }]}>
        {message.content}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bgDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 56,
    paddingBottom: 12,
  },
  title: { color: COLORS.textPrimary, fontSize: 18, fontWeight: 'bold' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 16, gap: 8 },
  bubbleBase: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    maxWidth: '88%',
  },
  bubbleUser: {
    backgroundColor: COLORS.surfaceUser,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  bubbleAssistant: {
    backgroundColor: COLORS.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  bubbleText: { color: COLORS.textPrimary, fontSize: 15, lineHeight: 22 },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    backgroundColor: COLORS.surface,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
});
