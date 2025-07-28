import { Stack } from "expo-router";

export default function AuthLayout() {
  
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="login" 
        options={{ headerBackVisible: false }} 
      />
      <Stack.Screen 
        name="signup" 
        options={{ headerBackVisible: false, gestureEnabled: false }}  
      />
      <Stack.Screen 
        name="forgot-password" 
        options={{ headerBackVisible: false, gestureEnabled: false }} 
      />
    </Stack>
  );
}