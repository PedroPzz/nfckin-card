import React from 'react';
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme/colors';
import { useAuth } from '../store/auth';
import { useCards } from '../store/cards';

export function SettingsScreen() {
  const nav = useNavigation<any>();
  const { userInfo, logout, email } = useAuth();
  const { cards, lastSyncAt, sync, status } = useCards();
  const [autoSync, setAutoSync] = React.useState(true);

  function confirmLogout() {
    Alert.alert('Sair', 'Isso apaga o token e as credenciais salvas no dispositivo.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: () => logout() },
    ]);
  }

  async function manualSync() {
    try {
      await sync();
      Alert.alert('Sincronizado', 'Cards atualizados a partir do nfckin.com.');
    } catch (e: any) {
      Alert.alert('Erro', e?.message || 'Falha ao sincronizar');
    }
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.md }}>
      <View style={styles.card}>
        <Text style={styles.section}>Conta</Text>
        <Row label="Email" value={userInfo?.email || email || '—'} />
        <Row label="Apelido" value={userInfo?.nickname || '—'} />
        <Row label="Telefone" value={userInfo?.phone || '—'} />
        <Row label="Membro desde" value={userInfo?.createdAt || '—'} />
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Sincronização</Text>
        <Row label="Cards em cache" value={String(cards.length)} />
        <Row
          label="Última sync"
          value={lastSyncAt ? new Date(lastSyncAt).toLocaleString() : 'nunca'}
        />
        <View style={styles.switchRow}>
          <Text style={{ color: colors.text, flex: 1 }}>Auto-sync ao abrir o app</Text>
          <Switch
            value={autoSync}
            onValueChange={setAutoSync}
            trackColor={{ true: colors.primary, false: colors.surfaceAlt }}
            thumbColor="#fff"
          />
        </View>
        <TouchableOpacity style={styles.primaryBtn} onPress={manualSync} disabled={status === 'syncing'}>
          <Text style={styles.primaryText}>
            {status === 'syncing' ? 'Sincronizando…' : 'Sincronizar agora'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.section}>Sobre</Text>
        <Text style={styles.about}>
          Este app gerencia seus cards NFCkin de forma independente, chamando a API interna do
          nfckin.com. A sessão do site expira em ~1 minuto — o app re-autentica automaticamente
          usando as credenciais guardadas no Keychain/Keystore.
        </Text>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() => Linking.openURL('http://nfckin.com').catch(() => {})}
        >
          <Text style={{ color: colors.primary }}>Abrir nfckin.com no navegador</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.linkBtn}
          onPress={() =>
            Alert.alert(
              'Contato do suporte NFCkin',
              'xushiqin66@163.com',
              [{ text: 'Fechar' }, { text: 'Copiar email', onPress: () => {} }]
            )
          }
        >
          <Text style={{ color: colors.primary }}>Suporte oficial do NFCkin</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.dangerBtn} onPress={confirmLogout}>
        <Text style={{ color: '#fff', fontWeight: '700' }}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  section: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.textMuted, fontSize: 14 },
  rowValue: { color: colors.text, fontSize: 14, flexShrink: 1, marginLeft: spacing.md },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  primaryText: { color: colors.bg, fontWeight: '700' },
  dangerBtn: {
    backgroundColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  linkBtn: { paddingVertical: spacing.sm },
  about: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
});
