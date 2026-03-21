import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../context/SettingsContext';
import { HISTORY_CACHE_KEY, STATS_CACHE_KEY } from '../storage/cacheKeys';
import { API_BASE_URL } from '../api/client';
import { UNITS } from '../utils/units';

function formatDateTime(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('ru-RU');
  } catch {
    return '—';
  }
}

async function readCache(key) {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export default function SettingsScreen() {
  const settingsCtx = useSettings();
  const [refreshing, setRefreshing] = useState(false);
  const [historyInfo, setHistoryInfo] = useState(null);
  const [statsInfo, setStatsInfo] = useState(null);

  const loadInfo = useCallback(async () => {
    const [history, stats] = await Promise.all([readCache(HISTORY_CACHE_KEY), readCache(STATS_CACHE_KEY)]);
    setHistoryInfo({
      savedAt: history?.savedAt ?? null,
      count: Array.isArray(history?.data) ? history.data.length : 0,
    });
    setStatsInfo({
      savedAt: stats?.savedAt ?? null,
      hasData: !!stats?.data,
    });
  }, []);

  useEffect(() => {
    loadInfo();
  }, [loadInfo]);

  if (!settingsCtx) return null;
  const { settings, loading, setUnits, clearOfflineCache } = settingsCtx;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F8EF7" />
      </View>
    );
  }

  const units = settings.units || 'metric';
  const unitsLabel = units === 'imperial' ? 'Имперские' : 'Метрические';

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadInfo();
    } finally {
      setRefreshing(false);
    }
  };

  const handleClearCache = () => {
    Alert.alert('Очистить кэш?', 'Будут удалены оффлайн-данные истории и статистики', [
      { text: 'Отмена', style: 'cancel' },
      {
        text: 'Очистить',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearOfflineCache();
            await loadInfo();
            Alert.alert('Готово', 'Кэш очищен');
          } catch (e) {
            Alert.alert('Ошибка', e?.message ?? 'Не удалось очистить кэш');
          }
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Настройки</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Единицы измерения</Text>
        <Text style={styles.muted}>Текущие: {unitsLabel}</Text>

        <View style={styles.segment}>
          <TouchableOpacity
            style={[styles.segmentBtn, units === 'metric' && styles.segmentBtnActive]}
            onPress={() => setUnits('metric')}
          >
            <Text style={[styles.segmentText, units === 'metric' && styles.segmentTextActive]}>
              Метрические ({UNITS.metric.weightLabel}/{UNITS.metric.heightLabel})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.segmentBtn, units === 'imperial' && styles.segmentBtnActive]}
            onPress={() => setUnits('imperial')}
          >
            <Text style={[styles.segmentText, units === 'imperial' && styles.segmentTextActive]}>
              Имперские ({UNITS.imperial.weightLabel}/{UNITS.imperial.heightLabel})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Оффлайн-данные</Text>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>История</Text>
          <Text style={styles.rowValue}>
            {historyInfo ? `${historyInfo.count} записей · ${formatDateTime(historyInfo.savedAt)}` : '—'}
          </Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>Статистика</Text>
          <Text style={styles.rowValue}>
            {statsInfo ? `${statsInfo.hasData ? 'есть' : 'нет'} · ${formatDateTime(statsInfo.savedAt)}` : '—'}
          </Text>
        </View>

        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearCache}>
          <Text style={styles.dangerText}>Очистить кэш</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Сервер</Text>
        <Text style={styles.muted}>API: {API_BASE_URL}</Text>
        <Text style={styles.mutedSmall}>Если вход/регистрация не работают — проверь, что бэкенд запущен.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FF' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#2D3A5E', marginBottom: 12, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 16, marginBottom: 12, elevation: 2, shadowOpacity: 0.06 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3A5E', marginBottom: 8 },
  muted: { color: '#666', marginBottom: 10 },
  mutedSmall: { color: '#888', marginTop: 6, fontSize: 12 },
  segment: { flexDirection: 'row', gap: 10 },
  segmentBtn: { flex: 1, backgroundColor: '#F8FAFF', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#DDE3F0' },
  segmentBtnActive: { backgroundColor: '#4F8EF7', borderColor: '#4F8EF7' },
  segmentText: { fontSize: 13, color: '#2D3A5E', fontWeight: '700', textAlign: 'center' },
  segmentTextActive: { color: '#fff' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#EEF1F8' },
  rowLabel: { color: '#666', fontSize: 14 },
  rowValue: { color: '#2D3A5E', fontSize: 13, fontWeight: '600', maxWidth: '65%', textAlign: 'right' },
  dangerBtn: { marginTop: 12, backgroundColor: '#FFF5F5', borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#FFD3D3' },
  dangerText: { color: '#FF5252', fontSize: 15, fontWeight: 'bold' },
});

