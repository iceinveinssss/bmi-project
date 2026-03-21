import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { bmiApi } from '../api/bmi';
import { useSettings } from '../context/SettingsContext';
import { fromMetricHeight, fromMetricWeight, toMetricHeight, toMetricWeight, UNITS, round1 } from '../utils/units';
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
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function RecordDetailScreen({ route, navigation }) {
  const settingsCtx = useSettings();
  const units = settingsCtx?.settings?.units || 'metric';
  const unitLabels = UNITS[units] || UNITS.metric;
  const { colors } = useTheme();

  const recordId = route?.params?.recordId;
  const [record, setRecord] = useState(null);
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadRecord = async () => {
    setLoading(true);
    try {
      const data = await bmiApi.getRecord(recordId);
      setRecord(data);
      const w = fromMetricWeight(Number(data.weight), units);
      const h = fromMetricHeight(Number(data.height), units);
      setWeight(String(round1(w)));
      setHeight(String(round1(h)));
    } catch (e) {
      Alert.alert('Ошибка', e.message);
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!recordId) return;
    loadRecord();
  }, [recordId]);

  const handleSave = async () => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      Alert.alert('Ошибка', 'Введите корректные значения веса и роста');
      return;
    }

    const metricWeight = toMetricWeight(w, units);
    const metricHeight = toMetricHeight(h, units);
    if (metricWeight < 30 || metricWeight > 300) { Alert.alert('Ошибка', 'Вес должен быть в диапазоне 30–300 кг'); return; }
    if (metricHeight < 50 || metricHeight > 250) { Alert.alert('Ошибка', 'Рост должен быть в диапазоне 50–250 см'); return; }

    setSaving(true);
    try {
      await bmiApi.updateRecord(recordId, metricWeight, metricHeight);
      Alert.alert('Готово', 'Запись обновлена');
      navigation.goBack();
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!record) return null;

  const color = CATEGORY_COLORS[record.category] || colors.primary;
  const showWeight = round1(fromMetricWeight(Number(record.weight), units));
  const showHeight = round1(fromMetricHeight(Number(record.height), units));

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.title, { color: colors.text }]}>Запись ИМТ</Text>

        <View style={styles.summary}>
          <Text style={[styles.bmi, { color }]}>{record.bmi}</Text>
          <View style={[styles.badge, { backgroundColor: color + '22', borderColor: color }]}>
            <Text style={[styles.badgeText, { color }]}>{record.category}</Text>
          </View>
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            Вес: {showWeight} {unitLabels.weightLabel} · Рост: {showHeight} {unitLabels.heightLabel}
          </Text>
          <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(record.measuredAt)}</Text>
        </View>

        <Text style={[styles.label, { color: colors.textSecondary }]}>Вес ({unitLabels.weightLabel})</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text }]}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          placeholder={units === 'imperial' ? 'Например: 154' : 'Например: 70'}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
        />

        <Text style={[styles.label, { color: colors.textSecondary }]}>Рост ({unitLabels.heightLabel})</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text }]}
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
          placeholder={units === 'imperial' ? 'Например: 69' : 'Например: 175'}
          placeholderTextColor={colors.placeholder}
          selectionColor={colors.primary}
        />

        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.primaryText} /> : <Text style={[styles.buttonText, { color: colors.primaryText }]}>Сохранить</Text>}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { borderRadius: 18, padding: 18, elevation: 2, shadowOpacity: 0.06 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 14, textAlign: 'center' },
  summary: { alignItems: 'center', marginBottom: 18 },
  bmi: { fontSize: 54, fontWeight: 'bold' },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  date: { fontSize: 12, marginTop: 10 },
  meta: { fontSize: 13, marginTop: 10, textAlign: 'center' },
  label: { fontSize: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 16, marginBottom: 14 },
  button: { borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 6 },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
});
