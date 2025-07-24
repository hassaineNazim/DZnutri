import { Text, View } from "react-native";
import { ScanButton } from "../components/ScanButton";

export default function HomeTab() {
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text>Bienvenue sur l'onglet principal !</Text>
      <ScanButton />
    </View>
  );
}