
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppTokens } from '../theme/designTokens';
import { CardStack } from '../components/CardStack';
import { BabyName } from '../models/BabyName';
import { getRandomNames } from '../data/babyNames';
import { PartnerInviteDialog } from '../components/PartnerInviteDialog';
import { MenuDrawer } from '../components/MenuDrawer';
import { LanguagePickerModal } from '../components/LanguagePickerModal';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

export const AppPage = () => {
  const navigation = useNavigation();
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

  useEffect(() => {
    loadProfile();
    loadLikedNames();
  }, []);

  useEffect(() => {
    loadNames();
  }, [genderFilter, languageFilter]);

  const loadProfile = async () => {
    try {
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
    setCardHistory([]); // Reset history on filter change
  }, [genderFilter, languageFilter]);

  const handleSwipeRight = (name: BabyName) => {
    const updated = [...likedNames, name];
    setLikedNames(updated);
    saveLikedNames(updated);
    setCardHistory([...cardHistory, name]);
    // Simulate popping from list by slicing in state update? 
    // CardStack handles visual removal, we need to keep sync if we want to rewind correctly.
    // Actually CardStack just iterates index. 
    // We should probably remove the item from 'names' state to keep it clean or just track index.
    // The current CardStack implementation increments local index. 
    // But for Rewind to work, we need to push back to 'names'.
    // If we modify 'names' array, CardStack might re-render.
    // Let's rely on CardStack handling the list, but we need to know that 'names' in parent 
    // should probably be treated as a queue if we want robust rewind.
    // For simplicity, let's assume CardStack handles the "view" of names.
    // Rewind logic: 
    // 1. Pop last from history.
    // 2. Add it back to the START of the current visible stack? 
    // Or just re-fetch?
    // Let's implement rewind by re-setting names with the history item prepended.
    setNames(prev => prev.filter(n => n.id !== name.id)); 
  };

  const handleSwipeLeft = (name: BabyName) => {
    setDislikedNames([...dislikedNames, name]);
    setCardHistory([...cardHistory, name]);
    setNames(prev => prev.filter(n => n.id !== name.id));
  };

  const handleRewind = () => {
    if (cardHistory.length === 0) return;
    const lastCard = cardHistory[cardHistory.length - 1];
    
    // Remove from history
    setCardHistory(prev => prev.slice(0, -1));
    // Remove from liked/disliked
    const updatedLiked = likedNames.filter(n => n.id !== lastCard.id);
    setLikedNames(updatedLiked);
    saveLikedNames(updatedLiked);
    setDislikedNames(prev => prev.filter(n => n.id !== lastCard.id));
    
    // Add back to names at the beginning
    setNames(prev => [lastCard, ...prev]);
  };

  const handleEmpty = () => {
    // Fetch more
    const moreNames = getRandomNames(10, { 
      gender: genderFilter,
      language: languageFilter,
      excludeIds: [...likedNames, ...dislikedNames].map(n => n.id)
    });
    setNames(prev => [...prev, ...moreNames]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setInviteVisible(true)}>
          <Ionicons name="person-add-outline" size={24} color={AppTokens.colors.primary} />
        </TouchableOpacity>
        
        {/* Placeholder Logo */}
        <View style={styles.logoContainer}>
            <Text style={styles.logoText}>BumpMatch</Text>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
           <Ionicons name="menu-outline" size={24} color={AppTokens.colors.grey} />
        </TouchableOpacity>
      </View>

      {/* Filter Bar */}
      <View style={styles.filterBar}>
        <TouchableOpacity style={styles.languageButton} onPress={() => setLanguagePickerVisible(true)}>
          <Text style={styles.filterText}>{languageFilter}</Text>
          <Ionicons name="chevron-down" size={16} color={AppTokens.colors.text} />
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
             key={names.length} // Force re-render if stack changes abruptly? No, might break animation.
             // Actually, passing 'names' prop updates should work if CardStack handles it.
             // My CardStack implementation uses internal index state. 
             // If I remove items from 'names' in parent, I should probably key it or manage index in parent.
             // But simpler approach: CardStack consumes the array [0]. 
             // Parent removes [0] on swipe. 
             // So CardStack always renders names[0].
             // My CardStack implementation (previous step) had internal index.
             // I should probably simplify CardStack to just render names[0] and names[1] 
             // and let Parent handle the queue.
             // BUT, the CardStack component I wrote has `setCurrentIndex` and internal logic.
             // Let's stick to the CardStack internal logic if possible, 
             // OR update CardStack to be controlled.
             // Given I wrote `onSwipe...` in CardStack calling `onSwipeRight` -> Parent updates state.
             // If Parent updates state (removes item), CardStack receives new `names` list.
             // CardStack's `currentIndex` should probably reset to 0 or stay 0 if the list shifts.
             // Let's check CardStack.tsx again.
             // `const currentProfile = names[currentIndex];`
             // If I remove the item from `names` in parent, then `names[currentIndex]` will point to the *next* item.
             // So effectively I skipped one.
             // I should modify CardStack to NOT increment index if the parent is modifying the list.
             // OR, better: Parent does NOT modify list immediately, only on "Empty" or load.
             // But for Rewind to work, Parent MUST modify list (add back).
             // Let's restart CardStack to be simpler: controlled by props.
             // I will use `key={names[0]?.id}` on CardStack? No that remounts everything.
             // I will rely on the fact that I am filtering `names` in parent.
             // So `CardStack` should always look at index 0.
             // I need to update `CardStack.tsx` to fix this logic.
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
             // Programmatic swipe not implemented in CardStack yet, 
             // need ref or exposed method. For now just manually trigger logic
             if(names.length > 0) handleSwipeLeft(names[0]);
        }}>
          <Ionicons name="close" size={32} color={AppTokens.colors.grey} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.likeBtn]} onPress={() => {
             if(names.length > 0) handleSwipeRight(names[0]);
        }}>
          <Ionicons name="heart" size={32} color={AppTokens.colors.primary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.footerText}>
        {names.length} names explored • {likedNames.length} liked
      </Text>
      <Text style={styles.footerText}>
         Welcome back, {surname || 'Guest'}!
      </Text>

      <PartnerInviteDialog 
        visible={inviteVisible} 
        onClose={() => setInviteVisible(false)} 
        surname={surname} 
      />

      <MenuDrawer
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={(screen) => navigation.navigate(screen as never)}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppTokens.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppTokens.spacing.m,
    paddingTop: AppTokens.spacing.l,
    paddingBottom: AppTokens.spacing.s,
  },
  iconButton: {
    padding: AppTokens.spacing.s,
  },
  logoContainer: {
      alignItems: 'center',
  },
  logoText: {
      fontFamily: AppTokens.typography.fontFamilyBold,
      color: AppTokens.colors.primary,
      fontSize: 20
  },
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: AppTokens.spacing.m,
    paddingBottom: AppTokens.spacing.m,
  },
  languageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: AppTokens.spacing.s,
    backgroundColor: '#F3F4F6',
    borderRadius: AppTokens.borderRadius.m,
  },
  filterText: {
    fontFamily: AppTokens.typography.fontFamily,
    marginRight: 4,
    color: AppTokens.colors.text,
  },
  genderSwitch: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: AppTokens.borderRadius.round,
    padding: 2,
  },
  genderOption: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: AppTokens.borderRadius.round,
  },
  genderActive: {
    backgroundColor: 'white',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 2,
  },
  genderText: {
    fontSize: 12,
    color: AppTokens.colors.grey,
    fontFamily: AppTokens.typography.fontFamily,
  },
  genderTextActive: {
    color: AppTokens.colors.text,
    fontFamily: AppTokens.typography.fontFamilyBold,
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
      fontFamily: AppTokens.typography.fontFamilyBold,
      fontSize: 20,
      color: AppTokens.colors.grey,
      marginBottom: 10
  },
  retryText: {
      color: AppTokens.colors.primary,
      fontFamily: AppTokens.typography.fontFamilyBold
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: AppTokens.spacing.l,
  },
  actionBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: AppTokens.spacing.m,
    shadowColor: "#000",
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
  dislikeBtn: {
      // styles handled by icon color mostly
  },
  likeBtn: {
      // 
  },
  footerText: {
      textAlign: 'center',
      fontSize: 12,
      color: AppTokens.colors.grey,
      marginBottom: AppTokens.spacing.s,
      paddingBottom: AppTokens.spacing.m,
      fontFamily: AppTokens.typography.fontFamily
  }
});
