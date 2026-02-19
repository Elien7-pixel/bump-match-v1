
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

import { CardStack } from '../components/CardStack';
import { BabyName } from '../models/BabyName';
import { getRandomNames } from '../data/babyNames';
import { PartnerInviteDialog } from '../components/PartnerInviteDialog';
import { MenuDrawer } from '../components/MenuDrawer';
import { LanguagePickerModal } from '../components/LanguagePickerModal';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LogoText } from '../components/Logo';

export const AppPage = () => {
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();
  const { user, token } = useAuth();

  const [names, setNames] = useState<BabyName[]>([]);
  const [cardHistory, setCardHistory] = useState<BabyName[]>([]);
  const [likedNames, setLikedNames] = useState<BabyName[]>([]);
  const [dislikedNames, setDislikedNames] = useState<BabyName[]>([]);

  const [genderFilter, setGenderFilter] = useState<'boy' | 'unisex' | 'girl'>('boy');
  const [languageFilter, setLanguageFilter] = useState<string>('All');

  const [surname, setSurname] = useState('');
  const [inviteVisible, setInviteVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);

  // Convex mutations
  const likeNameMutation = useMutation(api.names.likeName);
  const unlikeNameMutation = useMutation(api.names.unlikeName);

  // Convex queries
  const convexLikedNames = useQuery(
    api.names.getLikedNames,
    token ? { token } : "skip"
  );
  const matchedNames = useQuery(
    api.names.getMatchedNames,
    token ? { token } : "skip"
  );

  useEffect(() => {
    loadProfile();
    loadLikedNames();
  }, []);

  // Sync liked names from Convex
  useEffect(() => {
    if (convexLikedNames !== undefined) {
      if (convexLikedNames.length > 0) {
        const formattedNames: BabyName[] = convexLikedNames.map((ln: any) => ({
          id: ln.id,
          name: ln.name,
          gender: ln.gender,
          origin: ln.origin,
          meaning: ln.meaning,
          language: ln.language,
        }));
        setLikedNames(formattedNames);
        AsyncStorage.setItem('bumpmatch_liked_names', JSON.stringify(formattedNames));
      } else {
        // New user or no liked names - set to empty
        setLikedNames([]);
        AsyncStorage.setItem('bumpmatch_liked_names', JSON.stringify([]));
      }
    }
  }, [convexLikedNames]);

  useEffect(() => {
    loadNames();
  }, [genderFilter, languageFilter]);

  const loadProfile = async () => {
    try {
      // Try to get from auth context first
      if (user) {
        setSurname(user.surname);
        return;
      }

      // Fallback to AsyncStorage
      const json = await AsyncStorage.getItem('bumpmatch_user_profile');
      if (json) {
        const profile = JSON.parse(json);
        setSurname(profile.surname);
      }
    } catch (e) {
      console.log('Error loading profile', e);
    }
  };

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

  const saveLikedNames = async (names: BabyName[]) => {
    try {
      await AsyncStorage.setItem('bumpmatch_liked_names', JSON.stringify(names));
    } catch (e) {
      console.log('Error saving liked names', e);
    }
  };

  const loadNames = useCallback(() => {
    const newNames = getRandomNames(20, {
      gender: genderFilter,
      language: languageFilter
    });
    setNames(newNames);
    setCardHistory([]);
  }, [genderFilter, languageFilter]);

  const handleSwipeRight = async (name: BabyName) => {
    const updated = [...likedNames, name];
    setLikedNames(updated);
    saveLikedNames(updated);
    setCardHistory([...cardHistory, name]);
    setNames(prev => prev.filter(n => n.id !== name.id));

    // Save to Convex if authenticated
    if (token) {
      try {
        await likeNameMutation({
          token,
          nameId: name.id,
          name: name.name,
          gender: name.gender,
          origin: name.origin,
          meaning: name.meaning,
          language: name.language,
        });
      } catch (e) {
        console.log('Error saving like to Convex', e);
      }
    }
  };

  const handleSwipeLeft = (name: BabyName) => {
    setDislikedNames([...dislikedNames, name]);
    setCardHistory([...cardHistory, name]);
    setNames(prev => prev.filter(n => n.id !== name.id));
  };

  const handleRewind = async () => {
    if (cardHistory.length === 0) return;
    const lastCard = cardHistory[cardHistory.length - 1];

    setCardHistory(prev => prev.slice(0, -1));

    // Check if was liked
    const wasLiked = likedNames.some(n => n.id === lastCard.id);

    const updatedLiked = likedNames.filter(n => n.id !== lastCard.id);
    setLikedNames(updatedLiked);
    saveLikedNames(updatedLiked);
    setDislikedNames(prev => prev.filter(n => n.id !== lastCard.id));
    setNames(prev => [lastCard, ...prev]);

    // Remove from Convex if was liked
    if (wasLiked && token) {
      try {
        await unlikeNameMutation({
          token,
          nameId: lastCard.id,
        });
      } catch (e) {
        console.log('Error removing like from Convex', e);
      }
    }
  };

  const handleEmpty = () => {
    const moreNames = getRandomNames(10, {
      gender: genderFilter,
      language: languageFilter,
      excludeIds: [...likedNames, ...dislikedNames].map(n => n.id)
    });
    setNames(prev => [...prev, ...moreNames]);
  };

  // Check for new matches
  const matchCount = matchedNames?.length || 0;

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
      paddingBottom: theme.spacing.s,
    },
    iconButton: {
      padding: theme.spacing.s,
    },
    logoContainer: {
      alignItems: 'center',
    },
    logoText: {
      fontFamily: theme.typography.fontFamilyBold,
      color: theme.colors.primary,
      fontSize: 20
    },
    matchBadge: {
      position: 'absolute',
      top: 0,
      right: 0,
      backgroundColor: '#10B981',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    matchBadgeText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontFamily: theme.typography.fontFamilyBold,
    },
    filterBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.m,
    },
    languageButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.s,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    filterText: {
      fontFamily: theme.typography.fontFamily,
      marginRight: 4,
      color: theme.colors.text,
    },
    genderSwitch: {
      flexDirection: 'row',
      backgroundColor: theme.colors.border,
      borderRadius: theme.borderRadius.round,
      padding: 2,
    },
    genderOption: {
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: theme.borderRadius.round,
    },
    genderActive: {
      backgroundColor: theme.colors.card,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 1,
      elevation: 2,
    },
    genderText: {
      fontSize: 12,
      color: theme.colors.textDim,
      fontFamily: theme.typography.fontFamily,
    },
    genderTextActive: {
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamilyBold,
    },
    stackContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center'
    },
    emptyText: {
      fontFamily: theme.typography.fontFamilyBold,
      fontSize: 20,
      color: theme.colors.grey,
      marginBottom: 10
    },
    retryText: {
      color: theme.colors.primary,
      fontFamily: theme.typography.fontFamilyBold
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: theme.spacing.l,
    },
    actionBtn: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: theme.spacing.m,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3.84,
      elevation: 5,
    },
    rewindBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    dislikeBtn: {},
    likeBtn: {},
    footerText: {
      textAlign: 'center',
      fontSize: 12,
      color: theme.colors.grey,
      marginBottom: theme.spacing.s,
      paddingBottom: theme.spacing.m,
      fontFamily: theme.typography.fontFamily
    },
    matchIndicator: {
      textAlign: 'center',
      fontSize: 14,
      color: '#10B981',
      fontFamily: theme.typography.fontFamilyBold,
      marginBottom: theme.spacing.s,
    }
  }), [theme]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setInviteVisible(true)}>
          <Ionicons name="person-add-outline" size={24} color={theme.colors.primary} />
          {matchCount > 0 && (
            <View style={styles.matchBadge}>
              <Text style={styles.matchBadgeText}>{matchCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <LogoText size="small" />
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu-outline" size={24} color={theme.colors.grey} />
        </TouchableOpacity>
      </View>

      {/* Match indicator */}
      {matchCount > 0 && (
        <Text style={styles.matchIndicator}>
          {matchCount} {matchCount === 1 ? 'match' : 'matches'} with your partner!
        </Text>
      )}

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.languageButton} onPress={() => setLanguagePickerVisible(true)}>
          <Text style={[styles.filterText, { color: theme.colors.text }]}>{languageFilter}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.genderSwitch}>
          <TouchableOpacity onPress={() => setGenderFilter('boy')} style={[styles.genderOption, genderFilter === 'boy' && styles.genderActive]}>
            <Text style={[styles.genderText, genderFilter === 'boy' && styles.genderTextActive]}>Boy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGenderFilter('unisex')} style={[styles.genderOption, genderFilter === 'unisex' && styles.genderActive]}>
            <Text style={[styles.genderText, genderFilter === 'unisex' && styles.genderTextActive]}>Neutral</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGenderFilter('girl')} style={[styles.genderOption, genderFilter === 'girl' && styles.genderActive]}>
            <Text style={[styles.genderText, genderFilter === 'girl' && styles.genderTextActive]}>Girl</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Card Stack */}
      <View style={styles.stackContainer}>
        {names.length > 0 ? (
          <CardStack
            names={names}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            onEmpty={handleEmpty}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No more names!</Text>
            <TouchableOpacity onPress={handleEmpty}>
              <Text style={styles.retryText}>Load More</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={[styles.actionBtn, styles.rewindBtn]} onPress={handleRewind}>
          <Ionicons name="reload" size={24} color="#F59E0B" />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.dislikeBtn]} onPress={() => {
          if (names.length > 0) handleSwipeLeft(names[0]);
        }}>
          <Ionicons name="close" size={32} color={theme.colors.grey} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => {
          if (names.length > 0) handleSwipeRight(names[0]);
        }}>
          <Ionicons name="heart" size={32} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        {likedNames.length + dislikedNames.length} names explored - {likedNames.length} liked
      </Text>
      <Text style={styles.footerText}>
        Welcome back, {user?.firstName || surname || 'Guest'}!
      </Text>

      <PartnerInviteDialog
        visible={inviteVisible}
        onClose={() => setInviteVisible(false)}
        surname={user?.surname || surname}
      />

      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={(screen) => {
          if (screen === 'Landing') {
            navigation.reset({
              index: 0,
              routes: [{ name: 'Landing' }],
            });
          } else {
            navigation.navigate(screen as never);
          }
        }}
      />

      <LanguagePickerModal
        visible={languagePickerVisible}
        onClose={() => setLanguagePickerVisible(false)}
        currentLanguage={languageFilter}
        onSelectLanguage={setLanguageFilter}
      />
    </SafeAreaView>
  );
};
