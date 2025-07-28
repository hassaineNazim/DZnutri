import { useRouter } from "expo-router";
import { Button, Text, View } from "react-native";

export default function AuthIndex() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Bienvenue sur la page Auth !</Text>
      <Button title="Se connecter" onPress={() => router.push("./auth/login")} />
      <Button title="Créer un compte" onPress={() => router.push("./auth/signup")} />
    </View>
  );
}