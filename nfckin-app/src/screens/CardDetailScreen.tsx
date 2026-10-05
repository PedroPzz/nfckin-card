import React from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme/colors';
import { useCards } from '../store/cards';

export function CardDetailScreen() {
  const nav = useNavigation<any>();
  const route = useRoute<any>();
  const ncode: string = route.params?.ncode;
  const { cards, updateGoTo, removeLocal } = useCards();
  const card = cards.find((c) => c.ncode === ncode);
  const [goTo, setGoTo] = React.useState(card?.goTo || '');
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setGoTo(card?.goTo || '');
  }, [card?.goTo]);

  async function save() {
    if (!goTo.trim()) {
      Alert.alert('URL vazia', 'Informe uma Redirect URL válida.');
      return;
    }
    setSaving(true);
    try {
      await updateGoTo(ncode, goTo.trim());
      Alert.alert('Salvo ✓', 'Redirect URL atualizada no nfckin.com e localmente.');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Não foi possível salvar.');
    } finally {
      setSaving(false);
    }
  }

  function confirmRemove() {
    Alert.alert(
      'Remover localmente?',
      'Isso apaga o card apenas do cache deste app. Ele continua ativo no nfckin.com.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => {
            removeLocal(ncode);
            nav.goBack();
          },
        },
      ]
    );
  }

  if (!card) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Card não encontrado no cache.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.md }}>
      <View style={styles.card}>
        <Text style={styles.label}>ncode (QR)</Text>
        <Text style={styles.mono}>{card.ncode}</Text>

        {card.jhm ? (
          <>
            <Text style={styles.label}>jhm (ativação)</Text>
            <Text style={styles.mono}>{card.jhm}</Text>
          </>
        ) : null}

        {card.createdAt ? (
          <>
            <Text style={styles.label}>Criado em</Text>
            <Text style={{ color: colors.text }}>{String(card.createdAt)}</Text>
          </>
        ) : null}

        <Text style={styles.label}>Redirect URL</Text>
        <TextInput
          style={styles.input}
          value={goTo}
          onChangeText={setGoTo}
          placeholder="https://..."
          placeholderTextColor={colors.textDim}
          autoCapitalize="none"
          keyboardType="url"
        />

        <TouchableOpacity style={styles.primaryBtn} onPress={save} disabled={saving}>
          {saving ? <ActivityIndicator color={colors.bg} /> : <Text style={styles.primaryText}>Salvar alterações</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.ghostBtn} onPress={confirmRemove}>
          <Text style={{ color: colors.danger, fontWeight: '600' }}>Remover do cache local</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: 12, marginTop: spacing.md, marginBottom: 4 },
  mono: { color: colors.text, fontFamily: 'monospace', fontSize: 15 },
  input: {
    backgroundColor: colors.bg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  primaryText: { color: colors.bg, fontWeight: '700' },
  ghostBtn: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
});
