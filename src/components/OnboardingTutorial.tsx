import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface OnboardingTutorialProps {
  visible: boolean;
  onDismiss: () => void;
  onAddPartner?: () => void;
}

interface Slide {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  type?: 'standard' | 'partner-prompt';
}

const SLIDES: Slide[] = [
  {
    icon: 'heart-outline',
    iconColor: '#EC4899',
    title: 'Swipe to Discover',
    description: 'Swipe right on names you love, left on ones you don\'t. It\'s that simple!',
  },
  {
    icon: 'people-outline',
    iconColor: '#3B82F6',
    title: 'Better Together',
    description: 'Are you doing this solo or with a partner? Link up to discover names you both love!',
    type: 'partner-prompt',
  },
  {
    icon: 'star-outline',
    iconColor: '#F59E0B',
    title: 'Favorite Your Top Picks',
    description: 'Star your absolute favorites in the Liked Names list to keep your top choices front and center.',
  },
  {
    icon: 'options-outline',
    iconColor: '#10B981',
    title: 'Filter & Explore',
    description: 'Filter by gender, language, meaning, and popularity. Find names from 20+ cultures.',
  },
];

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({
  visible,
  onDismiss,
  onAddPartner,
}) => {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideWidth, setSlideWidth] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      onDismiss();
    }
  };

  const handleSkip = () => {
    onDismiss();
  };

  const handleAddPartner = () => {
    onDismiss();
    onAddPartner?.();
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index || 0);
    }
  }).current;

  const currentSlide = SLIDES[currentIndex];
  const isPartnerSlide = currentSlide?.type === 'partner-prompt';

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width: slideWidth }]}>
      <View style={[styles.iconCircle, { backgroundColor: `${item.iconColor}15` }]}>
        <Ionicons name={item.icon as any} size={64} color={item.iconColor} />
      </View>
      <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamilyBold }]}>
        {item.title}
      </Text>
      <Text style={[styles.description, { color: theme.colors.grey, fontFamily: theme.typography.fontFamily }]}>
        {item.description}
      </Text>
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.card }]}>
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <Text style={[styles.skipText, { color: theme.colors.grey, fontFamily: theme.typography.fontFamily }]}>
              Skip
            </Text>
          </TouchableOpacity>

          <View
            style={styles.flatListWrapper}
            onLayout={(e) => setSlideWidth(e.nativeEvent.layout.width)}
          >
            {slideWidth > 0 && (
              <FlatList
                ref={flatListRef}
                data={SLIDES}
                renderItem={renderSlide}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
                keyExtractor={(_, index) => index.toString()}
                getItemLayout={(_, index) => ({
                  length: slideWidth,
                  offset: slideWidth * index,
                  index,
                })}
              />
            )}
          </View>

          {/* Pagination dots */}
          <View style={styles.pagination}>
            {SLIDES.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: index === currentIndex ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              />
            ))}
          </View>

          {isPartnerSlide ? (
            <View style={styles.partnerButtons}>
              <TouchableOpacity
                style={[styles.partnerButton, { backgroundColor: theme.colors.primary }]}
                onPress={handleAddPartner}
              >
                <Ionicons name="people" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={[styles.nextText, { fontFamily: theme.typography.fontFamilyBold }]}>
                  Add Partner Now
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.soloButton, { borderColor: theme.colors.border }]}
                onPress={handleNext}
              >
                <Text style={[styles.soloText, { color: theme.colors.text, fontFamily: theme.typography.fontFamily }]}>
                  I'll do this solo / Add later
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.nextButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleNext}
            >
              <Text style={[styles.nextText, { fontFamily: theme.typography.fontFamilyBold }]}>
                {currentIndex === SLIDES.length - 1 ? "Let's Go!" : 'Next'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 8,
  },
  flatListWrapper: {
    width: '100%',
  },
  skipText: {
    fontSize: 14,
  },
  slide: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  pagination: {
    flexDirection: 'row',
    gap: 8,
    marginVertical: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  partnerButtons: {
    width: '100%',
    gap: 10,
  },
  partnerButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  soloButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 30,
    alignItems: 'center',
    borderWidth: 1,
  },
  soloText: {
    fontSize: 14,
  },
});
