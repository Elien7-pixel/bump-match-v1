import React, { useEffect } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

// Brand icons that erupt on a favourite. Mixed so the burst feels varied.
const ICONS = [
  require('../../assets/brand/icons/heart-1.png'),
  require('../../assets/brand/icons/star-2.png'),
  require('../../assets/brand/icons/flower-2.png'),
  require('../../assets/brand/icons/rainbow.png'),
  require('../../assets/brand/icons/heart-3.png'),
  require('../../assets/brand/icons/star-4.png'),
  require('../../assets/brand/icons/flower-1.png'),
  require('../../assets/brand/icons/star-3.png'),
  require('../../assets/brand/icons/heart-2.png'),
  require('../../assets/brand/icons/flower-3.png'),
  require('../../assets/brand/icons/star-1.png'),
  require('../../assets/brand/icons/rainbow.png'),
];

const SPRITE_COUNT = 14;
const BASE_SIZE = 46;

// Deterministic pseudo-spread so sprites don't cluster (golden-ratio stepping).
const frac = (n: number) => n - Math.floor(n);

const Sprite = ({ index }: { index: number }) => {
  const { width, height } = useWindowDimensions();
  const t = useSharedValue(0);

  useEffect(() => {
    // Animate once on mount (the parent remounts sprites via `key` per burst).
    t.value = withDelay(
      index * 45,
      withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) })
    );
  }, []);

  const laneX = 24 + (width - 48) * frac(index * 0.61803398875 + 0.13);
  const drift = (frac(index * 7.13) - 0.5) * 90;
  const spin = index % 2 === 0 ? 42 : -42;

  const style = useAnimatedStyle(() => {
    const p = t.value;
    // Bottom → top: start near the bottom edge, travel just past the top.
    const translateY = height * 0.86 - p * (height * 0.95 + 60);
    const translateX = drift * p;
    const scale = 0.2 + p * 1.25; // starts small, grows as it rises
    const opacity = p < 0.12 ? p / 0.12 : p > 0.78 ? Math.max(0, (1 - p) / 0.22) : 1;
    return {
      opacity,
      transform: [
        { translateX },
        { translateY },
        { scale },
        { rotate: `${p * spin}deg` },
      ],
    };
  });

  return (
    <Animated.Image
      source={ICONS[index % ICONS.length]}
      resizeMode="contain"
      style={[styles.sprite, { left: laneX, width: BASE_SIZE, height: BASE_SIZE }, style]}
    />
  );
};

// Plays a one-shot celebratory burst whenever `playKey` changes to a new value.
export const FavoriteBurst = ({ playKey }: { playKey: number }) => {
  if (!playKey) return null;
  return (
    <View style={[StyleSheet.absoluteFill, styles.overlay]} pointerEvents="none">
      {Array.from({ length: SPRITE_COUNT }, (_, i) => (
        <Sprite key={`${playKey}-${i}`} index={i} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    zIndex: 999,
    elevation: 999,
  },
  sprite: {
    position: 'absolute',
    top: 0,
  },
});

export default FavoriteBurst;
