import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, ScrollView, RefreshControl
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bmiApi } from '../api/bmi';
import { STATS_CACHE_KEY } from '../storage/cacheKeys';

export default function ProfileScreen({ navigation }) {
  const { user, logout } = useAuth();
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
          console.log('Stats error:', e.message);
        }
      } else {
        console.log('Stats error:', e.message);
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
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />}
    >
      {/* Аватар и имя */}
      <View style={styles.avatarCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        {user?.role === 'ADMIN' && (
          <View style={styles.adminBadge}><Text style={styles.adminText}>Администратор</Text></View>
        )}
      </View>

      {/* Статистика */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📊 Статистика</Text>
      </View>
      {offline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            Оффлайн-режим: показана последняя сохранённая копия{lastSync ? ` (${new Date(lastSync).toLocaleString('ru-RU')})` : ''}
          </Text>
        </View>
      )}
      {loading ? (
        <ActivityIndicator color="#4F8EF7" style={{ marginVertical: 20 }} />
      ) : stats && stats.totalMeasurements > 0 ? (
        <>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalMeasurements}</Text>
              <Text style={styles.statLabel}>Измерений</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.averageBmi}</Text>
              <Text style={styles.statLabel}>Средний ИМТ</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#4CAF50' }]}>{stats.minBmi}</Text>
              <Text style={styles.statLabel}>Минимум</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={[styles.statValue, { color: '#FF9800' }]}>{stats.maxBmi}</Text>
              <Text style={styles.statLabel}>Максимум</Text>
            </View>
          </View>
          <View style={styles.currentCard}>
            <Text style={styles.currentLabel}>Текущая категория</Text>
            <Text style={styles.currentCategory}>{stats.currentCategory}</Text>
          </View>
        </>
      ) : (
        <View style={styles.noStats}>
          <Text style={styles.noStatsText}>📏 Нет данных для статистики</Text>
          <Text style={styles.noStatsSubtext}>Сделайте первый расчёт ИМТ</Text>
        </View>
      )}

      {/* Информация об аккаунте */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>👤 Аккаунт</Text>
      </View>
      <View style={styles.infoCard}>
        <InfoRow label="Имя" value={user?.name} />
        <InfoRow label="Email" value={user?.email} />
        <InfoRow label="Роль" value={user?.role === 'ADMIN' ? 'Администратор' : 'Пользователь'} />
      </View>

      <TouchableOpacity style={styles.editProfileBtn} onPress={() => navigation.navigate('EditProfile')}>
        <Text style={styles.editProfileText}>✏️ Редактировать профиль</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>🚪 Выйти из аккаунта</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function InfoRow({ label, value }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 16, paddingBottom: 40 },
  avatarCard: { backgroundColor: '#4F8EF7', borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { fontSize: 36, color: '#fff', fontWeight: 'bold' },
  name: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  adminBadge: { marginTop: 10, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4 },
  adminText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  sectionHeader: { marginBottom: 10, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: '#2D3A5E' },
  offlineBanner: { backgroundColor: '#FFF3CD', borderColor: '#FFEEBA', borderWidth: 1, padding: 10, borderRadius: 12, marginBottom: 10 },
  offlineText: { color: '#856404', fontSize: 12, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 10 },
  statCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, flex: 1, minWidth: '45%', alignItems: 'center', elevation: 2, shadowOpacity: 0.06 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#4F8EF7' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  currentCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', marginBottom: 20, elevation: 2 },
  currentLabel: { fontSize: 13, color: '#888' },
  currentCategory: { fontSize: 18, fontWeight: 'bold', color: '#2D3A5E', marginTop: 4 },
  noStats: { backgroundColor: '#fff', borderRadius: 14, padding: 24, alignItems: 'center', marginBottom: 20 },
  noStatsText: { fontSize: 15, color: '#555' },
  noStatsSubtext: { fontSize: 13, color: '#aaa', marginTop: 4 },
  infoCard: { backgroundColor: '#fff', borderRadius: 14, padding: 4, marginBottom: 20, elevation: 2, shadowOpacity: 0.06 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: '#EEF1F8' },
  infoLabel: { fontSize: 15, color: '#666' },
  infoValue: { fontSize: 15, fontWeight: '500', color: '#2D3A5E' },
  editProfileBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#DDE3F0', marginBottom: 12 },
  editProfileText: { color: '#4F8EF7', fontSize: 16, fontWeight: 'bold' },
  logoutBtn: { backgroundColor: '#fff', borderRadius: 14, padding: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#FF5252' },
  logoutText: { color: '#FF5252', fontSize: 16, fontWeight: 'bold' },
});
