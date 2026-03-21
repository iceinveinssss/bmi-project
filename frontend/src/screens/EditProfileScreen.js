import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/user';
import { useTheme } from '../theme/useTheme';

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
  const { colors } = useTheme();
  const [name, setName] = useState(user?.name ?? '');
  const [birthYear, setBirthYear] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let alive = true;
    userApi.getMe()
      .then((profile) => {
        if (!alive) return;
        setName(profile?.name ?? '');
        setBirthYear(profile?.birthYear ? String(profile.birthYear) : '');
      })
      .catch((e) => Alert.alert('Ошибка', e.message))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Ошибка', 'Имя не может быть пустым');
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

    setSaving(true);
    try {
      const updated = await userApi.updateMe({ name: trimmedName, birthYear: by });
      await updateUser({
        name: updated?.name ?? trimmedName,
        birthYear: updated?.birthYear ?? by,
        role: updated?.role,
      });
      Alert.alert('Готово', 'Профиль обновлён');
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

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.title, { color: colors.text }]}>Редактирование профиля</Text>

          <Text style={[styles.label, { color: colors.textSecondary }]}>Имя</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.surface2, color: colors.text }]}
            placeholder="Ваше имя"
            placeholderTextColor={colors.placeholder}
            value={name}
            onChangeText={setName}
            autoCorrect={false}
            selectionColor={colors.primary}
          />

          <Text style={[styles.label, { color: colors.textSecondary }]}>Год рождения</Text>
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

          <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color={colors.primaryText} /> : <Text style={[styles.buttonText, { color: colors.primaryText }]}>Сохранить</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { borderRadius: 20, padding: 22, elevation: 3, shadowOpacity: 0.08, shadowRadius: 8 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 14, textAlign: 'center' },
  label: { fontSize: 13, marginBottom: 6, marginLeft: 2 },
  input: { borderWidth: 1, borderRadius: 12, padding: 13, fontSize: 15, marginBottom: 14 },
  button: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 6 },
  buttonText: { fontSize: 16, fontWeight: 'bold' },
});
