import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../context/ThemeContext';
import { toPickerDate, isMonthOnly, monthBounds } from '../utils/date';

// Holds the milestone the user last closed the banner on. Keyed to the
// milestone rather than a plain flag so the banner comes back when the baby
// reaches the next size — closing "sesame seed" shouldn't hide "blueberry".
const DISMISSED_KEY = 'bumpmatch_tracker_dismissed';

interface PregnancyTrackerProps {
  /** Month-only "YYYY-MM", or a legacy full "YYYY-MM-DD" due date. */
  dueDate: string;
  /** One-line version, for when the swipe deck below is starved of height. */
  compact?: boolean;
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

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const TOTAL_PREGNANCY_MS = 40 * WEEK_MS;

/** Gestational week implied by a specific due date, unclamped. */
function weekForDueDate(dueDate: Date): number {
  const msUntilDue = dueDate.getTime() - new Date().getTime();
  return Math.floor((TOTAL_PREGNANCY_MS - msUntilDue) / WEEK_MS);
}

const clampWeek = (w: number) => Math.max(4, Math.min(40, w));

interface Gestation {
  low: number;
  high: number;
  /** Midpoint, used for the milestone, progress bar, and the render guard. */
  mid: number;
  weeksLeftLow: number;
  weeksLeftHigh: number;
  /** True when the due date is month-only, so the week is a range not a number. */
  approximate: boolean;
}

/**
 * A month-only due date could land on any day of that month, which is a five-week
 * spread in gestational terms. Rather than pick a day and print a week that is
 * quietly wrong, derive the range the month actually implies: an earlier due date
 * means further along, so the first of the month gives the high week.
 */
function getGestation(dueDateStr: string): Gestation | null {
  const now = new Date();
  const weeksLeft = (d: Date) => Math.max(0, Math.ceil((d.getTime() - now.getTime()) / WEEK_MS));

  if (isMonthOnly(dueDateStr)) {
    const bounds = monthBounds(dueDateStr);
    if (!bounds) return null;
    const high = clampWeek(weekForDueDate(bounds.first));
    const low = clampWeek(weekForDueDate(bounds.last));
    return {
      low,
      high,
      mid: Math.round((low + high) / 2),
      weeksLeftLow: weeksLeft(bounds.first),
      weeksLeftHigh: weeksLeft(bounds.last),
      approximate: true,
    };
  }

  const dueDate = toPickerDate(dueDateStr);
  if (!dueDate) return null;
  const week = clampWeek(weekForDueDate(dueDate));
  const left = weeksLeft(dueDate);
  return { low: week, high: week, mid: week, weeksLeftLow: left, weeksLeftHigh: left, approximate: false };
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

export const PregnancyTracker: React.FC<PregnancyTrackerProps> = ({ dueDate, compact }) => {
  const { theme, isDark } = useTheme();
  // undefined = not read from storage yet. Render nothing until it is, so a
  // dismissed banner doesn't flash up on every launch.
  const [dismissedFor, setDismissedFor] = useState<string | null | undefined>(undefined);
  useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then((value) => setDismissedFor(value))
      .catch(() => setDismissedFor(null));
  }, []);

  const gestation = getGestation(dueDate);
  if (!gestation) return null;

  const { low, high, mid, weeksLeftLow, weeksLeftHigh, approximate } = gestation;
  const milestone = getClosestMilestone(mid);

  if (mid < 4 || mid > 42) return null;
  if (dismissedFor === undefined || dismissedFor === milestone.fruit) return null;

  const handleClose = () => {
    setDismissedFor(milestone.fruit);
    AsyncStorage.setItem(DISMISSED_KEY, milestone.fruit).catch(() => {});
  };
  const closeButton = (
    <TouchableOpacity
      onPress={handleClose}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      accessibilityRole="button"
      accessibilityLabel="Close baby size banner"
      style={compact ? styles.closeCompact : styles.close}
    >
      <Ionicons name="close" size={18} color={theme.colors.grey} />
    </TouchableOpacity>
  );

  // "Weeks 23–25" when the due date is only known to the month, "Week 24" when
  // it is an exact date (or when the range happens to collapse to one week).
  const weekLabel = approximate && low !== high ? `Weeks ${low}–${high}` : `Week ${mid}`;
  const weeksLeftLabel =
    weeksLeftHigh <= 0
      ? 'Any day now!'
      : approximate && weeksLeftLow !== weeksLeftHigh
        ? `${weeksLeftLow}–${weeksLeftHigh} weeks to go`
        : `${weeksLeftHigh} ${weeksLeftHigh === 1 ? 'week' : 'weeks'} to go`;

  const progressPercent = Math.max(0, Math.min(100, Math.round((mid / 40) * 100)));

  if (compact) {
    return (
      <View style={[styles.container, styles.containerCompact, {
        backgroundColor: isDark ? theme.colors.card : theme.brand.yellowSoft,
        borderColor: isDark ? theme.colors.border : theme.brand.yellow,
        shadowColor: theme.colors.shadow,
      }]}>
        <Text style={styles.emojiCompact} maxFontSizeMultiplier={1.2}>{milestone.emoji}</Text>
        <Text
          style={[styles.title, styles.titleCompact, { color: theme.colors.text, fontFamily: theme.typography.fontFamilySemiBold }]}
          numberOfLines={1}
          maxFontSizeMultiplier={1.2}
        >
          {weekLabel} · size of a {milestone.fruit.toLowerCase()} · {weeksLeftLabel}
        </Text>
        {closeButton}
      </View>
    );
  }

  return (
    <View style={[styles.container, {
      backgroundColor: isDark ? theme.colors.card : theme.brand.yellowSoft,
      borderColor: isDark ? theme.colors.border : theme.brand.yellow,
      shadowColor: theme.colors.shadow,
    }]}>
      <Text style={styles.emoji}>{milestone.emoji}</Text>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamilySemiBold }]}>
          {weekLabel} — Baby is the size of a {milestone.fruit.toLowerCase()}!
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.grey, fontFamily: theme.typography.fontFamily }]}>
          About {milestone.size} long · {weeksLeftLabel}
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
      {closeButton}
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
  containerCompact: {
    paddingVertical: 6,
  },
  emoji: {
    fontSize: 32,
    marginRight: 12,
  },
  // Top-right of the full banner, clear of the title's first line.
  close: {
    alignSelf: 'flex-start',
    marginLeft: 8,
  },
  closeCompact: {
    marginLeft: 8,
  },
  emojiCompact: {
    fontSize: 16,
    marginRight: 8,
  },
  titleCompact: {
    flex: 1,
    marginBottom: 0,
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
