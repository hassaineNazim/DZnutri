import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function HomeTab() {
  const router = useRouter();

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      router.push("/auth/login");
    } catch (error) {
      console.log('Erreur lors de la déconnexion');
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Bienvenue sur l'onglet principal !</Text>
      <Button title="Se déconnecter" onPress={logout} />
    </View>
  );
}