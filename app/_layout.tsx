import { Stack, useRouter } from "expo-router";
import { useColorScheme, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { useTranslation } from "./i18n";
export default function RootLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const router = useRouter();
  return (
    <SafeAreaProvider>
      <View className={colorScheme === 'dark' ? 'dark flex-1' : 'flex-1'}>
        <SafeAreaView style={{flex: 1, backgroundColor: colorScheme === 'dark' ? '#000' : 'white'}}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="scanner"  options={{
                headerShown: true,
                headerTitle: "",
                headerTitleAlign: 'center',
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                
                headerTransparent: true,
                headerTintColor: '#fff',
                headerBackVisible: true,
             
              }}  />
            <Stack.Screen name="screens/ajouterProd" options={{
                headerShown: true,
                headerTitle: t('add_product'),
                
                headerStyle: {
                  backgroundColor: 'transparent',
                },
                headerTransparent: true,
                headerTintColor: '#fff',
              }} />
              <Stack.Screen name="screens/productDetail" options={{
                headerShown: false,
                headerTitle: "Détail sur le produit",
                
              }} />
          </Stack>
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}