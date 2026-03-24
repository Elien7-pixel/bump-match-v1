import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface MatchRevealAnimationProps {
  visible: boolean;
  matchedNames: string[];
  onDismiss: () => void;
}

const Heart = ({ delay, x, y }: { delay: number; x: number; y: number }) => {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    if (delay >= 0) {
      opacity.value = withDelay(delay, withSequence(
        withTiming(1, { duration: 300 }),
        withDelay(1500, withTiming(0, { duration: 500 }))
      ));
      translateY.value = withDelay(delay, withTiming(-120, { duration: 2000, easing: Easing.out(Easing.ease) }));
      scale.value = withDelay(delay, withSequence(
        withSpring(1.2, { damping: 5 }),
        withTiming(0.8, { duration: 1000 })
      ));
    }
  }, [delay]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    position: 'absolute',
    left: x,
    top: y,
  }));

  return (
    <Animated.View style={style}>
      <Ionicons name="heart" size={24} color="#EC4899" />
    </Animated.View>
  );
};

export const MatchRevealAnimation: React.FC<MatchRevealAnimationProps> = ({
  visible,
  matchedNames,
  onDismiss,
}) => {
  const { theme } = useTheme();

  const containerScale = useSharedValue(0);
  const containerOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0);
  const namesOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      containerOpacity.value = withTiming(1, { duration: 300 });
      containerScale.value = withSpring(1, { damping: 8, stiffness: 100 });
      titleScale.value = withDelay(200, withSpring(1, { damping: 6, stiffness: 80 }));
      namesOpacity.value = withDelay(600, withTiming(1, { duration: 400 }));
    } else {
      containerScale.value = 0;
      containerOpacity.value = 0;
      titleScale.value = 0;
      namesOpacity.value = 0;
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: containerScale.value }],
    opacity: containerOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  const namesStyle = useAnimatedStyle(() => ({
    opacity: namesOpacity.value,
  }));

  if (!visible) return null;

  // Generate scattered heart positions
  const hearts = Array.from({ length: 12 }, (_, i) => ({
    delay: i * 150,
    x: 30 + Math.random() * 260,
    y: 100 + Math.random() * 300,
  }));

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.overlay} onPress={onDismiss}>
        <View style={styles.heartsContainer} pointerEvents="none">
          {hearts.map((heart, i) => (
            <Heart key={i} delay={heart.delay} x={heart.x} y={heart.y} />
          ))}
        </View>

        <Animated.View style={[styles.card, containerStyle, { backgroundColor: theme.colors.card }]}>
          <Animated.View style={titleStyle}>
            <Ionicons name="heart-circle" size={64} color="#10B981" />
            <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamilyBold }]}>
              It's a Match!
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.grey, fontFamily: theme.typography.fontFamily }]}>
              You and your partner both liked {matchedNames.length === 1 ? 'this name' : 'these names'}!
            </Text>
          </Animated.View>

          <Animated.View style={[styles.namesList, namesStyle]}>
            {matchedNames.slice(0, 5).map((name, index) => (
              <View key={index} style={[styles.nameChip, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="heart" size={14} color="#10B981" />
                <Text style={[styles.nameText, { fontFamily: theme.typography.fontFamilyBold }]}>
                  {name}
                </Text>
              </View>
            ))}
            {matchedNames.length > 5 && (
              <Text style={[styles.moreText, { color: theme.colors.grey, fontFamily: theme.typography.fontFamily }]}>
                +{matchedNames.length - 5} more
              </Text>
            )}
          </Animated.View>

          <Text style={[styles.tapHint, { color: theme.colors.grey, fontFamily: theme.typography.fontFamily }]}>
            Tap anywhere to dismiss
          </Text>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  heartsContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontSize: 28,
    textAlign: 'center',
    marginTop: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  namesList: {
    width: '100%',
    alignItems: 'center',
    gap: 8,
  },
  nameChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    gap: 8,
  },
  nameText: {
    fontSize: 18,
    color: '#065F46',
  },
  moreText: {
    fontSize: 14,
    marginTop: 4,
  },
  tapHint: {
    fontSize: 12,
    marginTop: 24,
  },
});
