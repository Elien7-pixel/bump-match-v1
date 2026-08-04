
import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  runOnJS,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { BabyName } from '../models/BabyName';
import { NameCard } from './NameCard';
import { useTheme } from '../context/ThemeContext';

interface CardStackProps {
  names: BabyName[];
  onSwipeRight: (name: BabyName) => void;
  onSwipeLeft: (name: BabyName) => void;
  onEmpty?: () => void;
  onFavorite?: (name: BabyName) => void;
  onSwipeUp?: (name: BabyName) => void;
  /** Measured height of the deck area; forwarded so cards fit the real space. */
  availableHeight?: number;
}

export const CardStack: React.FC<CardStackProps> = ({ names, onSwipeRight, onSwipeLeft, onEmpty, onFavorite, onSwipeUp, availableHeight }) => {
  const { width, height } = useWindowDimensions();
  const { theme } = useTheme();
  const SWIPE_THRESHOLD = width * 0.3;
  const SWIPE_UP_THRESHOLD = 120;
  // Directional swipe card colours: left/dislike = red, right/like = green, up/favourite = gold.
  const DISLIKE_COLOR = theme.colors.swipeNo;
  const LIKE_COLOR = theme.colors.swipeYes;
  const FAV_COLOR = theme.colors.swipeFav;
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const currentProfile = names[0];
  const nextProfile = names[1];

  useEffect(() => {
    translateX.value = 0;
    translateY.value = 0;
  }, [currentProfile?.id, translateX, translateY]); // Reset when the top card changes

  const handleSwipeComplete = (direction: 'left' | 'right') => {
    if (direction === 'right') {
      onSwipeRight(currentProfile);
    } else {
      onSwipeLeft(currentProfile);
    }

    if (names.length <= 1 && onEmpty) {
       onEmpty();
    }
  };

  const handleSwipeUp = () => {
    onSwipeUp?.(currentProfile);
    if (names.length <= 1 && onEmpty) {
      onEmpty();
    }
  };

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    })
    .onEnd((event) => {
      const swipedUp =
        onSwipeUp &&
        event.translationY < -SWIPE_UP_THRESHOLD &&
        Math.abs(event.translationY) > Math.abs(event.translationX);

      if (swipedUp) {
        // Swipe up = favourite. Fling the card off the top.
        translateY.value = withSpring(-height * 1.5, {}, () => {
          runOnJS(handleSwipeUp)();
        });
      } else if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Horizontal swipe (like / dislike)
        const direction = event.translationX > 0 ? 'right' : 'left';
        translateX.value = withSpring(direction === 'right' ? width * 1.5 : -width * 1.5, {}, () => {
             runOnJS(handleSwipeComplete)(direction);
        });
      } else {
        // Spring back
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
      }
    });

  const cardStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-width / 2, 0, width / 2],
      [-10, 0, 10],
      Extrapolation.CLAMP
    );

    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  // Tint layer rendered inside the card (between gradient and content) so the
  // card itself changes colour as you drag, reaching solid at the threshold.
  const tintStyle = useAnimatedStyle(() => {
    const tx = translateX.value;
    const ty = translateY.value;
    const upDominant = ty < 0 && Math.abs(ty) > Math.abs(tx) + 10;
    if (upDominant) {
      return { backgroundColor: FAV_COLOR, opacity: Math.min(Math.abs(ty) / SWIPE_UP_THRESHOLD, 1) };
    }
    if (tx > 0) {
      return { backgroundColor: LIKE_COLOR, opacity: Math.min(tx / SWIPE_THRESHOLD, 1) };
    }
    if (tx < 0) {
      return { backgroundColor: DISLIKE_COLOR, opacity: Math.min(-tx / SWIPE_THRESHOLD, 1) };
    }
    return { backgroundColor: FAV_COLOR, opacity: 0 };
  });

  const nextCardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      Math.abs(translateX.value),
      [0, width / 2],
      [0.9, 1],
      Extrapolation.CLAMP
    );
    
    return {
      transform: [{ scale }],
      opacity: interpolate(Math.abs(translateX.value), [0, width / 2], [0.6, 1], Extrapolation.CLAMP),
    };
  });

  if (!currentProfile) {
    return null;
  }

  return (
    <View style={styles.container}>
      {nextProfile && (
        <Animated.View style={[styles.cardContainer, nextCardStyle, styles.nextCard]}>
          <NameCard data={nextProfile} availableHeight={availableHeight} />
        </Animated.View>
      )}

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardContainer, cardStyle]}>
           <NameCard data={currentProfile} onFavorite={onFavorite} tintStyle={tintStyle} availableHeight={availableHeight} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  cardContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextCard: {
     zIndex: -1,
  }
});
