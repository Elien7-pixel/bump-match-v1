
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, StatusBar, FlatList, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AppTokens } from '../theme/designTokens';
import { BabyName } from '../models/BabyName';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2; // 2 columns with spacing
const CARD_HEIGHT = CARD_WIDTH * 1.4;

export const LikedNamesScreen = () => {
  const navigation = useNavigation();
  const [likedNames, setLikedNames] = useState<BabyName[]>([]);

  useEffect(() => {
    loadLikedNames();
  }, []);

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
    if (gender === 'boy') return [AppTokens.colors.boyBlue, '#3B82F6'] as const;
    if (gender === 'girl') return [AppTokens.colors.girlPink, '#EC4899'] as const;
    return AppTokens.gradients.g3;
  };

  const renderNameCard = ({ item }: { item: BabyName }) => (
    <View style={styles.cardContainer}>
      <LinearGradient
        colors={getGradientColors(item.gender)}
        style={styles.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={AppTokens.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Liked Names</Text>
        <View style={{ width: 24 }} />
      </View>

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
          <Ionicons name="heart-outline" size={64} color={AppTokens.colors.grey} />
          <Text style={styles.emptyText}>No liked names yet</Text>
          <Text style={styles.emptySubtext}>Start swiping to add your favorites!</Text>
        </View>
      )}
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
    paddingBottom: AppTokens.spacing.m,
  },
  backButton: {
    padding: AppTokens.spacing.s,
  },
  headerTitle: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.h2,
    color: AppTokens.colors.text,
  },
  list: {
    padding: AppTokens.spacing.m,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: AppTokens.spacing.m,
  },
  card: {
    flex: 1,
    borderRadius: AppTokens.borderRadius.l,
    padding: AppTokens.spacing.m,
    shadowColor: "#000",
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
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: 24,
    color: AppTokens.colors.textLight,
    textAlign: 'center',
  },
  cardGender: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  cardInfo: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: AppTokens.borderRadius.m,
    padding: AppTokens.spacing.s,
  },
  cardMeaning: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: 11,
    color: AppTokens.colors.textLight,
    textAlign: 'center',
    marginBottom: 4,
  },
  cardOrigin: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: AppTokens.spacing.xl,
  },
  emptyText: {
    fontFamily: AppTokens.typography.fontFamilyBold,
    fontSize: AppTokens.typography.sizes.h2,
    color: AppTokens.colors.text,
    marginTop: AppTokens.spacing.l,
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: AppTokens.typography.fontFamily,
    fontSize: AppTokens.typography.sizes.body,
    color: AppTokens.colors.grey,
    marginTop: AppTokens.spacing.s,
    textAlign: 'center',
  },
});
