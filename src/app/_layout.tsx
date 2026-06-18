import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { AppStoreProvider } from '@/state/app-store';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppStoreProvider>
        <AnimatedSplashOverlay />
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false, title: 'ホーム' }} />
          <Stack.Screen name="quiz" options={{ title: 'クイズ' }} />
          <Stack.Screen name="flags" options={{ title: '国旗一覧' }} />
          <Stack.Screen name="records" options={{ title: '成績' }} />
          <Stack.Screen name="settings" options={{ title: '設定' }} />
        </Stack>
      </AppStoreProvider>
    </ThemeProvider>
  );
}
