import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Ошибка', 'Заполните все поля');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (e) {
      Alert.alert('Ошибка входа', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <Text style={styles.title}>⚖️ ИМТ Калькулятор</Text>
        <Text style={styles.subtitle}>Войдите в аккаунт</Text>

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
        <View style={styles.passwordRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Пароль"
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

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Войти</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Нет аккаунта? Зарегистрироваться</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 30, elevation: 4, shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', color: '#4F8EF7', marginBottom: 6 },
  subtitle: { fontSize: 16, textAlign: 'center', color: '#888', marginBottom: 24 },
  input: { borderWidth: 1, borderColor: '#DDE3F0', borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 14, backgroundColor: '#F8FAFF' },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  showBtn: { paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, backgroundColor: '#F8FAFF', borderWidth: 1, borderColor: '#DDE3F0' },
  showText: { color: '#4F8EF7', fontWeight: '700' },
  button: { backgroundColor: '#4F8EF7', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', color: '#4F8EF7', marginTop: 18, fontSize: 14 },
});
