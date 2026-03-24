
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery, useAction } from 'convex/react';
import { api } from '../../convex/_generated/api';

import { CardStack } from '../components/CardStack';
import { BabyName } from '../models/BabyName';
import { getRandomNames } from '../data/babyNames';
import { PartnerInviteDialog } from '../components/PartnerInviteDialog';
import { MenuDrawer } from '../components/MenuDrawer';
import { LanguagePickerModal } from '../components/LanguagePickerModal';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { LogoText } from '../components/Logo';
import { OnboardingTutorial } from '../components/OnboardingTutorial';
import { PregnancyTracker } from '../components/PregnancyTracker';
import { SubmitNameModal } from '../components/SubmitNameModal';

export const AppPage = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { theme, isDark } = useTheme();
  const { user, token } = useAuth();

  const [names, setNames] = useState<BabyName[]>([]);
  const [cardHistory, setCardHistory] = useState<BabyName[]>([]);
  const [likedNames, setLikedNames] = useState<BabyName[]>([]);
  const [dislikedNames, setDislikedNames] = useState<BabyName[]>([]);

  // Global sets for cross-view exclusion (by name string)
  const [swipedNameStrings, setSwipedNameStrings] = useState<Set<string>>(new Set());

  const [genderFilter, setGenderFilter] = useState<'boy' | 'unisex' | 'girl' | 'all'>('boy');
  const [languageFilter, setLanguageFilter] = useState<string[]>(['All']);
  const [meaningSearch, setMeaningSearch] = useState('');
  const [popularOnly, setPopularOnly] = useState(false);
  const [celebrityOnly, setCelebrityOnly] = useState(false);

  const [surname, setSurname] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDebounceTimer, setSearchDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Convex mutations & actions
  const likeNameMutation = useMutation(api.names.likeName);
  const unlikeNameMutation = useMutation(api.names.unlikeName);
  const vectorSearch = useAction(api.search.searchNames);

  // Convex queries
  const convexLikedNames = useQuery(
    api.names.getLikedNames,
    token ? { token } : "skip"
  );
  const matchedNames = useQuery(
    api.names.getMatchedNames,
    token ? { token } : "skip"
  );
  // Partner's liked names for prioritization
  const partnerLikedNames = useQuery(
    api.names.getPartnerLikedNames,
    token && user?.partnerId ? { token } : "skip"
  );

  useEffect(() => {
    loadProfile();
    loadLikedNames();
    loadSwipedNames();
    if (route.params?.fromSignUp) {
      setShowTutorial(true);
    }
  }, []);

  const dismissTutorial = () => {
    setShowTutorial(false);
  };

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

  // Debounced vector search when typing
  useEffect(() => {
    if (searchDebounceTimer) clearTimeout(searchDebounceTimer);

    if (meaningSearch.trim().length >= 2) {
      const timer = setTimeout(() => {
        performVectorSearch(meaningSearch.trim());
      }, 500);
      setSearchDebounceTimer(timer);
    } else {
      loadNames();
    }

    return () => { if (searchDebounceTimer) clearTimeout(searchDebounceTimer); };
  }, [meaningSearch]);

  useEffect(() => {
    if (!meaningSearch.trim()) loadNames();
  }, [genderFilter, languageFilter, popularOnly, celebrityOnly]);

  const performVectorSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const results = await vectorSearch({
        query,
        gender: genderFilter !== 'all' ? genderFilter : undefined,
        limit: 20,
      });

      // Map vector results back to BabyName objects from static data
      const resultNameIds = new Set(results.map((r: any) => r.nameId));
      const allNames = getRandomNames(1000, {}); // get all names
      const matched = allNames
        .filter((n) => resultNameIds.has(n.id))
        .filter((n) => !swipedNameStrings.has(n.name.toLowerCase()));

      // Sort by vector search order
      const orderMap = new Map(results.map((r: any, i: number) => [r.nameId, i]));
      matched.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));

      setNames(matched.length > 0 ? matched : []);
      setCardHistory([]);
    } catch (e) {
      console.log('Vector search failed, falling back to local:', e);
      loadNames();
    } finally {
      setIsSearching(false);
    }
  };

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
        if (profile.dueDate) setDueDate(profile.dueDate);
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

  const loadSwipedNames = async () => {
    try {
      const json = await AsyncStorage.getItem('bumpmatch_swiped_names');
      if (json) {
        setSwipedNameStrings(new Set(JSON.parse(json)));
      }
    } catch (e) {
      console.log('Error loading swiped names', e);
    }
  };

  const persistSwipedNames = async (names: Set<string>) => {
    try {
      await AsyncStorage.setItem('bumpmatch_swiped_names', JSON.stringify([...names]));
    } catch (e) {
      console.log('Error saving swiped names', e);
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
    // Build exclude names from cross-view swiped set
    const excludeNames = [...swipedNameStrings];

    let newNames = getRandomNames(20, {
      gender: genderFilter,
      language: languageFilter,
      excludeNames,
      popularOnly,
      celebrityOnly,
    });

    // Partner prioritization: if partner is linked, sort names the partner has liked to the front
    if (partnerLikedNames && partnerLikedNames.length > 0) {
      const partnerNameSet = new Set(partnerLikedNames.map((n: any) => n.name.toLowerCase()));
      newNames.sort((a, b) => {
        const aPartner = partnerNameSet.has(a.name.toLowerCase()) ? 0 : 1;
        const bPartner = partnerNameSet.has(b.name.toLowerCase()) ? 0 : 1;
        return aPartner - bPartner;
      });
    }

    setNames(newNames);
    setCardHistory([]);
  }, [genderFilter, languageFilter, popularOnly, celebrityOnly, swipedNameStrings, partnerLikedNames]);

  const handleSwipeRight = async (name: BabyName) => {
    const updated = [...likedNames, name];
    setLikedNames(updated);
    saveLikedNames(updated);
    setCardHistory([...cardHistory, name]);
    setNames(prev => prev.filter(n => n.id !== name.id));

    // Track in cross-view exclusion set
    const newSwiped = new Set(swipedNameStrings);
    newSwiped.add(name.name.toLowerCase());
    setSwipedNameStrings(newSwiped);
    persistSwipedNames(newSwiped);

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

    // Track in cross-view exclusion set
    const newSwiped = new Set(swipedNameStrings);
    newSwiped.add(name.name.toLowerCase());
    setSwipedNameStrings(newSwiped);
    persistSwipedNames(newSwiped);
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

    // Remove from cross-view exclusion set
    const newSwiped = new Set(swipedNameStrings);
    newSwiped.delete(lastCard.name.toLowerCase());
    setSwipedNameStrings(newSwiped);
    persistSwipedNames(newSwiped);

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
    const excludeNames = [...swipedNameStrings];
    const moreNames = getRandomNames(10, {
      gender: genderFilter,
      language: languageFilter,
      excludeIds: [...likedNames, ...dislikedNames].map(n => n.id),
      excludeNames,
      popularOnly,
      celebrityOnly,
    });
    setNames(prev => [...prev, ...moreNames]);
  };

  // Check for new matches
  const matchCount = matchedNames?.length || 0;

  // Language filter display text
  const languageDisplayText = languageFilter.includes('All') || languageFilter.length === 0
    ? 'All'
    : languageFilter.length === 1
      ? languageFilter[0]
      : `${languageFilter.length} selected`;

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
      paddingBottom: theme.spacing.s,
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
      paddingHorizontal: 10,
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
      fontSize: 11,
      color: theme.colors.textDim,
      fontFamily: theme.typography.fontFamily,
    },
    genderTextActive: {
      color: theme.colors.text,
      fontFamily: theme.typography.fontFamilyBold,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.s,
      zIndex: 10,
    },
    searchInput: {
      flex: 1,
      height: 36,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.m,
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: theme.spacing.m,
      fontFamily: theme.typography.fontFamily,
      fontSize: 13,
      color: theme.colors.text,
    },
    popularToggle: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 10,
      marginLeft: theme.spacing.s,
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.round,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    popularToggleActive: {
      backgroundColor: '#FEF3C7',
      borderColor: '#F59E0B',
    },
    popularToggleText: {
      fontSize: 11,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
      marginLeft: 4,
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

      {/* Pregnancy tracker */}
      {dueDate && <PregnancyTracker dueDate={dueDate} />}

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.languageButton} onPress={() => setLanguagePickerVisible(true)}>
          <Ionicons name="globe-outline" size={16} color={theme.colors.primary} style={{ marginRight: 4 }} />
          <Text style={[styles.filterText, { color: theme.colors.text }]}>
            {languageDisplayText === 'All' ? 'All Languages' : languageDisplayText}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.colors.text} />
        </TouchableOpacity>

        <View style={styles.genderSwitch}>
          <TouchableOpacity onPress={() => setGenderFilter('boy')} style={[styles.genderOption, genderFilter === 'boy' && styles.genderActive]}>
            <Text style={[styles.genderText, genderFilter === 'boy' && styles.genderTextActive]}>Boy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGenderFilter('girl')} style={[styles.genderOption, genderFilter === 'girl' && styles.genderActive]}>
            <Text style={[styles.genderText, genderFilter === 'girl' && styles.genderTextActive]}>Girl</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGenderFilter('unisex')} style={[styles.genderOption, genderFilter === 'unisex' && styles.genderActive]}>
            <Text style={[styles.genderText, genderFilter === 'unisex' && styles.genderTextActive]}>Neutral</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGenderFilter('all')} style={[styles.genderOption, genderFilter === 'all' && styles.genderActive]}>
            <Text style={[styles.genderText, genderFilter === 'all' && styles.genderTextActive]}>All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Popular Filter */}
      <View style={styles.searchBar}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
          <TextInput
            style={[styles.searchInput, { flex: 1 }]}
            placeholder="Search names by meaning..."
            placeholderTextColor={theme.colors.grey}
            value={meaningSearch}
            onChangeText={setMeaningSearch}
          />
          {isSearching && (
            <Ionicons name="search" size={16} color={theme.colors.primary} style={{ position: 'absolute', right: 10 }} />
          )}
        </View>
        <TouchableOpacity
          style={[styles.popularToggle, popularOnly && styles.popularToggleActive]}
          onPress={() => { setPopularOnly(!popularOnly); if (!popularOnly) setCelebrityOnly(false); }}
        >
          <Ionicons name="star" size={14} color={popularOnly ? '#F59E0B' : theme.colors.grey} />
          <Text style={styles.popularToggleText}>Trending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.popularToggle, celebrityOnly && { backgroundColor: '#EC489920', borderColor: '#EC4899' }]}
          onPress={() => { setCelebrityOnly(!celebrityOnly); if (!celebrityOnly) setPopularOnly(false); }}
        >
          <Ionicons name="sparkles" size={14} color={celebrityOnly ? '#EC4899' : theme.colors.grey} />
          <Text style={styles.popularToggleText}>Celebrity</Text>
        </TouchableOpacity>
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
        onSuggestName={() => setShowSubmitModal(true)}
      />

      <LanguagePickerModal
        visible={languagePickerVisible}
        onClose={() => setLanguagePickerVisible(false)}
        selectedLanguages={languageFilter}
        onSelectLanguages={setLanguageFilter}
      />

      <OnboardingTutorial
        visible={showTutorial}
        onDismiss={dismissTutorial}
        onAddPartner={() => {
          dismissTutorial();
          setInviteVisible(true);
        }}
      />

      <SubmitNameModal
        visible={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
      />
    </SafeAreaView>
  );
};
