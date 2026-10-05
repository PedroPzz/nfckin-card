import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme/colors';
import { useCards } from '../store/cards';
import { useAuth } from '../store/auth';
import { NfcCard } from '../api/nfckin';

function shortDate(ts?: number | null) {
  if (!ts) return 'nunca';
  const d = new Date(ts);
  return d.toLocaleString();
}

function CardRow({ item, onPress }: { item: NfcCard; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.rowLeft}>
        <Text style={styles.ncode} numberOfLines={1}>
          {item.ncode}
        </Text>
        <Text style={styles.goTo} numberOfLines={1}>
          {item.goTo || '— sem redirect —'}
        </Text>
        {item.jhm ? <Text style={styles.jhm}>jhm: {item.jhm}</Text> : null}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export function HomeScreen() {
  const nav = useNavigation<any>();
  const { cards, total, lastSyncAt, status, error, sync, hydrate } = useCards();
  const { userInfo, token } = useAuth();

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  React.useEffect(() => {
    if (token) {
      sync().catch(() => {});
    }
  }, [token]);

  const onRefresh = React.useCallback(() => {
    sync().catch(() => {});
  }, [sync]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.hello}>Olá, {userInfo?.nickname || userInfo?.email || 'usuário'}</Text>
          <Text style={styles.meta}>
            {cards.length} / {total} cards · última sync: {shortDate(lastSyncAt)}
          </Text>
          {status === 'error' && error ? <Text style={styles.error}>⚠ {error}</Text> : null}
        </View>
        {status === 'syncing' && <ActivityIndicator color={colors.primary} />}
      </View>

      <FlatList
        data={cards}
        keyExtractor={(c) => c.ncode}
        renderItem={({ item }) => (
          <CardRow item={item} onPress={() => nav.navigate('CardDetail', { ncode: item.ncode })} />
        )}
        refreshControl={
          <RefreshControl
            refreshing={status === 'syncing'}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 100 }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>Nenhum card ainda</Text>
            <Text style={styles.emptyText}>
              Ative um produto usando o QR code + código de ativação que vieram no seu card físico.
            </Text>
          </View>
        }
      />

      <View style={styles.fabRow}>
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.surfaceAlt }]}
          onPress={() => nav.navigate('Settings')}
        >
          <Text style={styles.fabText}>⚙</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.fab} onPress={() => nav.navigate('Activate')}>
          <Text style={styles.fabText}>+ Ativar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  hello: { color: colors.text, fontSize: 18, fontWeight: '700' },
  meta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  error: { color: colors.danger, fontSize: 12, marginTop: 4 },
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowLeft: { flex: 1 },
  ncode: { color: colors.text, fontWeight: '600', fontSize: 15, fontFamily: 'monospace' },
  goTo: { color: colors.primary, fontSize: 13, marginTop: 4 },
  jhm: { color: colors.textDim, fontSize: 11, marginTop: 2, fontFamily: 'monospace' },
  chevron: { color: colors.textDim, fontSize: 26, marginLeft: spacing.sm },
  empty: { alignItems: 'center', padding: spacing.xl, marginTop: 40 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '600', marginBottom: spacing.sm },
  emptyText: { color: colors.textMuted, textAlign: 'center', lineHeight: 20 },
  fabRow: {
    position: 'absolute',
    bottom: spacing.lg,
    right: spacing.md,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  fab: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 40,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  fabText: { color: colors.bg, fontWeight: '700', fontSize: 15 },
});
