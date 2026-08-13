import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
// Shared with the /faq and /support web pages, so an answer is only ever
// corrected in one place.
import { FAQ_SECTIONS } from '../../convex/faqContent';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const FaqScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const [open, setOpen] = useState<string | null>(null);

  const toggle = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((prev) => (prev === key ? null : key));
  };

  const styles = React.useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: theme.spacing.m, paddingVertical: theme.spacing.m,
    },
    headerTitle: {
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: theme.typography.sizes.h2, color: theme.colors.text, marginLeft: theme.spacing.s,
    },
    intro: {
      fontFamily: theme.typography.fontFamily, fontSize: theme.typography.sizes.body,
      color: theme.colors.grey, paddingHorizontal: theme.spacing.l,
      marginBottom: theme.spacing.l, lineHeight: 21,
    },
    sectionTitle: {
      fontFamily: theme.typography.fontFamilySemiBold, fontSize: theme.typography.sizes.small,
      color: theme.colors.primary, textTransform: 'uppercase', letterSpacing: 0.6,
      paddingHorizontal: theme.spacing.l, marginTop: theme.spacing.l, marginBottom: theme.spacing.s,
    },
    item: {
      backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.m,
      marginHorizontal: theme.spacing.m, marginBottom: theme.spacing.s,
      borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden',
    },
    questionRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      padding: theme.spacing.m,
    },
    question: {
      flex: 1, fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: theme.typography.sizes.body, color: theme.colors.text, marginRight: theme.spacing.s,
    },
    answer: {
      fontFamily: theme.typography.fontFamily, fontSize: theme.typography.sizes.body,
      color: theme.colors.grey, lineHeight: 21,
      paddingHorizontal: theme.spacing.m, paddingBottom: theme.spacing.m,
    },
    footer: {
      margin: theme.spacing.m, marginTop: theme.spacing.l, padding: theme.spacing.l,
      backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.m,
      borderWidth: 1, borderColor: theme.colors.border,
    },
    footerText: {
      fontFamily: theme.typography.fontFamily, fontSize: theme.typography.sizes.body,
      color: theme.colors.grey, lineHeight: 21,
    },
  }), [theme]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={26} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        <Text style={styles.intro}>The questions we get asked most. Tap one to see the answer.</Text>

        {FAQ_SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.entries.map((entry) => {
              const key = `${section.title}:${entry.question}`;
              const expanded = open === key;
              return (
                <View key={key} style={styles.item}>
                  <TouchableOpacity style={styles.questionRow} onPress={() => toggle(key)} activeOpacity={0.7}>
                    <Text style={styles.question}>{entry.question}</Text>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={theme.colors.grey}
                    />
                  </TouchableOpacity>
                  {expanded && <Text style={styles.answer}>{entry.answer}</Text>}
                </View>
              );
            })}
          </View>
        ))}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Still stuck, or think something is broken? Use Send Feedback in the menu — it goes straight to the team.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
