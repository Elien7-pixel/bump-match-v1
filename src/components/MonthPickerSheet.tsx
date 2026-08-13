import React, { useMemo } from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { toISOMonthString, formatMonth } from '../utils/date';

interface MonthPickerSheetProps {
  visible: boolean;
  /** Currently selected month as "YYYY-MM", or '' / null when nothing is chosen. */
  value: string | null;
  title: string;
  /** How many months forward to offer, counting the current month as the first. */
  monthsAhead?: number;
  onSelect: (month: string) => void;
  onClose: () => void;
}

/**
 * Month-and-year picker for due dates. A plain list rather than a spinner because
 * a due date is only ever a handful of months out, and neither iOS nor Android's
 * native date picker has a real month-only mode.
 */
export const MonthPickerSheet: React.FC<MonthPickerSheetProps> = ({
  visible,
  value,
  title,
  monthsAhead = 12,
  onSelect,
  onClose,
}) => {
  const { theme } = useTheme();

  // Built from today so the list always starts at the current month. Recomputed
  // only when the window size changes — a session never spans a month boundary
  // in a way that matters here.
  const months = useMemo(() => {
    const now = new Date();
    return Array.from({ length: monthsAhead }, (_, i) =>
      toISOMonthString(new Date(now.getFullYear(), now.getMonth() + i, 1)),
    );
  }, [monthsAhead]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: theme.colors.card }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.colors.text, fontFamily: theme.typography.fontFamily }]}>
            {title}
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Text style={[styles.done, { color: theme.colors.primary, fontFamily: theme.typography.fontFamilyBold }]}>
              Done
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {months.map((m) => {
            const selected = value === m;
            return (
              <TouchableOpacity
                key={m}
                onPress={() => {
                  onSelect(m);
                  onClose();
                }}
                style={[
                  styles.row,
                  {
                    backgroundColor: selected ? theme.brand.pinkSoft : 'transparent',
                    borderColor: selected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.rowText,
                    {
                      color: selected ? theme.colors.primary : theme.colors.text,
                      fontFamily: selected
                        ? theme.typography.fontFamilySemiBold
                        : theme.typography.fontFamily,
                    },
                  ]}
                >
                  {formatMonth(m)}
                </Text>
                {selected && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(74, 68, 89, 0.45)',   // ink-based scrim, matches DatePickerSheet
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 32,
    paddingHorizontal: 16,
    maxHeight: '70%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  title: {
    fontSize: 16,
  },
  done: {
    fontSize: 16,
  },
  list: {
    flexGrow: 0,
  },
  listContent: {
    paddingBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowText: {
    fontSize: 16,
  },
});
