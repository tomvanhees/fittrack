// app/(tabs)/week.tsx

import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WeekBar } from '@/components/week/WeekBar';
import { DayCard } from '@/components/week/DayCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useWorkoutStore } from '@/store/workoutStore';
import { getAllTemplates, type TemplateSummary } from '@/db/queries/templates';
import { addDays, formatWeekLabel } from '@/lib/date';
import { colors, fontSize, radius, spacing } from '@/constants/colors';

export default function WeekScreen() {
  const insets = useSafeAreaInsets();
  const { weekDays, selectedDate, todayDate, setSelectedDate, loadWeek, setDateAsRest, applyTemplate } =
    useWorkoutStore();

  const [templateSheet, setTemplateSheet] = useState(false);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadWeek(selectedDate);
    }, [loadWeek, selectedDate])
  );

  const selectedDay = weekDays.find((d) => d.date === selectedDate);

  function goPrevWeek() {
    const d = addDays(selectedDate, -7);
    setSelectedDate(d);
    loadWeek(d);
  }

  function goNextWeek() {
    const d = addDays(selectedDate, 7);
    setSelectedDate(d);
    loadWeek(d);
  }

  function openTemplateSheet() {
    setTemplates(getAllTemplates());
    setTemplateSheet(true);
  }

  function handleApplyTemplate(template: TemplateSummary) {
    setTemplateSheet(false);
    applyTemplate(template.id, selectedDate);
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <WeekBar
          weekDays={weekDays}
          selectedDate={selectedDate}
          todayDate={todayDate}
          weekLabel={formatWeekLabel(selectedDate)}
          onSelectDate={setSelectedDate}
          onPrevWeek={goPrevWeek}
          onNextWeek={goNextWeek}
        />

        {selectedDay ? (
          <DayCard
            day={selectedDay}
            onEdit={() =>
              router.push({ pathname: '/modals/add-exercise', params: { date: selectedDate } })
            }
            onApplyTemplate={openTemplateSheet}
            onToggleRest={() => setDateAsRest(selectedDate, !selectedDay.isRestDay)}
          />
        ) : null}
      </ScrollView>

      <Modal
        visible={templateSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setTemplateSheet(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setTemplateSheet(false)}>
          <Pressable style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Template toepassen</Text>
            {templates.length === 0 ? (
              <EmptyState
                icon="clipboard-outline"
                title="Geen templates"
                subtitle="Maak eerst een template aan in het Templates-tabblad."
              />
            ) : (
              templates.map((t) => (
                <Pressable
                  key={t.id}
                  style={styles.sheetItem}
                  onPress={() => handleApplyTemplate(t)}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetItemName}>{t.name}</Text>
                    <Text style={styles.sheetItemSub}>
                      {t.dayCount} {t.dayCount === 1 ? 'dag' : 'dagen'}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                </Pressable>
              ))
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xl + spacing.lg,
    gap: spacing.lg,
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
    gap: spacing.sm,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.sm,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
  },
  sheetItemName: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  sheetItemSub: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
  },
});
