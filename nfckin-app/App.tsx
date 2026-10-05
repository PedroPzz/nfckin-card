import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/theme/colors';
import { useAuth } from './src/store/auth';
import { useCards } from './src/store/cards';
import { LoginScreen } from './src/screens/LoginScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { ActivateScreen } from './src/screens/ActivateScreen';
import { CardDetailScreen } from './src/screens/CardDetailScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    primary: colors.primary,
    border: colors.border,
  },
};

export default function App() {
  const { token, hydrated, hydrate } = useAuth();
  const hydrateCards = useCards((s) => s.hydrate);

  React.useEffect(() => {
    hydrate();
    hydrateCards();
  }, [hydrate, hydrateCards]);

  if (!hydrated) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        <Stack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.text,
            headerTitleStyle: { color: colors.text, fontWeight: '700' },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          {!token ? (
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          ) : (
            <>
              <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Meus cards' }} />
              <Stack.Screen name="Activate" component={ActivateScreen} options={{ title: 'Ativar produto' }} />
              <Stack.Screen name="CardDetail" component={CardDetailScreen} options={{ title: 'Card' }} />
              <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Configurações' }} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
