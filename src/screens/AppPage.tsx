
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar, Alert, TextInput, Image, Modal, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

import { CardStack } from '../components/CardStack';
import { FavoriteBurst } from '../components/FavoriteBurst';
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
  const [firstLetter, setFirstLetter] = useState<string | null>(null);
  const [deckHeight, setDeckHeight] = useState<number | undefined>(undefined);
  // Short screens (720x1280-class, ~640dp tall) cannot fit the full chrome plus
  // a usable card. Give the deck its space back by tightening the action row and
  // dropping the two footer counters, which are the most expendable rows here.
  const { height: viewportHeight } = useWindowDimensions();
  const isShort = viewportHeight < 700;

  const [surname, setSurname] = useState('');
  const [firstName, setFirstName] = useState('');
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [inviteVisible, setInviteVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [languagePickerVisible, setLanguagePickerVisible] = useState(false);
  const [letterPickerVisible, setLetterPickerVisible] = useState(false);
  const [favBurstKey, setFavBurstKey] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  // Convex mutations
  const likeNameMutation = useMutation(api.names.likeName);
  const unlikeNameMutation = useMutation(api.names.unlikeName);
  const likeAndFavoriteMutation = useMutation(api.names.likeAndFavorite);

  // Convex queries
  const convexLikedNames = useQuery(
    api.names.getLikedNames,
    token ? { token } : "skip"
  );

  // Weekly trending list from the server; cached in AsyncStorage so a
  // previously-online user keeps last week's list when offline. When neither
  // is available the bundled popularity flags take over (see getRandomNames).
  const serverTrending = useQuery(api.trending.getTrending, {});
  const [cachedTrending, setCachedTrending] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem('bumpmatch_trending_cache')
      .then((json) => { if (json) setCachedTrending(JSON.parse(json)); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (serverTrending && serverTrending.length > 0) {
      const names = serverTrending.map((t: any) => t.name);
      setCachedTrending(names);
      AsyncStorage.setItem('bumpmatch_trending_cache', JSON.stringify(names)).catch(() => {});
    }
  }, [serverTrending]);

  const trendingNameSet = useMemo(() => {
    const source = serverTrending && serverTrending.length > 0
      ? serverTrending.map((t: any) => t.name)
      : cachedTrending;
    return new Set<string>(source.map((n: string) => n.toLowerCase()));
  }, [serverTrending, cachedTrending]);
  // Note: matchedNames and partnerLikedNames removed — matches only visible in Partner section

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

  useEffect(() => {
    loadNames();
  }, [genderFilter, languageFilter, meaningSearch, popularOnly, celebrityOnly, firstLetter]);

  const loadProfile = async () => {
    try {
      // Try to get from auth context first
      if (user) {
        setSurname(user.surname);
        setFirstName(user.firstName || '');
        return;
      }

      // Fallback to AsyncStorage
      const json = await AsyncStorage.getItem('bumpmatch_user_profile');
      if (json) {
        const profile = JSON.parse(json);
        setSurname(profile.surname);
        setFirstName(profile.firstName || '');
        if (profile.dueDate) setDueDate(profile.dueDate);
      }
    } catch (e) {
      console.log('Error loading profile', e);
    }
  };

  // Keep name state in sync once the server user resolves (it is null on the
  // first frames, and can refresh mid-session) — without this the greeting
  // stays on whatever the AsyncStorage snapshot held.
  useEffect(() => {
    if (user) {
      setSurname(user.surname);
      setFirstName(user.firstName || '');
    }
  }, [user]);

  // A partner invite opened before signup is parked in AsyncStorage — surface
  // it as soon as the user is authenticated (PartnerScreen consumes the code).
  useEffect(() => {
    if (!token) return;
    AsyncStorage.getItem('bumpmatch_pending_invite')
      .then((code) => {
        if (code) navigation.navigate('Partner');
      })
      .catch(() => {});
  }, [token]);

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

    const newNames = getRandomNames(20, {
      gender: genderFilter,
      language: languageFilter,
      excludeNames,
      meaningSearch: meaningSearch || undefined,
      popularOnly,
      celebrityOnly,
      firstLetter: firstLetter || undefined,
      trendingNameSet,
    });

    setNames(newNames);
    setCardHistory([]);
  }, [genderFilter, languageFilter, meaningSearch, popularOnly, celebrityOnly, firstLetter, swipedNameStrings, trendingNameSet]);

  // Rebuild the deck when fresh trending data lands — but only while the
  // Trending filter is active, so a background refresh never resets a deck
  // the user is mid-swipe on.
  useEffect(() => {
    if (popularOnly) {
      loadNames();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trendingNameSet]);

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

  const handleFavoriteFromCard = async (name: BabyName) => {
    // Star button on the swipe card OR swipe-up: like + favourite in one atomic mutation.
    setFavBurstKey(k => k + 1); // trigger the celebratory burst
    const updated = [...likedNames, name];
    setLikedNames(updated);
    saveLikedNames(updated);
    setCardHistory([...cardHistory, name]);
    setNames(prev => prev.filter(n => n.id !== name.id));

    const newSwiped = new Set(swipedNameStrings);
    newSwiped.add(name.name.toLowerCase());
    setSwipedNameStrings(newSwiped);
    persistSwipedNames(newSwiped);

    if (token) {
      try {
        await likeAndFavoriteMutation({
          token,
          nameId: name.id,
          name: name.name,
          gender: name.gender,
          origin: name.origin,
          meaning: name.meaning,
          language: name.language,
        });
      } catch (e) {
        console.log('Error favouriting from card', e);
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
      meaningSearch: meaningSearch || undefined,
      popularOnly,
      celebrityOnly,
      firstLetter: firstLetter || undefined,
      trendingNameSet,
    });
    setNames(prev => [...prev, ...moreNames]);
  };

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
      fontFamily: theme.typography.fontFamilyDisplay,
      color: theme.colors.primary,
      fontSize: 20
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
      backgroundColor: theme.brand.pinkSoft,
      borderRadius: theme.borderRadius.round,
    },
    filterText: {
      includeFontPadding: false,
      fontFamily: theme.typography.fontFamilyMedium,
      marginRight: 4,
      color: theme.brand.pinkDeep,
    },
    genderBar: {
      flexDirection: 'row',
      justifyContent: 'center',
      paddingHorizontal: theme.spacing.m,
      paddingBottom: theme.spacing.s,
    },
    genderSwitch: {
      flexDirection: 'row',
      backgroundColor: theme.brand.pinkSoft,
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
      shadowOpacity: 1,
      shadowRadius: 2,
      elevation: 2,
    },
    genderText: {
      includeFontPadding: false,
      fontSize: 11,
      color: theme.colors.textDim,
      fontFamily: theme.typography.fontFamily,
    },
    genderTextActive: {
      color: theme.brand.pinkDeep,
      fontFamily: theme.typography.fontFamilySemiBold,
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
      // Android: kill the TextInput's default vertical padding and Poppins'
      // extra font padding, which pushed the text down and clipped its top half.
      paddingVertical: 0,
      textAlignVertical: 'center',
      includeFontPadding: false,
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
      backgroundColor: theme.brand.yellowSoft,
      borderColor: theme.brand.yellowDeep,
    },
    popularToggleText: {
      includeFontPadding: false,
      fontSize: 11,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
      marginLeft: 4,
    },
    letterPickerScroll: {
      flexGrow: 0,
      paddingBottom: theme.spacing.s,
    },
    letterPickerContent: {
      paddingHorizontal: theme.spacing.m,
      alignItems: 'center',
    },
    letterModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(74, 68, 89, 0.45)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },
    letterModalCard: {
      backgroundColor: theme.colors.card,
      borderRadius: theme.borderRadius.l,
      padding: theme.spacing.l,
      width: '100%',
      maxWidth: 360,
    },
    letterModalTitle: {
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: theme.typography.sizes.h3,
      color: theme.colors.text,
      textAlign: 'center',
      marginBottom: theme.spacing.m,
    },
    letterGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
    letterPill: {
      minWidth: 38,
      paddingVertical: 8,
      paddingHorizontal: 10,
      marginRight: 8,
      marginBottom: 8,
      borderRadius: theme.borderRadius.round,
      backgroundColor: theme.brand.pinkSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    letterPillActive: {
      backgroundColor: theme.colors.primary,
    },
    letterPillText: {
      fontSize: 12,
      fontFamily: theme.typography.fontFamily,
      color: theme.colors.text,
    },
    letterPillTextActive: {
      color: theme.colors.textLight,
      fontFamily: theme.typography.fontFamilySemiBold,
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
      fontFamily: theme.typography.fontFamilyDisplay,
      fontSize: 22,
      color: theme.colors.text,
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
      paddingVertical: isShort ? theme.spacing.s : theme.spacing.l,
    },
    actionBtn: {
      width: isShort ? 50 : 60,
      height: isShort ? 50 : 60,
      borderRadius: isShort ? 25 : 30,
      backgroundColor: theme.colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: theme.spacing.m,
      shadowColor: theme.colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 4,
    },
    rewindBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
    },
    dislikeBtn: {},
    likeBtn: {},
    footerText: {
      includeFontPadding: false,
      textAlign: 'center',
      fontSize: 12,
      color: theme.colors.grey,
      marginBottom: theme.spacing.s,
      paddingBottom: theme.spacing.m,
      fontFamily: theme.typography.fontFamily
    },
  }), [theme, isShort]);

  return (
    <>
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      {/* Header */}
      <View style={styles.header}>
        {user?.partnerId ? (
          <View style={styles.iconButton} />
        ) : (
          <TouchableOpacity style={styles.iconButton} onPress={() => setInviteVisible(true)}>
            <Ionicons name="person-add-outline" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
        )}

        <View style={styles.logoContainer}>
          <LogoText size="small" showTagline={false} />
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Ionicons name="menu-outline" size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      {/* Pregnancy tracker */}
      {dueDate && <PregnancyTracker dueDate={dueDate} />}

      {/* Filter Bar: language + first-letter dropdowns */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.languageButton} onPress={() => setLanguagePickerVisible(true)}>
          <Ionicons name="globe-outline" size={16} color={theme.brand.pinkDeep} style={{ marginRight: 4 }} />
          <Text style={styles.filterText} maxFontSizeMultiplier={1.3}>
            {languageDisplayText === 'All' ? 'All Languages' : languageDisplayText}
          </Text>
          <Ionicons name="chevron-down" size={16} color={theme.brand.pinkDeep} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.languageButton} onPress={() => setLetterPickerVisible(true)}>
          <Ionicons name="text-outline" size={16} color={theme.brand.pinkDeep} style={{ marginRight: 4 }} />
          <Text style={styles.filterText} maxFontSizeMultiplier={1.3}>{firstLetter ? `Letter: ${firstLetter}` : 'A–Z'}</Text>
          <Ionicons name="chevron-down" size={16} color={theme.brand.pinkDeep} />
        </TouchableOpacity>
      </View>

      {/* Gender switch row */}
      <View style={styles.genderBar}>
        <View style={styles.genderSwitch}>
          <TouchableOpacity onPress={() => setGenderFilter('boy')} style={[styles.genderOption, genderFilter === 'boy' && styles.genderActive]}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.genderText, genderFilter === 'boy' && styles.genderTextActive]}>Boy</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGenderFilter('girl')} style={[styles.genderOption, genderFilter === 'girl' && styles.genderActive]}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.genderText, genderFilter === 'girl' && styles.genderTextActive]}>Girl</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGenderFilter('unisex')} style={[styles.genderOption, genderFilter === 'unisex' && styles.genderActive]}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.genderText, genderFilter === 'unisex' && styles.genderTextActive]}>Neutral</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setGenderFilter('all')} style={[styles.genderOption, genderFilter === 'all' && styles.genderActive]}>
            <Text maxFontSizeMultiplier={1.3} style={[styles.genderText, genderFilter === 'all' && styles.genderTextActive]}>All</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Popular Filter */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          maxFontSizeMultiplier={1.3}
          placeholder="Search by meaning..."
          placeholderTextColor={theme.colors.grey}
          value={meaningSearch}
          onChangeText={setMeaningSearch}
        />
        <TouchableOpacity
          style={[styles.popularToggle, popularOnly && styles.popularToggleActive]}
          onPress={() => { setPopularOnly(!popularOnly); if (!popularOnly) setCelebrityOnly(false); }}
        >
          <Image
            source={require('../../assets/brand/characters/crownie.png')}
            style={{ width: 22, height: 22, marginRight: 5, opacity: popularOnly ? 1 : 0.5 }}
            resizeMode="contain"
          />
          <Text style={styles.popularToggleText} maxFontSizeMultiplier={1.3}>Trending</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.popularToggle, celebrityOnly && { backgroundColor: theme.brand.pinkSoft, borderColor: theme.brand.pinkDeep }]}
          onPress={() => { setCelebrityOnly(!celebrityOnly); if (!celebrityOnly) setPopularOnly(false); }}
        >
          <Image
            source={require('../../assets/brand/icons/rainbow.png')}
            style={{ width: 24, height: 15, marginRight: 5, opacity: celebrityOnly ? 1 : 0.5 }}
            resizeMode="contain"
          />
          <Text style={styles.popularToggleText} maxFontSizeMultiplier={1.3}>Celebrity</Text>
        </TouchableOpacity>
      </View>

      {/* Card Stack */}
      <View
        style={styles.stackContainer}
        onLayout={(e) => {
          // The deck is flex:1, so its real height depends on how much the
          // header, filters and action buttons leave behind — which varies with
          // screen height and font scale. Measure it and let the card size
          // itself to fit, instead of assuming a fixed share of the viewport.
          const h = Math.round(e.nativeEvent.layout.height);
          setDeckHeight((prev) => (Math.abs((prev ?? 0) - h) > 1 ? h : prev));
        }}
      >
        {names.length > 0 ? (
          <CardStack
            names={names}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            onEmpty={handleEmpty}
            onFavorite={handleFavoriteFromCard}
            onSwipeUp={handleFavoriteFromCard}
            availableHeight={deckHeight}
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
          <Ionicons name="arrow-undo" size={22} color={theme.brand.yellowDeep} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.dislikeBtn]} onPress={() => {
          if (names.length > 0) handleSwipeLeft(names[0]);
        }}>
          <Ionicons name="close" size={32} color={theme.colors.dislike} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => {
          if (names.length > 0) handleSwipeRight(names[0]);
        }}>
          <Ionicons name="heart" size={32} color={theme.colors.like} />
        </TouchableOpacity>
      </View>

      {!isShort && (
        <Text style={styles.footerText} maxFontSizeMultiplier={1.3}>
          {likedNames.length + dislikedNames.length} names explored - {likedNames.length} liked
        </Text>
      )}
      {!isShort && (
        <Text style={styles.footerText} maxFontSizeMultiplier={1.3}>
          Welcome back, {user?.firstName?.trim() || firstName.trim() || 'there'}!
        </Text>
      )}

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

      {/* First-letter picker */}
      <Modal
        visible={letterPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLetterPickerVisible(false)}
      >
        <TouchableOpacity
          style={styles.letterModalOverlay}
          activeOpacity={1}
          onPress={() => setLetterPickerVisible(false)}
        >
          <View style={styles.letterModalCard}>
            <Text style={styles.letterModalTitle}>Filter by first letter</Text>
            <View style={styles.letterGrid}>
              <TouchableOpacity
                style={[styles.letterPill, firstLetter === null && styles.letterPillActive]}
                onPress={() => { setFirstLetter(null); setLetterPickerVisible(false); }}
              >
                <Text style={[styles.letterPillText, firstLetter === null && styles.letterPillTextActive]}>All</Text>
              </TouchableOpacity>
              {Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i)).map((letter) => {
                const isActive = firstLetter === letter;
                return (
                  <TouchableOpacity
                    key={letter}
                    style={[styles.letterPill, isActive && styles.letterPillActive]}
                    onPress={() => { setFirstLetter(isActive ? null : letter); setLetterPickerVisible(false); }}
                  >
                    <Text style={[styles.letterPillText, isActive && styles.letterPillTextActive]}>{letter}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

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
    {/* Celebratory favourite burst — rendered at root so it sits in front of everything */}
    <FavoriteBurst playKey={favBurstKey} />
    </>
  );
};
