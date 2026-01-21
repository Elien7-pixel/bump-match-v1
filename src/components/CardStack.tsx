
import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
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

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.3;

interface CardStackProps {
  names: BabyName[];
  onSwipeRight: (name: BabyName) => void;
  onSwipeLeft: (name: BabyName) => void;
  onEmpty?: () => void;
}

export const CardStack: React.FC<CardStackProps> = ({ names, onSwipeRight, onSwipeLeft, onEmpty }) => {
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
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        // Swipe detected
        const direction = event.translationX > 0 ? 'right' : 'left';
        // Animate off screen
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
          <NameCard data={nextProfile} />
        </Animated.View>
      )}

      <GestureDetector gesture={panGesture}>
        <Animated.View style={[styles.cardContainer, cardStyle]}>
           <NameCard data={currentProfile} />
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
