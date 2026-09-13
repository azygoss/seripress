import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts as useBarlow,
  Barlow_400Regular,
  Barlow_500Medium,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from '@expo-google-fonts/barlow';
import {
  useFonts as useBarlowCondensed,
  BarlowCondensed_500Medium,
  BarlowCondensed_600SemiBold,
  BarlowCondensed_700Bold,
} from '@expo-google-fonts/barlow-condensed';
import { colors } from '../theme';
import { useAppStore } from '../store/appStore';

export default function RootLayout() {
  const [barlowLoaded] = useBarlow({
    Barlow_400Regular,
    Barlow_500Medium,
    Barlow_600SemiBold,
    Barlow_700Bold,
  });
  const [condensedLoaded] = useBarlowCondensed({
    BarlowCondensed_500Medium,
    BarlowCondensed_600SemiBold,
    BarlowCondensed_700Bold,
  });
  const hydrated = useAppStore((s) => s.hydrated);
  const setHydrated = useAppStore((s) => s.setHydrated);

  useEffect(() => {
    // persist hidrasyonu bitmeden de true kalabilir; güvence
    const t = setTimeout(() => setHydrated(true), 1500);
    return () => clearTimeout(t);
  }, [setHydrated]);

  const ready = barlowLoaded && condensedLoaded && hydrated;

  if (!ready) {
    return (
      <View style={styles.boot}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.bg },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="session/[routineId]" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="summary" options={{ animation: 'fade', gestureEnabled: false }} />
        <Stack.Screen name="picker" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
