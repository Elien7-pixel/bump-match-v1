
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, FlatList, useWindowDimensions, Share, Platform, Alert } from 'react-native';
import ViewShot, { captureRef } from 'react-native-view-shot';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { BabyName } from '../models/BabyName';
import { useNavigation } from '@react-navigation/native';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface LikedNameWithFavorite extends BabyName {
  isFavorite?: boolean;
}

export const LikedNamesScreen = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { token, user } = useAuth();
  const { width } = useWindowDimensions();
  const GAP = 12;
  const PADDING = 16;
  const CARD_WIDTH = Math.min((width - PADDING * 2 - GAP) / 2, 280);
  const CARD_HEIGHT = CARD_WIDTH * 1.4;
  const [likedNames, setLikedNames] = useState<LikedNameWithFavorite[]>([]);
  const [genderFilter, setGenderFilter] = useState<'all' | 'boy' | 'girl' | 'unisex'>('all');
  const [languageFilter, setLanguageFilter] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showGenderDropdown, setShowGenderDropdown] = useState(false);
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const surname = user?.surname || '';
  const cardRefs = useRef<{ [key: string]: any }>({});

  const handleShareName = async (item: LikedNameWithFavorite) => {
    const fullName = surname ? `${item.name} ${surname}` : item.name;
    const ref = cardRefs.current[item.id];

    try {
      if (ref) {
        // Capture the card as an image
        const uri = await captureRef(ref, {
          format: 'png',
          quality: 1,
        });

        // Share image + text
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'image/png',
            dialogTitle: `Share ${fullName}`,
          });
        } else {
          // Fallback to text-only share
          await Share.share({
            message: `We're considering the name "${fullName}" for our baby!\n\nMeaning: ${item.meaning}\nOrigin: ${item.origin}\n\nFound on BumpMatch`,
          });
        }
      }
    } catch (e) {
      console.log('Error sharing', e);
    }
  };

  const handleDeleteName = (item: LikedNameWithFavorite) => {
    Alert.alert(
      'Remove Name',
      `Are you sure you want to remove "${item.name}" from your liked names?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setLikedNames(prev => prev.filter(n => n.id !== item.id));
            if (token) {
              try {
                await unlikeNameMutation({ token, nameId: item.id });
              } catch (e) {
                console.log('Error removing name', e);
              }
            }
            // Update local storage
            const updated = likedNames.filter(n => n.id !== item.id);
            AsyncStorage.setItem('bumpmatch_liked_names', JSON.stringify(updated));
          },
        },
      ]
    );
  };

  const handleClearAllLiked = () => {
    Alert.alert(
      'Clear All Liked Names',
      `Are you sure you want to remove all ${likedNames.length} liked names? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            setLikedNames([]);
            AsyncStorage.setItem('bumpmatch_liked_names', JSON.stringify([]));
            if (token) {
              try {
                await clearAllLikedMutation({ token });
              } catch (e) {
                console.log('Error clearing liked names', e);
              }
            }
          },
        },
      ]
    );
  };

  const handleClearAllFavorites = () => {
    Alert.alert(
      'Clear All Favorites',
      `Are you sure you want to unfavorite all ${favoriteCount} names? They will remain in your liked list.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Favorites',
          style: 'destructive',
          onPress: async () => {
            setLikedNames(prev => prev.map(n => ({ ...n, isFavorite: false })));
            if (token) {
              try {
                await clearAllFavoritesMutation({ token });
              } catch (e) {
                console.log('Error clearing favorites', e);
              }
            }
          },
        },
      ]
    );
  };

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

  const toggleFavoriteMutation = useMutation(api.names.toggleFavorite);
  const unlikeNameMutation = useMutation(api.names.unlikeName);
  const clearAllLikedMutation = useMutation(api.names.clearAllLikedNames);
  const clearAllFavoritesMutation = useMutation(api.names.clearAllFavorites);

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
    filterBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.m,
      gap: 8,
    },
    dropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    dropdownText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
      marginRight: 4,
    },
    favoritesChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: theme.borderRadius.m,
      backgroundColor: theme.colors.card,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    favoritesChipActive: {
      backgroundColor: '#FEF3C7',
      borderColor: '#F59E0B',
    },
    dropdownMenu: {
      position: 'absolute',
      top: '100%',
      left: 0,
      zIndex: 100,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 10,
      minWidth: 140,
      overflow: 'hidden',
    },
    dropdownItem: {
      paddingVertical: 10,
      paddingHorizontal: 14,
    },
    dropdownItemActive: {
      backgroundColor: isDark ? theme.colors.primary : '#E0F2FE',
    },
    dropdownItemText: {
      fontSize: 13,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
    },
    dropdownItemTextActive: {
      fontFamily: theme.typography.fontFamilyBold,
      color: isDark ? '#FFFFFF' : theme.colors.primary,
    },
    cardSurname: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 24,
      color: theme.colors.textLight,
      textAlign: 'center',
    },
    shareButton: {
      position: 'absolute',
      bottom: 8,
      right: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    deleteCardButton: {
      position: 'absolute',
      bottom: 8,
      left: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(220,38,38,0.5)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
    },
    favoritesChipText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
      marginLeft: 4,
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
    favoriteButton: {
      position: 'absolute',
      top: 8,
      left: 8,
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(0,0,0,0.35)',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
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
    favoritesSection: {
      backgroundColor: isDark ? '#78350F' : '#FFFBEB',
      marginHorizontal: theme.spacing.m,
      marginBottom: theme.spacing.m,
      padding: theme.spacing.m,
      borderRadius: theme.borderRadius.m,
      flexDirection: 'row',
      alignItems: 'center',
    },
    favoritesSectionText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: theme.typography.sizes.body,
      color: isDark ? '#FDE68A' : '#92400E',
      marginLeft: theme.spacing.s,
    },
  }), [theme, isDark]);

  useEffect(() => {
    loadLikedNames();
  }, []);

  // Sync with Convex data
  useEffect(() => {
    if (convexLikedNames && convexLikedNames.length > 0) {
      const formattedNames: LikedNameWithFavorite[] = convexLikedNames.map((ln: any) => ({
        id: ln.id,
        name: ln.name,
        gender: ln.gender,
        origin: ln.origin,
        meaning: ln.meaning,
        language: ln.language,
        isFavorite: ln.isFavorite || false,
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

  const handleToggleFavorite = async (nameId: string) => {
    // Optimistic update
    setLikedNames(prev => prev.map(n =>
      n.id === nameId ? { ...n, isFavorite: !n.isFavorite } : n
    ));

    if (token) {
      try {
        await toggleFavoriteMutation({ token, nameId });
      } catch (e) {
        console.log('Error toggling favorite', e);
        // Revert on error
        setLikedNames(prev => prev.map(n =>
          n.id === nameId ? { ...n, isFavorite: !n.isFavorite } : n
        ));
      }
    }
  };

  const getGradientColors = (gender: string) => {
    if (gender === 'boy') return [theme.colors.boyBlue, '#3B82F6'] as const;
    if (gender === 'girl') return [theme.colors.girlPink, '#EC4899'] as const;
    return [theme.colors.neutralBeige, '#E8C547'] as const;
  };

  // Get unique languages from liked names
  const availableLanguages = ['all', ...Array.from(new Set(likedNames.map(n => n.language)))].sort();

  // Apply filters
  const filteredNames = likedNames.filter(name => {
    if (genderFilter !== 'all' && name.gender !== genderFilter) return false;
    if (languageFilter !== 'all' && name.language !== languageFilter) return false;
    if (showFavoritesOnly && !name.isFavorite) return false;
    return true;
  });

  const favoriteCount = likedNames.filter(n => n.isFavorite).length;

  const renderNameCard = ({ item }: { item: LikedNameWithFavorite }) => {
    const isMatch = matchedNameIds.has(item.id);

    return (
      <View style={styles.cardContainer}>
        <View ref={(r) => { if (r) cardRefs.current[item.id] = r; }} collapsable={false} style={{ flex: 1 }}>
        <LinearGradient
          colors={getGradientColors(item.gender)}
          style={styles.card}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {/* Favorite toggle */}
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => handleToggleFavorite(item.id)}
          >
            <Ionicons
              name={item.isFavorite ? "star" : "star-outline"}
              size={18}
              color={item.isFavorite ? '#F59E0B' : '#FFFFFF'}
            />
          </TouchableOpacity>

          {isMatch && (
            <View style={styles.matchBadge}>
              <Ionicons name="heart" size={12} color="#FFFFFF" />
              <Text style={styles.matchBadgeText}>MATCH</Text>
            </View>
          )}
          {/* Share button */}
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => handleShareName(item)}
          >
            <Ionicons name="share-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Delete button */}
          <TouchableOpacity
            style={styles.deleteCardButton}
            onPress={() => handleDeleteName(item)}
          >
            <Ionicons name="trash-outline" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          <View style={styles.cardContent}>
            <Text style={styles.cardName}>{item.name}</Text>
            {surname ? (
              <Text style={styles.cardSurname}>{surname}</Text>
            ) : null}
            <Text style={styles.cardGender}>{item.gender.toUpperCase()}</Text>
            <View style={styles.cardInfo}>
              <Text style={styles.cardMeaning} numberOfLines={2}>{item.meaning}</Text>
              <Text style={styles.cardOrigin}>{item.origin}</Text>
            </View>
          </View>
        </LinearGradient>
        </View>
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
        {likedNames.length > 0 ? (
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              Alert.alert(
                'Manage Names',
                'What would you like to do?',
                [
                  { text: 'Cancel', style: 'cancel' },
                  ...(favoriteCount > 0 ? [{ text: 'Clear All Favorites', onPress: handleClearAllFavorites }] : []),
                  { text: 'Clear All Liked Names', style: 'destructive' as const, onPress: handleClearAllLiked },
                ]
              );
            }}
          >
            <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 24 }} />
        )}
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

      {/* Favorites summary */}
      {favoriteCount > 0 && (
        <View style={styles.favoritesSection}>
          <Ionicons name="star" size={24} color="#F59E0B" />
          <Text style={styles.favoritesSectionText}>
            {favoriteCount} {favoriteCount === 1 ? 'favorite' : 'favorites'}
          </Text>
        </View>
      )}

      {/* Filters row */}
      <View style={styles.filterBar}>
        {/* Gender dropdown */}
        <View style={{ position: 'relative', zIndex: 20 }}>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => { setShowGenderDropdown(!showGenderDropdown); setShowLanguageDropdown(false); }}
          >
            <Ionicons name="male-female-outline" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
            <Text style={styles.dropdownText}>
              {genderFilter === 'all' ? 'All Genders' : genderFilter === 'unisex' ? 'Neutral' : genderFilter.charAt(0).toUpperCase() + genderFilter.slice(1)}
            </Text>
            <Ionicons name="chevron-down" size={14} color={theme.colors.grey} />
          </TouchableOpacity>
          {showGenderDropdown && (
            <View style={styles.dropdownMenu}>
              {(['all', 'boy', 'girl', 'unisex'] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  style={[styles.dropdownItem, genderFilter === g && styles.dropdownItemActive]}
                  onPress={() => { setGenderFilter(g); setShowGenderDropdown(false); }}
                >
                  <Text style={[styles.dropdownItemText, genderFilter === g && styles.dropdownItemTextActive]}>
                    {g === 'all' ? 'All Genders' : g === 'unisex' ? 'Neutral' : g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Language dropdown */}
        {availableLanguages.length > 2 && (
          <View style={{ position: 'relative', zIndex: 20 }}>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => { setShowLanguageDropdown(!showLanguageDropdown); setShowGenderDropdown(false); }}
            >
              <Ionicons name="globe-outline" size={14} color={theme.colors.primary} style={{ marginRight: 4 }} />
              <Text style={styles.dropdownText}>
                {languageFilter === 'all' ? 'All Languages' : languageFilter}
              </Text>
              <Ionicons name="chevron-down" size={14} color={theme.colors.grey} />
            </TouchableOpacity>
            {showLanguageDropdown && (
              <View style={[styles.dropdownMenu, { maxHeight: 250 }]}>
                {availableLanguages.map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.dropdownItem, languageFilter === lang && styles.dropdownItemActive]}
                    onPress={() => { setLanguageFilter(lang); setShowLanguageDropdown(false); }}
                  >
                    <Text style={[styles.dropdownItemText, languageFilter === lang && styles.dropdownItemTextActive]}>
                      {lang === 'all' ? 'All Languages' : lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Favorites toggle */}
        <TouchableOpacity
          style={[styles.favoritesChip, showFavoritesOnly && styles.favoritesChipActive]}
          onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
        >
          <Ionicons name="star" size={12} color={showFavoritesOnly ? '#F59E0B' : theme.colors.grey} />
          <Text style={styles.favoritesChipText}>Favs</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {filteredNames.length > 0 ? (
        <FlatList
          data={filteredNames}
          renderItem={renderNameCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          columnWrapperStyle={styles.row}
        />
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="heart-outline" size={64} color={theme.colors.grey} />
          <Text style={styles.emptyText}>
            {likedNames.length > 0 ? 'No names match this filter' : 'No liked names yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {likedNames.length > 0 ? 'Try changing the filter' : 'Start swiping to add your favorites!'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};
