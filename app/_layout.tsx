import { DMSans_400Regular } from '@expo-google-fonts/dm-sans/400Regular';
import { DMSans_500Medium } from '@expo-google-fonts/dm-sans/500Medium';
import { DMSans_600SemiBold } from '@expo-google-fonts/dm-sans/600SemiBold';
import { DMSans_700Bold } from '@expo-google-fonts/dm-sans/700Bold';
import { PlayfairDisplay_500Medium } from '@expo-google-fonts/playfair-display/500Medium';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display/700Bold';
import { PlayfairDisplay_800ExtraBold } from '@expo-google-fonts/playfair-display/800ExtraBold';
import { PlayfairDisplay_900Black } from '@expo-google-fonts/playfair-display/900Black';
import { PlayfairDisplay_900Black_Italic } from '@expo-google-fonts/playfair-display/900Black_Italic';
import { useFonts } from 'expo-font';
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useCallback, useEffect, useState } from 'react';
import { View } from "react-native";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import NotificationListener from './components/NotificationListener';
import SessionExpiryListener from './components/SessionExpiryListener';
import { ToastProvider } from './context/ToastContext';
import { clearLegacyPrivateQueryCache, persister, queryClient } from './services/queryClient';
import { loadStoredThemeScheme, ThemeProvider, useTheme } from './theme/ThemeContext';
import AppErrorBoundary from '../components/AppErrorBoundary';

// On garde le splash affiché tant que les polices du redesign ne sont pas prêtes,
// pour éviter un flash de police système au démarrage.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Contenu sous le ThemeProvider : la CLÉ change avec le thème → tout l'arbre
// est repeint avec la palette mutée (les styles inline sont réévalués).
function ThemedApp({ onLayoutRootView }: { onLayoutRootView: () => void }) {
  const { scheme, isDark } = useTheme();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  // iOS ignore la couleur de fond passée à StatusBar : les bandes visibles
  // derrière l'heure et l'indicateur d'accueil appartiennent à la safe area.
  // On les peint séparément pour prolonger naturellement l'écran au lieu de
  // laisser le blanc natif apparaître en haut et en bas.
  const hasDarkHeader = pathname === '/scanner' || pathname === '/analyse';
  const hasLightHeader =
    pathname === '/screens/typeProd' ||
    pathname === '/screens/unsupportedProduct' ||
    pathname.startsWith('/screens/ajouterProd') ||
    pathname === '/screens/ajouterCosmetique';
  const topSafeAreaBackground = hasDarkHeader
    ? '#141110'
    : hasLightHeader
      ? isDark
        ? '#201914'
        : '#F4EAD6'
      : '#59121F';
  const bottomSafeAreaBackground =
    pathname === '/onboarding' || pathname.startsWith('/auth')
      ? '#59121F'
      : pathname === '/scanner'
        ? '#141110'
        : isDark
          ? '#201914'
          : '#F4EAD6';

  // La zone de l'indicateur d'accueil peut laisser apparaître la fenêtre
  // UIKit derrière React Native. La synchroniser évite la dernière bande
  // blanche que le remplissage de la safe area ne suffit pas à couvrir.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(bottomSafeAreaBackground).catch(() => {});
  }, [bottomSafeAreaBackground]);

  return (
    <View
      key={scheme}
      className={isDark ? 'dark flex-1' : 'flex-1'}
      style={{ backgroundColor: bottomSafeAreaBackground }}
      onLayout={onLayoutRootView}
    >
      <View style={{ height: insets.top, backgroundColor: topSafeAreaBackground }} />
      <View style={{ flex: 1, paddingLeft: insets.left, paddingRight: insets.right }}>
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
          <Stack.Screen name="screens/unsupportedProduct" options={{ headerShown: false }} />
          <Stack.Screen name="screens/faqDetail" options={{ headerShown: false }} />

          <Stack.Screen name="screens/productDetail" options={{
            headerShown: false,
            headerTitle: "Détail sur le produit",
          }} />
        </Stack>
      </View>
      <View style={{ height: insets.bottom, backgroundColor: bottomSafeAreaBackground }} />
    </View>
  );
}

export default function RootLayout() {
  // Préférence de thème chargée AVANT le premier rendu (pas de flash clair).
  const [themeReady, setThemeReady] = useState(false);
  useEffect(() => {
    Promise.allSettled([
      loadStoredThemeScheme(),
      clearLegacyPrivateQueryCache(),
    ]).finally(() => setThemeReady(true));
  }, []);

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

  // Tant que polices + thème ne sont pas prêts, on n'affiche rien
  // (le splash natif reste visible).
  if ((!fontsLoaded && !fontError) || !themeReady) {
    return null;
  }

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister,
        dehydrateOptions: {
          // Les données liées au compte (profil santé et favoris) restent
          // uniquement en mémoire et sont purgées à chaque fin de session.
          shouldDehydrateQuery: (query) =>
            !['userProfile', 'favorite', 'favorites_list'].includes(String(query.queryKey[0])),
        },
      }}
    >
      <ToastProvider>
        <AppErrorBoundary>
          <NotificationListener />
          <SessionExpiryListener />
          <SafeAreaProvider>
            <ThemeProvider>
              <ThemedApp onLayoutRootView={onLayoutRootView} />
            </ThemeProvider>
          </SafeAreaProvider>
        </AppErrorBoundary>
      </ToastProvider>
    </PersistQueryClientProvider>
  );
}
