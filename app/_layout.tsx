import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_700Bold,
  PlayfairDisplay_800ExtraBold,
  PlayfairDisplay_900Black,
  PlayfairDisplay_900Black_Italic,
  useFonts,
} from '@expo-google-fonts/playfair-display';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';
import { useColorScheme, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import NotificationListener from './components/NotificationListener';
import { ToastProvider } from './context/ToastContext';
import { persister, queryClient } from './services/queryClient';

// On garde le splash affiché tant que les polices du redesign ne sont pas prêtes,
// pour éviter un flash de police système au démarrage.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    PlayfairDisplay_500Medium,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_800ExtraBold,
    PlayfairDisplay_900Black,
    PlayfairDisplay_900Black_Italic,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  // Tant que les polices ne sont pas chargées (et sans erreur), on n'affiche rien
  // (le splash natif reste visible).
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <ToastProvider>
        <NotificationListener />
        <SafeAreaProvider>
          <View className={colorScheme === 'dark' ? 'dark flex-1' : 'flex-1'} onLayout={onLayoutRootView}>
            <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000' : 'white' }}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="onboarding" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                {/* Le scanner a sa propre entête (bouton fermer) dans le redesign. */}
                <Stack.Screen name="scanner" options={{ headerShown: false }} />

                {/* Hide headers for the add product flow screens */}
                <Stack.Screen name="screens/ajouterProd" options={{ headerShown: false }} />
                <Stack.Screen name="screens/typeProd" options={{ headerShown: false }} />
                <Stack.Screen name="screens/ajouterProdInfo" options={{ headerShown: false }} />
                <Stack.Screen name="screens/ajouterProdPhoto" options={{ headerShown: false }} />

                <Stack.Screen name="screens/productDetail" options={{
                  headerShown: false,
                  headerTitle: "Détail sur le produit",
                }} />
              </Stack>
            </SafeAreaView>
          </View>
        </SafeAreaProvider>
      </ToastProvider>
    </PersistQueryClientProvider>
  );
}