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
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSettings } from '../context/SettingsContext';
import { HISTORY_CACHE_KEY, STATS_CACHE_KEY } from '../storage/cacheKeys';
import { UNITS } from '../utils/units';
import { useTheme } from '../theme/useTheme';

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
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
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
  const { settings, loading, setUnits, setTheme, clearOfflineCache } = settingsCtx;

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const units = settings.units || 'metric';
  const unitsLabel = units === 'imperial' ? 'Имперские' : 'Метрические';
  const themeSetting = settings.theme || 'system';

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
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={[styles.title, { color: colors.text }]}>Настройки</Text>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Тема</Text>
        <Text style={[styles.muted, { color: colors.textSecondary }]}>
          Текущая: {themeSetting === 'system' ? 'Системная' : themeSetting === 'dark' ? 'Тёмная' : 'Светлая'}
        </Text>

        <View style={styles.options}>
          {['system', 'light', 'dark'].map((value) => {
            const isActive = themeSetting === value;
            return (
              <TouchableOpacity
                key={value}
                style={[
                  styles.optionBtn,
                  { backgroundColor: colors.surface2, borderColor: colors.border },
                  isActive && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => setTheme(value)}
              >
                <Text style={[styles.optionText, { color: colors.text }, isActive && { color: colors.primaryText }]}>
                  {value === 'system' ? 'Системная' : value === 'dark' ? 'Тёмная' : 'Светлая'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Единицы измерения</Text>
        <Text style={[styles.muted, { color: colors.textSecondary }]}>Текущие: {unitsLabel}</Text>

        <View style={styles.segment}>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              { backgroundColor: colors.surface2, borderColor: colors.border },
              units === 'metric' && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setUnits('metric')}
          >
            <Text style={[styles.segmentText, { color: colors.text }, units === 'metric' && { color: colors.primaryText }]}>
              Метрические ({UNITS.metric.weightLabel}/{UNITS.metric.heightLabel})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.segmentBtn,
              { backgroundColor: colors.surface2, borderColor: colors.border },
              units === 'imperial' && { backgroundColor: colors.primary, borderColor: colors.primary },
            ]}
            onPress={() => setUnits('imperial')}
          >
            <Text style={[styles.segmentText, { color: colors.text }, units === 'imperial' && { color: colors.primaryText }]}>
              Имперские ({UNITS.imperial.weightLabel}/{UNITS.imperial.heightLabel})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Оффлайн-данные</Text>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>История</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>
            {historyInfo ? `${historyInfo.count} записей · ${formatDateTime(historyInfo.savedAt)}` : '—'}
          </Text>
        </View>
        <View style={[styles.row, { borderBottomColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>Статистика</Text>
          <Text style={[styles.rowValue, { color: colors.text }]}>
            {statsInfo ? `${statsInfo.hasData ? 'есть' : 'нет'} · ${formatDateTime(statsInfo.savedAt)}` : '—'}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.dangerBtn, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]}
          onPress={handleClearCache}
        >
          <Text style={[styles.dangerText, { color: colors.danger }]}>Очистить кэш</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12, textAlign: 'center' },
  card: { borderRadius: 18, padding: 16, marginBottom: 12, elevation: 2, shadowOpacity: 0.06 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  muted: { marginBottom: 10 },
  options: { gap: 10 },
  optionBtn: { borderRadius: 14, padding: 12, borderWidth: 1, alignItems: 'center' },
  optionText: { fontSize: 14, fontWeight: '800' },
  segment: { flexDirection: 'row', gap: 10 },
  segmentBtn: { flex: 1, borderRadius: 14, padding: 12, borderWidth: 1 },
  segmentText: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5 },
  rowLabel: { fontSize: 14 },
  rowValue: { fontSize: 13, fontWeight: '700', maxWidth: '65%', textAlign: 'right' },
  dangerBtn: { marginTop: 12, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1.5 },
  dangerText: { fontSize: 15, fontWeight: 'bold' },
});
