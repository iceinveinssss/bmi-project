import React, { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, RefreshControl, TextInput
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bmiApi } from '../api/bmi';
import { useSettings } from '../context/SettingsContext';
import { HISTORY_CACHE_KEY } from '../storage/cacheKeys';
import { fromMetricHeight, fromMetricWeight, UNITS, round1 } from '../utils/units';

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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#4F8EF7" /></View>;

  if (records.length === 0) return (
    <View style={styles.center}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyText}>История пуста</Text>
      <Text style={styles.emptySubtext}>Сделайте первый расчёт ИМТ</Text>
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      data={records}
      keyExtractor={item => String(item.id)}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} />}
      ListHeaderComponent={
        <View style={{ marginBottom: 14 }}>
          {offline && (
            <View style={styles.offlineBanner}>
              <Text style={styles.offlineText}>
                Оффлайн-режим: показана последняя сохранённая копия{lastSync ? ` (${formatDate(lastSync)})` : ''}
              </Text>
            </View>
          )}
          <View style={styles.filterCard}>
            <Text style={styles.filterTitle}>Фильтр по категории</Text>
            <TextInput
              style={styles.filterInput}
              placeholder="Например: Норма"
              value={categoryFilter}
              onChangeText={setCategoryFilter}
              autoCapitalize="sentences"
            />
            <View style={styles.filterActions}>
              <TouchableOpacity style={styles.filterBtn} onPress={applyFilter}>
                <Text style={styles.filterBtnText}>Применить</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterBtnSecondary} onPress={clearFilter}>
                <Text style={styles.filterBtnSecondaryText}>Сбросить</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.header}>История измерений ({records.length})</Text>
        </View>
      }
      renderItem={({ item, index }) => {
        const color = CATEGORY_COLORS[item.category] || '#4F8EF7';
        const weight = round1(fromMetricWeight(Number(item.weight), units));
        const height = round1(fromMetricHeight(Number(item.height), units));
        return (
          <View style={[styles.card, index === 0 && styles.latestCard]}>
            {index === 0 && <Text style={styles.latestBadge}>Последнее</Text>}
            <View style={styles.row}>
              <View>
                <Text style={[styles.bmi, { color }]}>{item.bmi}</Text>
                <Text style={styles.bmiLabel}>ИМТ</Text>
              </View>
              <View style={styles.details}>
                <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
                  <Text style={[styles.badgeText, { color }]}>{item.category}</Text>
                </View>
                <Text style={styles.meta}>
                  Вес: {weight} {unitLabels.weightLabel} · Рост: {height} {unitLabels.heightLabel}
                </Text>
                <Text style={styles.date}>{formatDate(item.measuredAt)}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('RecordDetails', { recordId: item.id })}>
                <Text style={styles.editText}>✏️ Изменить</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.id)}>
                <Text style={styles.deleteText}>🗑 Удалить</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FF' },
  header: { fontSize: 20, fontWeight: 'bold', color: '#2D3A5E', marginBottom: 14 },
  offlineBanner: { backgroundColor: '#FFF3CD', borderColor: '#FFEEBA', borderWidth: 1, padding: 10, borderRadius: 12, marginBottom: 10 },
  offlineText: { color: '#856404', fontSize: 12, fontWeight: '600' },
  filterCard: { backgroundColor: '#fff', borderRadius: 16, padding: 14, elevation: 2, shadowOpacity: 0.06, marginBottom: 12 },
  filterTitle: { fontSize: 14, fontWeight: '700', color: '#2D3A5E', marginBottom: 8 },
  filterInput: { borderWidth: 1, borderColor: '#DDE3F0', borderRadius: 12, padding: 12, fontSize: 14, backgroundColor: '#F8FAFF' },
  filterActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  filterBtn: { flex: 1, backgroundColor: '#4F8EF7', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  filterBtnText: { color: '#fff', fontWeight: 'bold' },
  filterBtnSecondary: { flex: 1, backgroundColor: '#F8FAFF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#DDE3F0' },
  filterBtnSecondaryText: { color: '#4F8EF7', fontWeight: 'bold' },
  emptyIcon: { fontSize: 52, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  emptySubtext: { fontSize: 14, color: '#888', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowOpacity: 0.07, shadowRadius: 6 },
  latestCard: { borderWidth: 1.5, borderColor: '#4F8EF7' },
  latestBadge: { position: 'absolute', top: -10, right: 14, backgroundColor: '#4F8EF7', color: '#fff', fontSize: 11, paddingHorizontal: 10, paddingVertical: 2, borderRadius: 10, fontWeight: 'bold', overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  bmi: { fontSize: 40, fontWeight: 'bold' },
  bmiLabel: { fontSize: 11, color: '#999', textAlign: 'center' },
  details: { flex: 1 },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  meta: { fontSize: 13, color: '#555' },
  date: { fontSize: 12, color: '#999', marginTop: 4 },
  actions: { marginTop: 12, flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  editBtn: { flex: 1, backgroundColor: '#F8FAFF', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#DDE3F0' },
  editText: { fontSize: 13, color: '#4F8EF7', fontWeight: '700' },
  deleteBtn: { flex: 1, backgroundColor: '#FFF5F5', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1, borderColor: '#FFD3D3' },
  deleteText: { fontSize: 13, color: '#FF5252' },
});
