// app/(tabs)/library.tsx

import { useCallback, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '@/components/shared/EmptyState';
import { CategoryPicker } from '@/components/shared/CategoryPicker';
import { KeyboardAvoider } from '@/components/shared/KeyboardAvoider';
import { useLibraryStore } from '@/store/libraryStore';
import { CATEGORIES, categoryColor, categoryLabel } from '@/constants/categories';
import { colors, fontSize, radius, spacing } from '@/constants/colors';
import type { Category, Exercise } from '@/types';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const {
    searchQuery,
    selectedCategory,
    loadExercises,
    setSearch,
    setCategory,
    getFiltered,
    addCustomExercise,
    updateCustomExercise,
  } = useLibraryStore();

  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState<Category>('custom');

  useFocusEffect(
    useCallback(() => {
      loadExercises();
    }, [loadExercises])
  );

  const filtered = getFiltered();
  const standard = useMemo(() => filtered.filter((e) => !e.isCustom), [filtered]);
  const custom = useMemo(() => filtered.filter((e) => e.isCustom), [filtered]);

  function openExercise(ex: Exercise) {
    router.push({ pathname: '/modals/exercise-detail', params: { id: String(ex.id) } });
  }

  function openAdd() {
    setEditingId(null);
    setNewName('');
    setNewCategory('custom');
    setSheetVisible(true);
  }

  function openEdit(ex: Exercise) {
    setEditingId(ex.id);
    setNewName(ex.name);
    setNewCategory(ex.category);
    setSheetVisible(true);
  }

  function handleSave() {
    const name = newName.trim();
    if (name.length === 0) return;
    if (editingId !== null) {
      updateCustomExercise(editingId, name, newCategory);
    } else {
      addCustomExercise(name, newCategory);
    }
    setSheetVisible(false);
    setEditingId(null);
    setNewName('');
    setNewCategory('custom');
  }

  function renderRow(ex: Exercise) {
    return (
      <Pressable key={ex.id} style={styles.row} onPress={() => openExercise(ex)}>
        <View style={[styles.dot, { backgroundColor: categoryColor(ex.category) }]} />
        <Text style={styles.rowName} numberOfLines={1}>
          {ex.name}
        </Text>
        <Text style={styles.rowCat}>{categoryLabel(ex.category)}</Text>
        {ex.isCustom ? (
          <Pressable
            onPress={() => openEdit(ex)}
            hitSlop={8}
            accessibilityLabel={`${ex.name} bewerken`}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        )}
      </Pressable>
    );
  }

  const filterTabs: ('all' | Category)[] = ['all', ...CATEGORIES.map((c) => c.key)];

  return (
    <View style={styles.screen}>
      <View style={styles.searchWrap}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearch}
          placeholder="Zoek oefening..."
          placeholderTextColor={colors.textFaint}
          style={styles.searchInput}
        />
        {searchQuery.length > 0 ? (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsScroll}
        contentContainerStyle={styles.tabs}
      >
        {filterTabs.map((cat) => {
          const active = selectedCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.tab, active && styles.tabActive]}
            >
              <Text style={[styles.tabText, active && styles.tabTextActive]}>
                {cat === 'all' ? 'Alle' : categoryLabel(cat)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.length === 0 ? (
          <EmptyState icon="search" title="Geen resultaten" subtitle="Pas je zoekopdracht aan." />
        ) : (
          <>
            {standard.map(renderRow)}
            {custom.length > 0 ? (
              <View style={styles.sectionHeader}>
                <Ionicons name="star" size={14} color={colors.new} />
                <Text style={styles.sectionTitle}>Mijn oefeningen</Text>
              </View>
            ) : null}
            {custom.map(renderRow)}
          </>
        )}
      </ScrollView>

      <Pressable
        style={[styles.fab, { bottom: insets.bottom + spacing.lg }]}
        onPress={openAdd}
      >
        <Ionicons name="add" size={20} color={colors.primaryText} />
        <Text style={styles.fabText}>Eigen oefening</Text>
      </Pressable>

      <Modal
        visible={sheetVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSheetVisible(false)}
      >
        <KeyboardAvoider style={styles.flex} behavior="padding">
          <Pressable style={styles.backdrop} onPress={() => setSheetVisible(false)}>
            <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
              <View style={styles.sheetHandle} />
              <Text style={styles.sheetTitle}>
                {editingId !== null ? 'Oefening bewerken' : 'Eigen oefening toevoegen'}
              </Text>

              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Naam"
                placeholderTextColor={colors.textFaint}
                style={styles.nameInput}
                autoFocus
              />

              <Text style={styles.fieldLabel}>Categorie</Text>
              <CategoryPicker value={newCategory} onChange={setNewCategory} />

              <Pressable
                style={[styles.saveBtn, newName.trim().length === 0 && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={newName.trim().length === 0}
              >
                <Text style={styles.saveBtnText}>
                  {editingId !== null ? 'Opslaan' : 'Toevoegen'}
                </Text>
              </Pressable>
            </Pressable>
          </Pressable>
        </KeyboardAvoider>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.md,
  },
  flex: {
    flex: 1,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    padding: 0,
  },
  tabsScroll: {
    marginTop: spacing.md,
    flexGrow: 0,
  },
  tabs: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
  },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.primaryText,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  rowName: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  rowCat: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  nameInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    fontSize: fontSize.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.md,
  },
  fieldLabel: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    color: colors.primaryText,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
