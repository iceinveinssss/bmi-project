import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, RefreshControl
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bmiApi } from '../api/bmi';
import { STATS_CACHE_KEY } from '../storage/cacheKeys';
import { useTheme } from '../theme/useTheme';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const loadStats = async () => {
    try {
      const data = await bmiApi.getStats();
      setStats(data);
      setOffline(false);
      const payload = { savedAt: new Date().toISOString(), data };
      setLastSync(payload.savedAt);
      await AsyncStorage.setItem(STATS_CACHE_KEY, JSON.stringify(payload));
    } catch (e) {
      const cached = await AsyncStorage.getItem(STATS_CACHE_KEY);
      if (cached) {
        try {
          const payload = JSON.parse(cached);
          setStats(payload?.data ?? null);
          setLastSync(payload?.savedAt ?? null);
          setOffline(true);
        } catch {
          setStats(null);
          setOffline(false);
        }
      } else {
        setStats(null);
        setOffline(false);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => { loadStats(); }, []));

  const handleLogout = () => {
    Alert.alert('Выход', 'Вы уверены, что хотите выйти?', [
      { text: 'Отмена', style: 'cancel' },
      { text: 'Выйти', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />}
    >
      {/* Аватар и имя */}
      <View style={[styles.avatarCard, { backgroundColor: colors.primary }]}>
        <View style={styles.avatar}>
          <Text style={[styles.avatarText, { color: colors.primaryText }]}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={[styles.name, { color: colors.primaryText }]}>{user?.name}</Text>
        <Text style={[styles.email, { color: colors.primaryText }]}>{user?.email}</Text>
        {user?.role === 'ADMIN' && (
          <View style={styles.adminBadge}>
            <Text style={[styles.adminText, { color: colors.primaryText }]}>Администратор</Text>
          </View>
        )}
      </View>

      {/* Статистика */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>📊 Статистика</Text>
      </View>
      {offline && (
        <View style={[styles.offlineBanner, { backgroundColor: colors.warningBg, borderColor: colors.warningBorder }]}>
          <Text style={[styles.offlineText, { color: colors.warningText }]}>
            Оффлайн-режим: показана последняя сохранённая копия{lastSync ? ` (${new Date(lastSync).toLocaleString('ru-RU')})` : ''}
          </Text>
        </View>
      )}
      {loading ? (
        <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
      ) : stats && stats.totalMeasurements > 0 ? (
        <>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.totalMeasurements}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Измерений</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stats.averageBmi}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Средний ИМТ</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statValue, { color: colors.success }]}>{stats.minBmi}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Минимум</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.statValue, { color: '#FF9800' }]}>{stats.maxBmi}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Максимум</Text>
            </View>
          </View>
          <View style={[styles.currentCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.currentLabel, { color: colors.textMuted }]}>Текущая категория</Text>
            <Text style={[styles.currentCategory, { color: colors.text }]}>{stats.currentCategory}</Text>
          </View>
        </>
      ) : (
        <View style={[styles.noStats, { backgroundColor: colors.surface }]}>
          <Text style={[styles.noStatsText, { color: colors.textSecondary }]}>📏 Нет данных для статистики</Text>
          <Text style={[styles.noStatsSubtext, { color: colors.textMuted }]}>Сделайте первый расчёт ИМТ</Text>
        </View>
      )}

      {/* Информация об аккаунте */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>👤 Аккаунт</Text>
      </View>
      <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
        <InfoRow label="Имя" value={user?.name} />
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Роль" value={user?.role === 'ADMIN' ? 'Администратор' : 'Пользователь'} />
      </View>

      <TouchableOpacity
        style={[styles.editProfileBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => navigation.navigate('EditProfile')}
      >
        <Text style={[styles.editProfileText, { color: colors.primary }]}>✏️ Редактировать профиль</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.surface, borderColor: colors.danger }]} onPress={handleLogout}>
        <Text style={[styles.logoutText, { color: colors.danger }]}>🚪 Выйти из аккаунта</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.text }]}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  avatarCard: { borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 36, fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  email: { fontSize: 14, opacity: 0.85 },
  adminBadge: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4 },
  adminText: { fontSize: 12, fontWeight: 'bold' },
  sectionHeader: { marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold' },
  offlineBanner: { borderWidth: 1, padding: 10, borderRadius: 12, marginBottom: 10 },
  offlineText: { fontSize: 12, fontWeight: '800' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  statCard: { borderRadius: 14, padding: 16, flex: 1, minWidth: '45%', alignItems: 'center', elevation: 2, shadowOpacity: 0.06 },
  statValue: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 2 },
  currentCard: { borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20, elevation: 2 },
  currentLabel: { fontSize: 13 },
  currentCategory: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  noStats: { borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 20 },
  noStatsText: { fontSize: 15, fontWeight: '700' },
  noStatsSubtext: { fontSize: 13, marginTop: 4 },
  infoCard: { borderRadius: 14, padding: 4, marginBottom: 20, elevation: 2, shadowOpacity: 0.06 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5 },
  infoLabel: { fontSize: 15 },
  infoValue: { fontSize: 15, fontWeight: '700' },
  editProfileBtn: { borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, marginBottom: 12 },
  editProfileText: { fontSize: 16, fontWeight: 'bold' },
  logoutBtn: { borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5 },
  logoutText: { fontSize: 16, fontWeight: 'bold' },
});
