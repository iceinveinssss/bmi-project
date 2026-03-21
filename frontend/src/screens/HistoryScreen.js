import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, RefreshControl, TextInput
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bmiApi } from '../api/bmi';
import { useSettings } from '../context/SettingsContext';
import { HISTORY_CACHE_KEY } from '../storage/cacheKeys';
import { fromMetricHeight, fromMetricWeight, UNITS, round1 } from '../utils/units';
import { useTheme } from '../theme/useTheme';

const CATEGORY_COLORS = {
  'Норма': '#4CAF50',
  'Недостаточная масса тела': '#74AAEF',
  'Выраженный дефицит массы': '#5B8DEF',
  'Избыточная масса тела': '#FFC107',
  'Ожирение I степени': '#FF9800',
  'Ожирение II степени': '#FF5722',
  'Ожирение III степени': '#F44336',
};

function formatDate(dateString) {
  const d = new Date(dateString);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function HistoryScreen({ navigation }) {
  const settingsCtx = useSettings();
  const units = settingsCtx?.settings?.units || 'metric';
  const unitLabels = UNITS[units] || UNITS.metric;
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();

  const [allRecords, setAllRecords] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('');

  const loadHistory = async () => {
    try {
      const data = await bmiApi.getHistory();
      setAllRecords(data);
      const category = categoryFilter.trim();
      if (category) {
        const lc = category.toLowerCase();
        setRecords(data.filter(r => String(r.category || '').toLowerCase().includes(lc)));
      } else {
        setRecords(data);
      }
      setOffline(false);
      const payload = { savedAt: new Date().toISOString(), data };
      setLastSync(payload.savedAt);
      await AsyncStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
      const cached = await AsyncStorage.getItem(HISTORY_CACHE_KEY);
      if (cached) {
        try {
          const payload = JSON.parse(cached);
          const cachedRecords = payload?.data ?? [];
          setAllRecords(cachedRecords);
          const category = categoryFilter.trim();
          if (category) {
            const lc = category.toLowerCase();
            setRecords(cachedRecords.filter(r => String(r.category || '').toLowerCase().includes(lc)));
          } else {
            setRecords(cachedRecords);
          }
          setLastSync(payload?.savedAt ?? null);
          setOffline(true);
        } catch {
          Alert.alert('Ошибка', e.message);
        }
      } else {
        Alert.alert('Ошибка', e.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadHistory(); }, []));

  const applyFilter = async () => {
    const category = categoryFilter.trim();
    if (!category) {
      setRecords(allRecords);
      return;
    }

    setRefreshing(true);
    try {
      if (offline) {
        const lc = category.toLowerCase();
        setRecords(allRecords.filter(r => String(r.category || '').toLowerCase().includes(lc)));
      } else {
        const data = await bmiApi.searchByCategory(category);
        setRecords(data);
      }
    } catch (e) {
      const lc = category.toLowerCase();
      if (allRecords.length > 0) {
        setRecords(allRecords.filter(r => String(r.category || '').toLowerCase().includes(lc)));
      } else {
        Alert.alert('Ошибка', e.message);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const clearFilter = () => {
    setCategoryFilter('');
    setRecords(allRecords);
  };

  const handleDelete = (id) => {
    Alert.alert('Удалить запись?', 'Это действие нельзя отменить', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Удалить', style: 'destructive',
        onPress: async () => {
          try {
            await bmiApi.deleteRecord(id);
            setAllRecords(prev => {
              const next = prev.filter(r => r.id !== id);
              AsyncStorage.setItem(HISTORY_CACHE_KEY, JSON.stringify({ savedAt: new Date().toISOString(), data: next })).catch(() => {});
              return next;
            });
            setRecords(prev => prev.filter(r => r.id !== id));
          } catch (e) { Alert.alert('Ошибка', e.message); }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (records.length === 0) return (
    <View style={[styles.center, { backgroundColor: colors.background }]}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={[styles.emptyText, { color: colors.text }]}>История пуста</Text>
      <Text style={[styles.emptySubtext, { color: colors.textMuted }]}>Сделайте первый расчёт ИМТ</Text>
    </View>
  );

  return (
    <FlatList
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ padding: 16, paddingBottom: tabBarHeight + 24 }}
      data={records}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} />}
      ListHeaderComponent={
        <View style={{ marginBottom: 14 }}>
          {offline && (
            <View style={[styles.offlineBanner, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
              <Text style={[styles.offlineText, { color: colors.warningText }]}>
                Оффлайн-режим: показана последняя сохранённая копия{lastSync ? ` (${formatDate(lastSync)})` : ''}
              </Text>
            </View>
          )}
          <View style={[styles.filterCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>Фильтр по категории</Text>
            <TextInput
              style={[styles.filterInput, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text }]}
              placeholder="Например: Норма"
              placeholderTextColor={colors.placeholder}
              value={categoryFilter}
              onChangeText={setCategoryFilter}
              autoCapitalize="sentences"
              selectionColor={colors.primary}
            />
            <View style={styles.filterActions}>
              <TouchableOpacity style={[styles.filterBtn, { backgroundColor: colors.primary }]} onPress={applyFilter}>
                <Text style={[styles.filterBtnText, { color: colors.primaryText }]}>Применить</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.filterBtnSecondary, { backgroundColor: colors.surface2, borderColor: colors.border }]} onPress={clearFilter}>
                <Text style={[styles.filterBtnSecondaryText, { color: colors.primary }]}>Сбросить</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={[styles.header, { color: colors.text }]}>История измерений ({records.length})</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const color = CATEGORY_COLORS[item.category] || colors.primary;
        const weight = round1(fromMetricWeight(Number(item.weight), units));
        const height = round1(fromMetricHeight(Number(item.height), units));
        return (
          <View style={[styles.card, { backgroundColor: colors.surface }, index === 0 && [styles.latestCard, { borderColor: colors.primary }]]}>
            {index === 0 && (
              <Text style={[styles.latestBadge, { backgroundColor: colors.primary, color: colors.primaryText }]}>
                Последнее
              </Text>
            )}
            <View style={styles.row}>
              <View>
                <Text style={[styles.bmi, { color }]}>{item.bmi}</Text>
                <Text style={[styles.bmiLabel, { color: colors.textMuted }]}>ИМТ</Text>
              </View>
              <View style={styles.details}>
                <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
                  <Text style={[styles.badgeText, { color }]}>{item.category}</Text>
                </View>
                <Text style={[styles.meta, { color: colors.textSecondary }]}>
                  Вес: {weight} {unitLabels.weightLabel} · Рост: {height} {unitLabels.heightLabel}
                </Text>
                <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(item.measuredAt)}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.editBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
                onPress={() => navigation.navigate('RecordDetails', { recordId: item.id })}
              >
                <Text style={[styles.editText, { color: colors.primary }]}>✏️ Изменить</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.deleteBtn, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}
                onPress={() => handleDelete(item.id)}
              >
                <Text style={[styles.deleteText, { color: colors.danger }]}>🗑 Удалить</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 20, fontWeight: 'bold', marginBottom: 14 },
  offlineBanner: { borderWidth: 1, padding: 10, borderRadius: 12, marginBottom: 10 },
  offlineText: { fontSize: 12, fontWeight: '800' },
  filterCard: { borderRadius: 16, padding: 14, elevation: 2, shadowOpacity: 0.06, marginBottom: 12 },
  filterTitle: { fontSize: 14, fontWeight: '800', marginBottom: 8 },
  filterInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14 },
  filterActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  filterBtn: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  filterBtnText: { fontWeight: 'bold' },
  filterBtnSecondary: { flex: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1 },
  filterBtnSecondaryText: { fontWeight: 'bold' },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold' },
  emptySubtext: { fontSize: 14, marginTop: 4 },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowOpacity: 0.07, shadowRadius: 6 },
  latestCard: { borderWidth: 1.5 },
  latestBadge: { position: 'absolute', top: -10, right: 14, fontSize: 11, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10, fontWeight: 'bold', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  bmi: { fontSize: 40, fontWeight: 'bold' },
  bmiLabel: { fontSize: 11, textAlign: 'center' },
  details: { flex: 1 },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 13 },
  date: { fontSize: 12, marginTop: 4 },
  actions: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  editBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  editText: { fontSize: 13, fontWeight: '800' },
  deleteBtn: { flex: 1, borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1 },
  deleteText: { fontSize: 13, fontWeight: '800' },
});
