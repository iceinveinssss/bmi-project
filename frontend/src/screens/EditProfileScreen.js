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

export default function EditProfileScreen({ navigation }) {
  const { user, updateUser } = useAuth();
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
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F8EF7" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Редактирование профиля</Text>

          <Text style={styles.label}>Имя</Text>
          <TextInput
            style={styles.input}
            placeholder="Ваше имя"
            value={name}
            onChangeText={setName}
            autoCorrect={false}
          />

          <Text style={styles.label}>Год рождения</Text>
          <TextInput
            style={styles.input}
            placeholder="2000"
            value={birthYear}
            onChangeText={setBirthYear}
            keyboardType="numeric"
            maxLength={4}
          />

          <TouchableOpacity style={styles.button} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Сохранить</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F4FF' },
  content: { padding: 16, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0F4FF' },
  card: { backgroundColor: '#fff', borderRadius: 20, padding: 22, elevation: 3, shadowOpacity: 0.08, shadowRadius: 8 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#2D3A5E', marginBottom: 14, textAlign: 'center' },
  label: { fontSize: 13, color: '#666', marginBottom: 6, marginLeft: 2 },
  input: { borderWidth: 1, borderColor: '#DDE3F0', borderRadius: 12, padding: 13, fontSize: 15, marginBottom: 14, backgroundColor: '#F8FAFF' },
  button: { backgroundColor: '#4F8EF7', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

