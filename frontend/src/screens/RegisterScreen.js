import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/useTheme';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Заполните обязательные поля');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Ошибка', 'Введите корректный email');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль минимум 6 символов');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }
    const by = birthYear ? parseInt(birthYear) : null;
    if (by !== null) {
      const year = new Date().getFullYear();
      if (Number.isNaN(by) || by < 1900 || by > year) {
        Alert.alert('Ошибка', `Год рождения должен быть в диапазоне 1900–${year}`);
        return;
      }
    }
    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password, by);
    } catch (e) {
      Alert.alert('Ошибка регистрации', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.primary }]}>Регистрация</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Имя *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text }]}
            placeholder="Например: Иван"
            placeholderTextColor={colors.placeholder}
            value={name}
            onChangeText={setName}
            autoCorrect={false}
            selectionColor={colors.primary}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Email *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text }]}
            placeholder="example@mail.ru"
            placeholderTextColor={colors.placeholder}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            selectionColor={colors.primary}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Пароль * (мин. 6 символов)</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text }]}
              placeholder="••••••"
              placeholderTextColor={colors.placeholder}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
              selectionColor={colors.primary}
            />
            <TouchableOpacity
              style={[styles.showBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
              onPress={() => setShowPassword((v) => !v)}
            >
              <Text style={[styles.showText, { color: colors.primary }]}>{showPassword ? 'Скрыть' : 'Показать'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Повторите пароль *</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text }]}
            placeholder="••••••"
            placeholderTextColor={colors.placeholder}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
            selectionColor={colors.primary}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Год рождения (необязательно)</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text }]}
            placeholder="2000"
            placeholderTextColor={colors.placeholder}
            value={birthYear}
            onChangeText={setBirthYear}
            keyboardType="numeric"
            maxLength={4}
            selectionColor={colors.primary}
          />

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.primaryText} /> : <Text style={[styles.buttonText, { color: colors.primaryText }]}>Создать аккаунт</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.link, { color: colors.primary }]}>Уже есть аккаунт? Войти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, justifyContent: 'center', flexGrow: 1, paddingBottom: 40 },
  card: { borderRadius: 20, padding: 28, elevation: 4, shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  label: { fontSize: 13, marginBottom: 4, marginLeft: 2 },
  input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 15, marginBottom: 14 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  showBtn: { paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  showText: { fontWeight: '800' },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 6 },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', marginTop: 18, fontSize: 14, fontWeight: '700' },
});
