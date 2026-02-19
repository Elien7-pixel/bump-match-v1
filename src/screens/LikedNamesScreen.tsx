
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, FlatList, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { BabyName } from '../models/BabyName';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const LikedNamesScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { token, user } = useAuth();
  const { width } = useWindowDimensions();
  const GAP = 12;
  const PADDING = 16;
  const CARD_WIDTH = Math.min((width - PADDING * 2 - GAP) / 2, 280);
  const CARD_HEIGHT = CARD_WIDTH * 1.4;
  const [likedNames, setLikedNames] = useState<BabyName[]>([]);

  // Query liked names from Convex
  const convexLikedNames = useQuery(
    api.names.getLikedNames,
    token ? { token } : "skip"
  );

  // Query matched names
  const matchedNames = useQuery(
    api.names.getMatchedNames,
    token ? { token } : "skip"
  );

  const matchedNameIds = new Set(matchedNames?.map((m: any) => m.id) || []);

  const styles = React.useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.m,
      paddingTop: theme.spacing.l,
      paddingBottom: theme.spacing.m,
    },
    backButton: {
      padding: theme.spacing.s,
    },
    headerTitle: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.h2,
      color: theme.colors.text,
    },
    list: {
      paddingHorizontal: PADDING,
      paddingTop: theme.spacing.m,
      alignItems: 'center',
    },
    row: {
      gap: GAP,
      justifyContent: 'center',
    },
    cardContainer: {
      width: CARD_WIDTH,
      height: CARD_HEIGHT,
      marginBottom: GAP,
    },
    card: {
      flex: 1,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.m,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 3,
      elevation: 4,
    },
    cardContent: {
      flex: 1,
      justifyContent: 'space-between',
    },
    cardName: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 24,
      color: theme.colors.textLight,
      textAlign: 'center',
    },
    cardGender: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 10,
      color: 'rgba(255, 255, 255, 0.8)',
      textAlign: 'center',
      marginTop: 4,
    },
    cardInfo: {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: theme.borderRadius.m,
      padding: theme.spacing.s,
    },
    cardMeaning: {
      fontFamily: theme.typography.fontFamily,
      fontSize: 11,
      color: theme.colors.textLight,
      textAlign: 'center',
      marginBottom: 4,
    },
    cardOrigin: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 10,
      color: 'rgba(255, 255, 255, 0.9)',
      textAlign: 'center',
    },
    matchBadge: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: '#10B981',
      borderRadius: 12,
      paddingHorizontal: 8,
      paddingVertical: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    matchBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontFamily: theme.typography.fontFamilyBold,
      marginLeft: 4,
    },
    emptyState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    emptyText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.h2,
      color: theme.colors.text,
      marginTop: theme.spacing.l,
      textAlign: 'center',
    },
    emptySubtext: {
      fontFamily: theme.typography.fontFamily,
      fontSize: theme.typography.sizes.body,
      color: theme.colors.grey,
      marginTop: theme.spacing.s,
      textAlign: 'center',
    },
    matchSummary: {
      backgroundColor: isDark ? '#064E3B' : '#ECFDF5',
      marginHorizontal: theme.spacing.m,
      marginBottom: theme.spacing.m,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      flexDirection: 'row',
      alignItems: 'center',
    },
    matchSummaryText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.body,
      color: isDark ? '#D1FAE5' : '#065F46',
      marginLeft: theme.spacing.s,
    },
  }), [theme, isDark]);

  useEffect(() => {
    loadLikedNames();
  }, []);

  // Sync with Convex data
  useEffect(() => {
    if (convexLikedNames && convexLikedNames.length > 0) {
      const formattedNames: BabyName[] = convexLikedNames.map((ln: any) => ({
        id: ln.id,
        name: ln.name,
        gender: ln.gender,
        origin: ln.origin,
        meaning: ln.meaning,
        language: ln.language,
      }));
      setLikedNames(formattedNames);
    }
  }, [convexLikedNames]);

  const loadLikedNames = async () => {
    try {
      const json = await AsyncStorage.getItem('bumpmatch_liked_names');
      if (json) {
        setLikedNames(JSON.parse(json));
      }
    } catch (e) {
      console.log('Error loading liked names', e);
    }
  };

  const getGradientColors = (gender: string) => {
    if (gender === 'boy') return [theme.colors.boyBlue, '#3B82F6'] as const;
    if (gender === 'girl') return [theme.colors.girlPink, '#EC4899'] as const;
    return theme.gradients.g3;
  };

  const renderNameCard = ({ item }: { item: BabyName }) => {
    const isMatch = matchedNameIds.has(item.id);

    return (
      <View style={styles.cardContainer}>
        <LinearGradient
          colors={getGradientColors(item.gender)}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {isMatch && (
            <View style={styles.matchBadge}>
              <Ionicons name="heart" size={12} color="#FFFFFF" />
              <Text style={styles.matchBadgeText}>MATCH</Text>
            </View>
          )}
          <View style={styles.cardContent}>
            <Text style={styles.cardName}>{item.name}</Text>
            <Text style={styles.cardGender}>{item.gender.toUpperCase()}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardMeaning} numberOfLines={2}>{item.meaning}</Text>
              <Text style={styles.cardOrigin}>{item.origin}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  };

  const matchCount = matchedNames?.length || 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liked Names</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Match summary */}
      {matchCount > 0 && user?.partnerId && (
        <View style={styles.matchSummary}>
          <Ionicons name="heart-circle" size={24} color="#10B981" />
          <Text style={styles.matchSummaryText}>
            {matchCount} {matchCount === 1 ? 'name' : 'names'} matched with your partner!
          </Text>
        </View>
      )}

      {/* Content */}
      {likedNames.length > 0 ? (
        <FlatList
          data={likedNames}
          renderItem={renderNameCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color={theme.colors.grey} />
          <Text style={styles.emptyText}>No liked names yet</Text>
          <Text style={styles.emptySubtext}>Start swiping to add your favorites!</Text>
        </View>
      )}
    </SafeAreaView>
  );
};
