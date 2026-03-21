import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/useTheme';

export default function LoginScreen({ navigation }) {
  const { login } = useAuth();
  const { colors } = useTheme();
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
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.primary }]}>⚖️ ИМТ Калькулятор</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Войдите в аккаунт</Text>

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
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginBottom: 0, borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text }]}
              placeholder="Пароль"
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

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.primaryText} /> : <Text style={[styles.buttonText, { color: colors.primaryText }]}>Войти</Text>}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={[styles.link, { color: colors.primary }]}>Нет аккаунта? Зарегистрироваться</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  scroll: { padding: 20, justifyContent: 'center', flexGrow: 1, paddingBottom: 40 },
  card: { borderRadius: 20, padding: 30, elevation: 4, shadowOpacity: 0.1, shadowRadius: 10 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 24 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 16, marginBottom: 14 },
  passwordRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  showBtn: { paddingHorizontal: 12, paddingVertical: 12, borderRadius: 12, borderWidth: 1 },
  showText: { fontWeight: '800' },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 6 },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
  link: { textAlign: 'center', marginTop: 18, fontSize: 14, fontWeight: '700' },
});
