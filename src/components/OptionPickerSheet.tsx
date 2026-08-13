import React from 'react';
import { View, Text, Modal, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface OptionPickerSheetProps {
  visible: boolean;
  value: string | null;
  title: string;
  options: string[];
  onSelect: (option: string) => void;
  onClose: () => void;
}

/**
 * Bottom-sheet single-select list. Used for country and province, where the
 * native pickers are either unavailable or wrong for the platform.
 */
export const OptionPickerSheet: React.FC<OptionPickerSheetProps> = ({
  visible, value, title, options, onSelect, onClose,
}) => {
  const { theme } = useTheme();
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
          {options.map((option) => {
            const selected = value === option;
            return (
              <TouchableOpacity
                key={option}
                onPress={() => { onSelect(option); onClose(); }}
                style={[styles.row, {
                  backgroundColor: selected ? theme.brand.pinkSoft : 'transparent',
                  borderColor: selected ? theme.colors.primary : theme.colors.border,
                }]}
              >
                <Text style={[styles.rowText, {
                  color: selected ? theme.colors.primary : theme.colors.text,
                  fontFamily: selected ? theme.typography.fontFamilySemiBold : theme.typography.fontFamily,
                }]}>
                  {option}
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
  backdrop: { flex: 1, backgroundColor: 'rgba(74, 68, 89, 0.45)' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, paddingHorizontal: 16, maxHeight: '70%',
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14,
  },
  title: { fontSize: 16 },
  done: { fontSize: 16 },
  list: { flexGrow: 0 },
  listContent: { paddingBottom: 8 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12,
    borderWidth: 1, marginBottom: 8,
  },
  rowText: { fontSize: 16 },
});
