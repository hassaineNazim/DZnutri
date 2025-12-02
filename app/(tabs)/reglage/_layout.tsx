// Dans app/tabs/reglage/_layout.tsx
import { Stack } from 'expo-router';

export default function SettingsLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ title: 'Réglages' }} />

      <Stack.Screen
        name="compte"
        options={{
          title: 'Mon Compte',
          presentation: 'modal',
        }}
      />

      <Stack.Screen
        name="profile-sante"
        options={{
          title: 'Profil Santé',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}