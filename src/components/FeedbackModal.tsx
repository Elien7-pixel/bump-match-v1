import React, { useState } from 'react';
import {
  View, Text, Modal, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Platform, KeyboardAvoidingView, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMutation } from 'convex/react';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../../convex/_generated/api';
import { useTheme } from '../context/ThemeContext';
import { cleanErrorMessage } from '../utils/errors';

/** Set once feedback has been sent or the prompt declined, so we only ask once. */
export const FEEDBACK_PROMPT_KEY = 'bumpmatch_feedback_prompted';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  /** Auth token, when signed in — feedback is accepted either way. */
  token?: string | null;
  /** Softer framing when we opened this ourselves rather than the user asking. */
  prompted?: boolean;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ visible, onClose, token, prompted }) => {
  const { theme } = useTheme();
  const submitFeedback = useMutation(api.feedback.submitFeedback);

  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setMessage('');
    setRating(null);
    setSending(false);
    setSent(false);
    setError('');
  };

  const close = () => {
    // Remember that we asked, whether or not they sent anything — nobody wants
    // to be prompted for feedback twice.
    AsyncStorage.setItem(FEEDBACK_PROMPT_KEY, 'true').catch(() => {});
    reset();
    onClose();
  };

  const handleSend = async () => {
    if (!message.trim()) {
      setError('Please write a little something first.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await submitFeedback({
        token: token || undefined,
        message: message.trim(),
        rating: rating ?? undefined,
        platform: Platform.OS,
        appVersion: Constants.expoConfig?.version ?? undefined,
      });
      setSent(true);
      AsyncStorage.setItem(FEEDBACK_PROMPT_KEY, 'true').catch(() => {});
    } catch (e: any) {
      setError(cleanErrorMessage(e?.message) || 'Could not send that — please try again.');
    } finally {
      setSending(false);
    }
  };

  const styles = React.useMemo(() => StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(74, 68, 89, 0.45)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: theme.colors.card,
      borderTopLeftRadius: theme.borderRadius.xl,
      borderTopRightRadius: theme.borderRadius.xl,
      maxHeight: '90%',
    },
    header: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      padding: theme.spacing.l, borderBottomWidth: 1, borderBottomColor: theme.colors.border,
    },
    title: {
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: theme.typography.sizes.h2, color: theme.colors.text,
    },
    body: { padding: theme.spacing.l },
    intro: {
      fontFamily: theme.typography.fontFamily, fontSize: theme.typography.sizes.body,
      color: theme.colors.grey, marginBottom: theme.spacing.l, lineHeight: 21,
    },
    label: {
      fontFamily: theme.typography.fontFamilySemiBold, fontSize: theme.typography.sizes.small,
      color: theme.colors.text, marginBottom: theme.spacing.s,
    },
    stars: { flexDirection: 'row', marginBottom: theme.spacing.l },
    star: { marginRight: 8 },
    input: {
      backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.m, padding: 14, minHeight: 120,
      textAlignVertical: 'top', fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body, color: theme.colors.text,
    },
    error: {
      fontFamily: theme.typography.fontFamily, fontSize: theme.typography.sizes.small,
      color: theme.colors.destructive, marginTop: theme.spacing.s,
    },
    sendBtn: {
      backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.m,
      padding: 16, alignItems: 'center', marginTop: theme.spacing.l,
    },
    sendText: {
      fontFamily: theme.typography.fontFamilySemiBold, fontSize: theme.typography.sizes.body,
      color: theme.colors.textLight,
    },
    laterBtn: { alignItems: 'center', paddingVertical: theme.spacing.m },
    laterText: {
      fontFamily: theme.typography.fontFamily, fontSize: theme.typography.sizes.small,
      color: theme.colors.grey,
    },
    doneWrap: { padding: theme.spacing.xl, alignItems: 'center' },
    doneTitle: {
      fontFamily: theme.typography.fontFamilyDisplay, fontSize: theme.typography.sizes.h2,
      color: theme.colors.text, marginTop: theme.spacing.m, textAlign: 'center',
    },
    doneText: {
      fontFamily: theme.typography.fontFamily, fontSize: theme.typography.sizes.body,
      color: theme.colors.grey, marginTop: theme.spacing.s, textAlign: 'center', lineHeight: 21,
    },
  }), [theme]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backdrop}>
          <View style={styles.sheet}>
            <SafeAreaView edges={['bottom']}>
              <View style={styles.header}>
                <Text style={styles.title}>{sent ? 'Thank you' : 'Send us feedback'}</Text>
                <TouchableOpacity onPress={close} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                  <Ionicons name="close" size={26} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              {sent ? (
                <View style={styles.doneWrap}>
                  <Ionicons name="checkmark-circle" size={56} color={theme.colors.primary} />
                  <Text style={styles.doneTitle}>Got it — thank you!</Text>
                  <Text style={styles.doneText}>
                    We read every message. If you asked something we can answer, we will get back to you.
                  </Text>
                  <TouchableOpacity style={styles.sendBtn} onPress={close}>
                    <Text style={styles.sendText}>Close</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
                  <Text style={styles.intro}>
                    {prompted
                      ? 'Enjoying Bump Match? Tell us what is working and what is not — it goes straight to the team.'
                      : 'Tell us what is working, what is not, or what you wish the app did. It goes straight to the team.'}
                  </Text>

                  <Text style={styles.label}>How is it going so far? (optional)</Text>
                  <View style={styles.stars}>
                    {[1, 2, 3, 4, 5].map((n) => (
                      <TouchableOpacity key={n} style={styles.star} onPress={() => setRating(n)}>
                        <Ionicons
                          name={rating !== null && n <= rating ? 'star' : 'star-outline'}
                          size={30}
                          color={theme.colors.primary}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.label}>Your feedback</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="What would make Bump Match better for you?"
                    placeholderTextColor={theme.colors.grey}
                    value={message}
                    onChangeText={(t) => { setMessage(t); if (error) setError(''); }}
                    multiline
                    maxLength={4000}
                  />
                  {!!error && <Text style={styles.error}>{error}</Text>}

                  <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending}>
                    {sending
                      ? <ActivityIndicator color={theme.colors.textLight} />
                      : <Text style={styles.sendText}>Send feedback</Text>}
                  </TouchableOpacity>

                  {prompted && (
                    <TouchableOpacity style={styles.laterBtn} onPress={close}>
                      <Text style={styles.laterText}>Not right now</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              )}
            </SafeAreaView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
