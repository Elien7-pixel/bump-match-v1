import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useTheme } from '../context/ThemeContext';

interface DictionaryEntry {
  name: string;
  meaning: string;
  origin: string;
  gender: 'boy' | 'girl' | 'unisex';
  pronunciation?: string;
  variants?: string[];
  famousPeople?: Array<{ name: string; description: string }>;
  notFound?: boolean;
}

export const DictionaryScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const lookupName = useAction(api.dictionary.lookupName);

  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DictionaryEntry | null>(null);

  const handleLookup = async () => {
    const trimmed = query.trim();
    if (!trimmed) {
      Alert.alert('Enter a name', 'Type a baby name to look up its meaning.');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const entry = await lookupName({ name: trimmed });
      setResult(entry);
    } catch (e: any) {
      Alert.alert('Lookup failed', e.message || 'Could not look up that name. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const genderColor = (g: string) => {
    if (g === 'boy') return theme.colors.boyBlue;
    if (g === 'girl') return theme.colors.girlPink;
    return theme.colors.neutralBeige;
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.l,
      paddingBottom: theme.spacing.m,
    },
    backButton: { padding: theme.spacing.s },
    headerTitle: {
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: theme.typography.sizes.h2,
      color: theme.colors.text,
      marginLeft: theme.spacing.s,
    },
    intro: {
      paddingHorizontal: theme.spacing.l,
      marginBottom: theme.spacing.m,
    },
    introText: {
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.grey,
      fontSize: 14,
      lineHeight: 20,
    },
    searchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.l,
      gap: 8,
    },
    input: {
      flex: 1,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.m,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: 12,
      fontFamily: theme.typography.fontFamily,
      fontSize: 16,
      color: theme.colors.text,
    },
    button: {
      backgroundColor: theme.colors.primary,
      borderRadius: theme.borderRadius.m,
      paddingHorizontal: theme.spacing.m,
      paddingVertical: 12,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 80,
    },
    buttonText: {
      color: theme.colors.textLight,
      fontFamily: theme.typography.fontFamilySemiBold,
      fontSize: 14,
    },
    resultArea: {
      flex: 1,
      paddingHorizontal: theme.spacing.l,
      paddingTop: theme.spacing.l,
    },
    placeholder: {
      alignItems: 'center',
      marginTop: 60,
      paddingHorizontal: theme.spacing.l,
    },
    placeholderImage: {
      width: 120,
      height: 120,
    },
    placeholderTitle: {
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: theme.typography.sizes.h3,
      color: theme.colors.text,
      marginTop: 16,
      textAlign: 'center',
    },
    placeholderBody: {
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.grey,
      fontSize: 14,
      lineHeight: 20,
      marginTop: 8,
      textAlign: 'center',
    },
    card: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.l,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: theme.spacing.l,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 6,
      elevation: 3,
      marginBottom: theme.spacing.l,
    },
    nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
    name: {
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: theme.typography.sizes.h1,
      color: theme.colors.text,
    },
    genderBadge: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.round,
      marginLeft: 12,
    },
    genderBadgeText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 11,
      color: theme.brand.ink,
      textTransform: 'uppercase',
    },
    pronunciation: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 14,
      fontStyle: 'italic',
      color: theme.colors.grey,
      marginBottom: theme.spacing.m,
    },
    sectionLabel: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 11,
      color: theme.brand.pinkDeep,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 4,
      marginTop: theme.spacing.m,
    },
    sectionBody: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 15,
      color: theme.colors.text,
      lineHeight: 22,
    },
    variantsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
    variantPill: {
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.round,
      backgroundColor: theme.brand.pinkSoft,
    },
    variantText: {
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: 13,
      color: theme.brand.pinkDeep,
    },
    originChip: {
      alignSelf: 'flex-start',
      paddingHorizontal: 12,
      paddingVertical: 5,
      borderRadius: theme.borderRadius.round,
      backgroundColor: theme.brand.tealSoft,
      marginTop: 2,
    },
    originChipText: {
      fontFamily: theme.typography.fontFamilyMedium,
      fontSize: 13,
      color: theme.brand.tealDeep,
    },
    famousItem: {
      flexDirection: 'row',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    famousName: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 14,
      color: theme.colors.text,
      flex: 1,
    },
    famousDesc: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 13,
      color: theme.colors.grey,
      flex: 1.4,
      textAlign: 'right',
    },
    notFound: {
      paddingVertical: theme.spacing.l,
      alignItems: 'center',
    },
    notFoundText: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 14,
      color: theme.colors.grey,
      textAlign: 'center',
      marginTop: 8,
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Name Dictionary</Text>
      </View>

      <View style={styles.intro}>
        <Text style={styles.introText}>
          Type any name to look up its meaning, origin, and famous people who share it.
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.searchRow}>
          <TextInput
            style={styles.input}
            placeholder="e.g. Naledi, Oliver, Lerato"
            placeholderTextColor={theme.colors.grey}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={handleLookup}
            autoCapitalize="words"
            returnKeyType="search"
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleLookup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.textLight} />
            ) : (
              <Text style={styles.buttonText}>Look up</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.resultArea} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {!result && !loading && (
            <View style={styles.placeholder}>
              <Image
                source={require('../../assets/brand/characters/starro.png')}
                style={styles.placeholderImage}
                resizeMode="contain"
              />
              <Text style={styles.placeholderTitle}>Look up any baby name</Text>
              <Text style={styles.placeholderBody}>
                Get the meaning, origin, pronunciation, common spellings and famous bearers.
              </Text>
            </View>
          )}

          {result && result.notFound && (
            <View style={styles.card}>
              <View style={styles.notFound}>
                <Ionicons name="search" size={32} color={theme.colors.grey} />
                <Text style={styles.notFoundText}>
                  We couldn't find anything for "{query}". Try a different spelling.
                </Text>
              </View>
            </View>
          )}

          {result && !result.notFound && (
            <View style={styles.card}>
              <View style={styles.nameRow}>
                <Text style={styles.name}>{result.name}</Text>
                <View style={[styles.genderBadge, { backgroundColor: genderColor(result.gender) }]}>
                  <Text style={styles.genderBadgeText}>
                    {result.gender === 'unisex' ? 'Neutral' : result.gender}
                  </Text>
                </View>
              </View>

              {result.pronunciation ? (
                <Text style={styles.pronunciation}>{result.pronunciation}</Text>
              ) : null}

              <Text style={styles.sectionLabel}>Meaning</Text>
              <Text style={styles.sectionBody}>{result.meaning}</Text>

              {result.origin ? (
                <>
                  <Text style={styles.sectionLabel}>Origin</Text>
                  <View style={styles.originChip}>
                    <Text style={styles.originChipText}>{result.origin}</Text>
                  </View>
                </>
              ) : null}

              {result.variants && result.variants.length > 0 ? (
                <>
                  <Text style={styles.sectionLabel}>Common spellings</Text>
                  <View style={styles.variantsRow}>
                    {result.variants.map((v) => (
                      <View key={v} style={styles.variantPill}>
                        <Text style={styles.variantText}>{v}</Text>
                      </View>
                    ))}
                  </View>
                </>
              ) : null}

              {result.famousPeople && result.famousPeople.length > 0 ? (
                <>
                  <Text style={styles.sectionLabel}>Famous bearers</Text>
                  {result.famousPeople.map((p, i) => (
                    <View key={`${p.name}-${i}`} style={styles.famousItem}>
                      <Text style={styles.famousName}>{p.name}</Text>
                      <Text style={styles.famousDesc}>{p.description}</Text>
                    </View>
                  ))}
                </>
              ) : null}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};
