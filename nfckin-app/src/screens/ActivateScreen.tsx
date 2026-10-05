import React from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { colors, radius, spacing } from '../theme/colors';
import { useCards } from '../store/cards';

export function ActivateScreen() {
  const nav = useNavigation<any>();
  const { activate, status } = useCards();
  const [jhm, setJhm] = React.useState('');
  const [ncode, setNcode] = React.useState('');
  const [goTo, setGoTo] = React.useState('https://');
  const [scanning, setScanning] = React.useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [submitting, setSubmitting] = React.useState(false);

  async function openScanner() {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) {
        Alert.alert('Permissão negada', 'Sem acesso à câmera, digite o código manualmente.');
        return;
      }
    }
    setScanning(true);
  }

  function onBarcode(e: { data: string }) {
    const raw = e.data;
    setNcode(raw);
    setScanning(false);
  }

  async function submit() {
    if (!jhm.trim() || !ncode.trim() || !goTo.trim()) {
      Alert.alert('Preencha tudo', 'São necessários os 3 campos: código de ativação, QR code e Redirect URL.');
      return;
    }
    if (!/^https?:\/\//i.test(goTo.trim())) {
      Alert.alert('URL inválida', 'A Redirect URL precisa começar com http:// ou https://');
      return;
    }
    setSubmitting(true);
    try {
      await activate(jhm, ncode, goTo);
      Alert.alert('Ativado ✓', `Card ${ncode} ativado com sucesso.`, [
        { text: 'OK', onPress: () => nav.goBack() },
      ]);
    } catch (e: any) {
      Alert.alert('Erro ao ativar', e?.message || 'Falha desconhecida');
    } finally {
      setSubmitting(false);
    }
  }

  if (scanning) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onBarcodeScanned={onBarcode}
        />
        <TouchableOpacity style={styles.cancelScan} onPress={() => setScanning(false)}>
          <Text style={{ color: '#fff', fontWeight: '700' }}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Ativar produto</Text>
        <Text style={styles.hint}>
          Preencha os 3 dados que vieram no seu card físico NFCkin.
        </Text>

        <View style={styles.card}>
          <Text style={styles.label}>Código do produto (QR Code) — ncode</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <TextInput
              style={[styles.input, { flex: 1, fontFamily: 'monospace' }]}
              value={ncode}
              onChangeText={setNcode}
              placeholder="D6nWTviAyMdBlO3weE"
              placeholderTextColor={colors.textDim}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.scanBtn} onPress={openScanner}>
              <Text style={{ color: colors.bg, fontWeight: '700' }}>📷</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Código de ativação (abaixo do QR) — jhm</Text>
          <TextInput
            style={[styles.input, { fontFamily: 'monospace' }]}
            value={jhm}
            onChangeText={setJhm}
            placeholder="CE60414"
            placeholderTextColor={colors.textDim}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          <Text style={styles.label}>Redirect URL — goTo</Text>
          <TextInput
            style={styles.input}
            value={goTo}
            onChangeText={setGoTo}
            placeholder="https://exemplo.com/pagina"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            keyboardType="url"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.button, (submitting || status === 'syncing') && { opacity: 0.6 }]}
            onPress={submit}
            disabled={submitting || status === 'syncing'}
          >
            {submitting ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.buttonText}>Ativar card</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 24, fontWeight: '800', marginBottom: 4 },
  hint: { color: colors.textMuted, marginBottom: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: 12, marginTop: spacing.md, marginBottom: 6 },
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
  scanBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: radius.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 16 },
  cancelScan: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 30,
  },
});
