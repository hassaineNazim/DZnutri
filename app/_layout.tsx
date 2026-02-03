import { Stack, useRouter } from "expo-router";
import { useColorScheme, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "./i18n";

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import NotificationListener from './components/NotificationListener';
import { ToastProvider } from './context/ToastContext';
import { persister, queryClient } from './services/queryClient';

export default function RootLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();

  return (
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <ToastProvider>
        <NotificationListener />
        <SafeAreaProvider>
          <View className={colorScheme === 'dark' ? 'dark flex-1' : 'flex-1'}>
            <SafeAreaView style={{ flex: 1, backgroundColor: colorScheme === 'dark' ? '#000' : 'white' }}>
              <Stack>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="auth" options={{ headerShown: false }} />
                <Stack.Screen name="scanner" options={{
                  headerShown: true,
                  headerTitle: "",
                  headerTitleAlign: 'center',
                  headerStyle: {
                    backgroundColor: 'transparent',
                  },
                  headerTransparent: true,
                  headerTintColor: '#fff',
                  headerBackVisible: true,
                }} />

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