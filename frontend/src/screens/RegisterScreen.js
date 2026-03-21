import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
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
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.title}>Регистрация</Text>

          <Text style={styles.label}>Имя *</Text>
          <TextInput style={styles.input} placeholder="Например: Иван" value={name} onChangeText={setName} autoCorrect={false} />

          <Text style={styles.label}>Email *</Text>
          <TextInput
            style={styles.input}
            placeholder="example@mail.ru"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />

          <Text style={styles.label}>Пароль * (мин. 6 символов)</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0 }]}
              placeholder="••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="password"
            />
            <TouchableOpacity style={styles.showBtn} onPress={() => setShowPassword((v) => !v)}>
              <Text style={styles.showText}>{showPassword ? 'Скрыть' : 'Показать'}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Повторите пароль *</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Год рождения (необязательно)</Text>
          <TextInput style={styles.input} placeholder="2000" value={birthYear}
            onChangeText={setBirthYear} keyboardType="numeric" maxLength={4} />

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Создать аккаунт</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.link}>Уже есть аккаунт? Войти</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  scroll: { padding: 20, justifyContent: 'center', flexGrow: 1 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 28, elevation: 4, shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 26, fontWeight: 'bold', textAlign: 'center', color: '#4F8EF7', marginBottom: 20 },
  label: { fontSize: 13, color: '#666', marginBottom: 4, marginLeft: 2 },
  input: { borderWidth: 1, borderColor: '#DDE3F0', borderRadius: 12, padding: 13, fontSize: 15, marginBottom: 14, backgroundColor: '#F8FAFF' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  showBtn: { paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#DDE3F0' },
  showText: { color: '#4F8EF7', fontWeight: '700' },
  button: { backgroundColor: '#4F8EF7', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#4F8EF7', marginTop: 18, fontSize: 14 },
});
