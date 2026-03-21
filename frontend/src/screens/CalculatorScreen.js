import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { bmiApi } from '../api/bmi';
import { useSettings } from '../context/SettingsContext';
import { fromMetricHeight, fromMetricWeight, toMetricHeight, toMetricWeight, UNITS, round1 } from '../utils/units';

const BMI_COLORS = {
  'Выраженный дефицит массы': '#5B8DEF',
  'Недостаточная масса тела': '#74AAEF',
  'Норма': '#4CAF50',
  'Избыточная масса тела': '#FFC107',
  'Ожирение I степени': '#FF9800',
  'Ожирение II степени': '#FF5722',
  'Ожирение III степени': '#F44336',
};

export default function CalculatorScreen() {
  const settingsCtx = useSettings();
  const units = settingsCtx?.settings?.units || 'metric';
  const unitLabels = UNITS[units] || UNITS.metric;

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

  const bmiColor = result ? (BMI_COLORS[result.category] || '#4F8EF7') : '#4F8EF7';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Расчёт ИМТ</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Вес ({unitLabels.weightLabel})</Text>
        <TextInput
          style={styles.input}
          placeholder={units === 'imperial' ? 'Например: 154' : 'Например: 70'}
          value={weight}
          onChangeText={setWeight}
          keyboardType="decimal-pad"
        />
        <Text style={styles.label}>Рост ({unitLabels.heightLabel})</Text>
        <TextInput
          style={styles.input}
          placeholder={units === 'imperial' ? 'Например: 69' : 'Например: 175'}
          value={height}
          onChangeText={setHeight}
          keyboardType="decimal-pad"
        />
        <TouchableOpacity style={styles.button} onPress={handleCalculate} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Рассчитать</Text>}
        </TouchableOpacity>
      </View>

      {result && (
        <View style={[styles.resultCard, { borderColor: bmiColor }]}>
          <Text style={styles.resultLabel}>Ваш ИМТ</Text>
          <Text style={[styles.bmiValue, { color: bmiColor }]}>{result.bmi}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: bmiColor }]}>
            <Text style={styles.categoryText}>{result.category}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detail}>Вес: <Text style={styles.detailBold}>{result.weight} {unitLabels.weightLabel}</Text></Text>
            <Text style={styles.detail}>Рост: <Text style={styles.detailBold}>{result.height} {unitLabels.heightLabel}</Text></Text>
          </View>
          <Text style={styles.savedNote}>✅ Результат сохранён в историю</Text>
        </View>
      )}

      <View style={styles.referenceCard}>
        <Text style={styles.refTitle}>Таблица ИМТ</Text>
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
            <Text style={styles.refRange}>{range}</Text>
            <Text style={styles.refLabel}>{label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 16, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#2D3A5E', marginBottom: 16, textAlign: 'center' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 16, elevation: 3, shadowOpacity: 0.08, shadowRadius: 8 },
  label: { fontSize: 14, color: '#666', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#DDE3F0', borderRadius: 12, padding: 13, fontSize: 16, marginBottom: 16, backgroundColor: '#F8FAFF' },
  button: { backgroundColor: '#4F8EF7', borderRadius: 12, padding: 15, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  resultCard: { backgroundColor: '#fff', borderRadius: 18, padding: 22, marginBottom: 16, borderWidth: 2, alignItems: 'center', elevation: 3 },
  resultLabel: { fontSize: 14, color: '#888', marginBottom: 4 },
  bmiValue: { fontSize: 64, fontWeight: 'bold' },
  categoryBadge: { borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6, marginTop: 8, marginBottom: 14 },
  categoryText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  detailRow: { flexDirection: 'row', gap: 20 },
  detail: { fontSize: 14, color: '#666' },
  detailBold: { fontWeight: 'bold', color: '#333' },
  savedNote: { marginTop: 12, fontSize: 13, color: '#4CAF50' },
  referenceCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, elevation: 2, shadowOpacity: 0.06 },
  refTitle: { fontSize: 16, fontWeight: 'bold', color: '#2D3A5E', marginBottom: 12 },
  refRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  refDot: { width: 12, height: 12, borderRadius: 6, marginRight: 10 },
  refRange: { width: 80, fontSize: 13, color: '#444', fontWeight: '500' },
  refLabel: { fontSize: 13, color: '#666' },
});
