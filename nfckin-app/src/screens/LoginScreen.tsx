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
import { colors, radius, spacing } from '../theme/colors';
import { useAuth } from '../store/auth';

export function LoginScreen() {
  const { login, loggingIn, hydrated, email: savedEmail, password: savedPassword } = useAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [showPass, setShowPass] = React.useState(false);

  React.useEffect(() => {
    if (hydrated && savedEmail) {
      setEmail(savedEmail);
      if (savedPassword) setPassword(savedPassword);
    }
  }, [hydrated, savedEmail, savedPassword]);

  async function onSubmit() {
    if (!email.trim() || !password) {
      Alert.alert('Campos obrigatórios', 'Informe email e senha.');
      return;
    }
    try {
      await login(email.trim(), password, remember);
    } catch (e: any) {
      Alert.alert('Falha no login', e?.message || 'Verifique suas credenciais.');
    }
  }

  if (!hydrated) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>NFCkin</Text>
          <Text style={styles.subtitle}>Gerenciador independente dos seus cards</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="voce@exemplo.com"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
          />

          <Text style={styles.label}>Senha</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor={colors.textDim}
              secureTextEntry={!showPass}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPass((v) => !v)} style={styles.eyeBtn}>
              <Text style={{ color: colors.primary }}>{showPass ? 'ocultar' : 'ver'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.checkRow} onPress={() => setRemember((v) => !v)}>
            <View style={[styles.checkbox, remember && styles.checkboxOn]}>
              {remember && <Text style={{ color: colors.bg, fontWeight: '700' }}>✓</Text>}
            </View>
            <Text style={styles.checkLabel}>
              Manter sessão ativa (renova automaticamente quando o NFCkin expirar em ~1 min)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loggingIn && { opacity: 0.6 }]}
            onPress={onSubmit}
            disabled={loggingIn}
            activeOpacity={0.8}
          >
            {loggingIn ? (
              <ActivityIndicator color={colors.bg} />
            ) : (
              <Text style={styles.buttonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.disclaimer}>
            ⚠️ Este app usa engenharia reversa da API do nfckin.com. Credenciais ficam no Keychain/Keystore
            do seu dispositivo. O serviço pode quebrar sem aviso se o site mudar.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.lg, flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  logo: { fontSize: 40, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  subtitle: { color: colors.textMuted, marginTop: spacing.xs, fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: { color: colors.textMuted, fontSize: 12, marginBottom: 6, marginTop: spacing.md },
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
  eyeBtn: { marginLeft: spacing.sm, padding: spacing.sm },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.textDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  checkboxOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkLabel: { color: colors.textMuted, flex: 1, fontSize: 12, lineHeight: 16 },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: { color: colors.bg, fontWeight: '700', fontSize: 16 },
  disclaimer: {
    color: colors.textDim,
    fontSize: 11,
    marginTop: spacing.md,
    lineHeight: 15,
    textAlign: 'center',
  },
});
