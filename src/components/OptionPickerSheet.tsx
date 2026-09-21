import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, Modal, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { searchOptions } from '../utils/search';

interface OptionPickerSheetProps {
  visible: boolean;
  value: string | null;
  title: string;
  options: string[];
  onSelect: (option: string) => void;
  onClose: () => void;
  /** Show a search box above the list. Worth it from roughly twenty options up. */
  searchable?: boolean;
  searchPlaceholder?: string;
  /** Options repeated at the top of the list while the search box is empty. */
  pinned?: string[];
  /** Section headings used when `pinned` is set. */
  pinnedLabel?: string;
  allLabel?: string;
  /** Extra words that should find an option in search, keyed by option. */
  aliases?: Record<string, string[]>;
}

type Row =
  | { kind: 'header'; key: string; label: string }
  | { kind: 'option'; key: string; option: string };

/**
 * Bottom-sheet single-select list. Used for country and province, where the
 * native pickers are either unavailable or wrong for the platform. Long lists
 * (countries) get a search box and a pinned block of likely picks on top.
 */
export const OptionPickerSheet: React.FC<OptionPickerSheetProps> = ({
  visible, value, title, options, onSelect, onClose,
  searchable = false, searchPlaceholder = 'Search',
  pinned, pinnedLabel = 'Suggested', allLabel = 'All',
  aliases,
}) => {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');

  // A stale query from the last time the sheet was open would silently hide
  // most of the list the next time it is shown.
  useEffect(() => {
    if (!visible) setQuery('');
  }, [visible]);

  const rows = useMemo<Row[]>(() => {
    if (searchable && query.trim()) {
      return searchOptions(options, query, aliases)
        .map((option) => ({ kind: 'option' as const, key: `s-${option}`, option }));
    }
    const pinnedRows = (pinned ?? []).filter((p) => options.includes(p));
    if (pinnedRows.length === 0) {
      return options.map((option) => ({ kind: 'option' as const, key: option, option }));
    }
    return [
      { kind: 'header' as const, key: 'h-pinned', label: pinnedLabel },
      ...pinnedRows.map((option) => ({ kind: 'option' as const, key: `p-${option}`, option })),
      { kind: 'header' as const, key: 'h-all', label: allLabel },
      ...options.map((option) => ({ kind: 'option' as const, key: `a-${option}`, option })),
    ];
  }, [searchable, query, options, aliases, pinned, pinnedLabel, allLabel]);

  if (!visible) return null;

  const renderRow = ({ item }: { item: Row }) => {
    if (item.kind === 'header') {
      return (
        <Text style={[styles.sectionLabel, {
          color: theme.colors.grey, fontFamily: theme.typography.fontFamilySemiBold,
        }]}>
          {item.label}
        </Text>
      );
    }
    const selected = value === item.option;
    return (
      <TouchableOpacity
        onPress={() => { onSelect(item.option); onClose(); }}
        style={[styles.row, {
          backgroundColor: selected ? theme.brand.pinkSoft : 'transparent',
          borderColor: selected ? theme.colors.primary : theme.colors.border,
        }]}
      >
        <Text style={[styles.rowText, {
          color: selected ? theme.colors.primary : theme.colors.text,
          fontFamily: selected ? theme.typography.fontFamilySemiBold : theme.typography.fontFamily,
        }]}>
          {item.option}
        </Text>
        {selected && <Ionicons name="checkmark" size={20} color={theme.colors.primary} />}
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={[
          styles.sheet,
          // A searchable sheet keeps a fixed height so it does not jump around
          // as the result count changes with every keystroke.
          searchable ? styles.sheetFixed : styles.sheetAuto,
          { backgroundColor: theme.colors.card },
        ]}>
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

          {searchable && (
            <View style={[styles.searchBar, {
              backgroundColor: theme.colors.background, borderColor: theme.colors.border,
            }]}>
              <Ionicons name="search" size={18} color={theme.colors.grey} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder={searchPlaceholder}
                placeholderTextColor={theme.colors.grey}
                style={[styles.searchInput, { color: theme.colors.text, fontFamily: theme.typography.fontFamily }]}
                autoCorrect={false}
                autoCapitalize="words"
                returnKeyType="search"
                clearButtonMode="never"
                accessibilityLabel={`Search ${title.toLowerCase()}`}
              />
              {query.length > 0 && (
                <TouchableOpacity
                  onPress={() => setQuery('')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityLabel="Clear search"
                >
                  <Ionicons name="close-circle" size={18} color={theme.colors.grey} />
                </TouchableOpacity>
              )}
            </View>
          )}

          <FlatList
            data={rows}
            keyExtractor={(row) => row.key}
            renderItem={renderRow}
            style={searchable ? styles.listFill : styles.listAuto}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            initialNumToRender={24}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: theme.colors.grey, fontFamily: theme.typography.fontFamily }]}>
                No matches for “{query.trim()}”
              </Text>
            }
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  backdrop: { flex: 1, backgroundColor: 'rgba(74, 68, 89, 0.45)' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingBottom: 32, paddingHorizontal: 16,
    // Lets the sheet give way to the keyboard instead of pushing off the top.
    flexShrink: 1,
  },
  sheetAuto: { maxHeight: '70%' },
  sheetFixed: { height: '70%' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 14,
  },
  title: { fontSize: 16 },
  done: { fontSize: 16 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 44,
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 0 },
  listAuto: { flexGrow: 0, flexShrink: 1 },
  listFill: { flex: 1 },
  listContent: { paddingBottom: 8 },
  sectionLabel: {
    fontSize: 12, letterSpacing: 0.6, textTransform: 'uppercase',
    paddingHorizontal: 4, paddingTop: 6, paddingBottom: 8,
  },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 16, borderRadius: 12,
    borderWidth: 1, marginBottom: 8,
  },
  rowText: { fontSize: 16 },
  empty: { fontSize: 15, textAlign: 'center', paddingVertical: 24 },
});
