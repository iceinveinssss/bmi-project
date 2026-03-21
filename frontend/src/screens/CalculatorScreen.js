import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { bmiApi } from '../api/bmi';
import { useSettings } from '../context/SettingsContext';
import { fromMetricHeight, fromMetricWeight, toMetricHeight, toMetricWeight, UNITS, round1 } from '../utils/units';
import { useTheme } from '../theme/useTheme';

const BMI_COLORS = {
  'Выраженный дефицит массы': '#5B8DEF',
  'Недостаточная масса тела': '#74AAEF',
  'Норма': '#4CAF50',
  'Избыточная масса тела': '#FFC107',
  'Ожирение I степени': '#FF9800',
  'Ожирение II степени': '#FF5722',
  'Ожирение III степени': '#F44336',
};

function getContrastTextColor(hexColor) {
  if (typeof hexColor !== 'string') return '#fff';
  const raw = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  if (![3, 6].includes(raw.length)) return '#fff';
  const hex = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw;

  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if ([r, g, b].some((v) => Number.isNaN(v))) return '#fff';

  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 160 ? '#0B1220' : '#fff';
}

export default function CalculatorScreen() {
  const settingsCtx = useSettings();
  const units = settingsCtx?.settings?.units || 'metric';
  const unitLabels = UNITS[units] || UNITS.metric;
  const { colors } = useTheme();
  const tabBarHeight = useBottomTabBarHeight();

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
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

    setLoading(true);
    try {
      const data = await bmiApi.calculate(metricWeight, metricHeight);
      setResult({
        ...data,
        weight: round1(fromMetricWeight(Number(data.weight), units)),
        height: round1(fromMetricHeight(Number(data.height), units)),
      });
    } catch (e) {
      Alert.alert('Ошибка', e.message);
    } finally {
      setLoading(false);
    }
  };

  const bmiColor = result ? (BMI_COLORS[result.category] || colors.primary) : colors.primary;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarHeight + 24 }]}
    >
      <Text style={[styles.title, { color: colors.text }]}>Расчёт ИМТ</Text>

      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Вес ({unitLabels.weightLabel})</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text }]}
          placeholder={units === 'imperial' ? 'Например: 154' : 'Например: 70'}
          placeholderTextColor={colors.placeholder}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
          selectionColor={colors.primary}
        />
        <Text style={[styles.label, { color: colors.textSecondary }]}>Рост ({unitLabels.heightLabel})</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text }]}
          placeholder={units === 'imperial' ? 'Например: 69' : 'Например: 175'}
          placeholderTextColor={colors.placeholder}
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
          selectionColor={colors.primary}
        />
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleCalculate} disabled={loading}>
          {loading ? <ActivityIndicator color={colors.primaryText} /> : <Text style={[styles.buttonText, { color: colors.primaryText }]}>Рассчитать</Text>}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={[styles.resultCard, { borderColor: bmiColor, backgroundColor: colors.surface }]}>
          <Text style={[styles.resultLabel, { color: colors.textMuted }]}>Ваш ИМТ</Text>
          <Text style={[styles.bmiValue, { color: bmiColor }]}>{result.bmi}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: bmiColor }]}>
            <Text style={[styles.categoryText, { color: getContrastTextColor(bmiColor) }]}>{result.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={[styles.detail, { color: colors.textSecondary }]}>
              Вес: <Text style={[styles.detailBold, { color: colors.text }]}>{result.weight} {unitLabels.weightLabel}</Text>
            </Text>
            <Text style={[styles.detail, { color: colors.textSecondary }]}>
              Рост: <Text style={[styles.detailBold, { color: colors.text }]}>{result.height} {unitLabels.heightLabel}</Text>
            </Text>
          </View>
          <Text style={[styles.savedNote, { color: colors.success }]}>✅ Результат сохранён в историю</Text>
        </View>
      )}

      <View style={[styles.referenceCard, { backgroundColor: colors.surface }]}>
        <Text style={[styles.refTitle, { color: colors.text }]}>Таблица ИМТ</Text>
        {[
          ['< 16', 'Выраженный дефицит', '#5B8DEF'],
          ['16–18.4', 'Недостаточный вес', '#74AAEF'],
          ['18.5–24.9', 'Норма ✓', '#4CAF50'],
          ['25–29.9', 'Избыточный вес', '#FFC107'],
          ['30–34.9', 'Ожирение I', '#FF9800'],
          ['≥ 35', 'Ожирение II–III', '#F44336'],
        ].map(([range, label, color]) => (
          <View key={range} style={styles.refRow}>
            <View style={[styles.refDot, { backgroundColor: color }]} />
            <Text style={[styles.refRange, { color: colors.text }]}>{range}</Text>
            <Text style={[styles.refLabel, { color: colors.textSecondary }]}>{label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  card: { borderRadius: 18, padding: 20, marginBottom: 16, elevation: 3, shadowOpacity: 0.08, shadowRadius: 8 },
  label: { fontSize: 14, marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 16, marginBottom: 16 },
  button: { borderRadius: 12, padding: 15, alignItems: 'center' },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
  resultCard: { borderRadius: 18, padding: 22, marginBottom: 16, borderWidth: 2, alignItems: 'center', elevation: 3 },
  resultLabel: { fontSize: 14, marginBottom: 4 },
  bmiValue: { fontSize: 64, fontWeight: 'bold' },
  categoryBadge: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6, marginTop: 8, marginBottom: 14 },
  categoryText: { fontWeight: 'bold', fontSize: 14 },
  detailRow: { flexDirection: 'row', gap: 20 },
  detail: { fontSize: 14 },
  detailBold: { fontWeight: 'bold' },
  savedNote: { marginTop: 12, fontSize: 13 },
  referenceCard: { borderRadius: 18, padding: 18, elevation: 2, shadowOpacity: 0.06 },
  refTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  refRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  refDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  refRange: { width: 80, fontSize: 13, fontWeight: '700' },
  refLabel: { fontSize: 13 },
});
