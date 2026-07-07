import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';

interface PregnancyTrackerProps {
  dueDate: string; // ISO date string
}

// Week-by-week fruit/veggie size comparison
const MILESTONES: { [week: number]: { fruit: string; emoji: string; size: string } } = {
  4: { fruit: 'Poppy seed', emoji: '🌱', size: '2mm' },
  5: { fruit: 'Sesame seed', emoji: '🫘', size: '3mm' },
  6: { fruit: 'Lentil', emoji: '🟤', size: '6mm' },
  7: { fruit: 'Blueberry', emoji: '🫐', size: '1cm' },
  8: { fruit: 'Raspberry', emoji: '🍇', size: '1.5cm' },
  9: { fruit: 'Cherry', emoji: '🍒', size: '2.5cm' },
  10: { fruit: 'Strawberry', emoji: '🍓', size: '3cm' },
  11: { fruit: 'Lime', emoji: '🟢', size: '4cm' },
  12: { fruit: 'Plum', emoji: '🟣', size: '5cm' },
  13: { fruit: 'Peach', emoji: '🍑', size: '7cm' },
  14: { fruit: 'Lemon', emoji: '🍋', size: '9cm' },
  15: { fruit: 'Apple', emoji: '🍎', size: '10cm' },
  16: { fruit: 'Avocado', emoji: '🥑', size: '12cm' },
  17: { fruit: 'Pear', emoji: '🍐', size: '13cm' },
  18: { fruit: 'Sweet potato', emoji: '🍠', size: '14cm' },
  19: { fruit: 'Mango', emoji: '🥭', size: '15cm' },
  20: { fruit: 'Banana', emoji: '🍌', size: '16cm' },
  21: { fruit: 'Pomegranate', emoji: '🫒', size: '27cm' },
  22: { fruit: 'Papaya', emoji: '🥝', size: '28cm' },
  23: { fruit: 'Grapefruit', emoji: '🍊', size: '29cm' },
  24: { fruit: 'Corn on the cob', emoji: '🌽', size: '30cm' },
  25: { fruit: 'Cauliflower', emoji: '🥦', size: '35cm' },
  26: { fruit: 'Lettuce', emoji: '🥬', size: '36cm' },
  27: { fruit: 'Cabbage', emoji: '🥗', size: '37cm' },
  28: { fruit: 'Aubergine', emoji: '🍆', size: '38cm' },
  29: { fruit: 'Butternut squash', emoji: '🎃', size: '39cm' },
  30: { fruit: 'Coconut', emoji: '🥥', size: '40cm' },
  31: { fruit: 'Pineapple', emoji: '🍍', size: '41cm' },
  32: { fruit: 'Squash', emoji: '🟡', size: '42cm' },
  33: { fruit: 'Celery', emoji: '🥒', size: '44cm' },
  34: { fruit: 'Cantaloupe', emoji: '🍈', size: '45cm' },
  35: { fruit: 'Honeydew melon', emoji: '🍈', size: '46cm' },
  36: { fruit: 'Romaine lettuce', emoji: '🥬', size: '47cm' },
  37: { fruit: 'Swiss chard', emoji: '🌿', size: '48cm' },
  38: { fruit: 'Leek', emoji: '🧅', size: '50cm' },
  39: { fruit: 'Watermelon', emoji: '🍉', size: '51cm' },
  40: { fruit: 'Pumpkin', emoji: '🎃', size: '52cm' },
};

function getGestationalWeek(dueDateStr: string): number {
  const dueDate = new Date(dueDateStr);
  const now = new Date();
  const totalPregnancyMs = 40 * 7 * 24 * 60 * 60 * 1000; // 40 weeks
  const msUntilDue = dueDate.getTime() - now.getTime();
  const msElapsed = totalPregnancyMs - msUntilDue;
  const weeksElapsed = Math.floor(msElapsed / (7 * 24 * 60 * 60 * 1000));
  return Math.max(4, Math.min(40, weeksElapsed));
}

function getClosestMilestone(week: number): { fruit: string; emoji: string; size: string } {
  if (MILESTONES[week]) return MILESTONES[week];
  // Find closest lower week
  const weeks = Object.keys(MILESTONES).map(Number).sort((a, b) => a - b);
  for (let i = weeks.length - 1; i >= 0; i--) {
    if (weeks[i] <= week) return MILESTONES[weeks[i]];
  }
  return MILESTONES[4];
}

function getWeeksRemaining(dueDateStr: string): number {
  const dueDate = new Date(dueDateStr);
  const now = new Date();
  const msRemaining = dueDate.getTime() - now.getTime();
  return Math.max(0, Math.ceil(msRemaining / (7 * 24 * 60 * 60 * 1000)));
}

export const PregnancyTracker: React.FC<PregnancyTrackerProps> = ({ dueDate }) => {
  const { theme, isDark } = useTheme();

  const week = getGestationalWeek(dueDate);
  const milestone = getClosestMilestone(week);
  const weeksLeft = getWeeksRemaining(dueDate);

  if (week < 4 || week > 42) return null;

  const progressPercent = Math.max(0, Math.min(100, Math.round((week / 40) * 100)));

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? theme.colors.card : theme.brand.yellowSoft,
      borderColor: isDark ? theme.colors.border : theme.brand.yellow,
      shadowColor: theme.colors.shadow,
    }]}>
      <Text style={styles.emoji}>{milestone.emoji}</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamilySemiBold }]}>
          Week {week} — Baby is the size of a {milestone.fruit.toLowerCase()}!
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.grey, fontFamily: theme.typography.fontFamily }]}>
          About {milestone.size} long{weeksLeft > 0 ? ` · ${weeksLeft} ${weeksLeft === 1 ? 'week' : 'weeks'} to go` : ' · Any day now!'}
        </Text>
        <View style={[styles.progressTrack, {
          backgroundColor: isDark ? theme.colors.background : theme.brand.pinkSoft,
        }]}>
          <LinearGradient
            colors={theme.gradients.g1}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressFill, { width: `${progressPercent}%` }]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 2,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
  },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 999,
  },
});
