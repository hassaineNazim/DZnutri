import { Link } from "expo-router";
import { View } from "react-native";
import { styles } from "../styles/auth.styles";

export default function Index() {
  return (
    <View style={styles.container}>
      <Link href="/profile" style={styles.titre}>Profile</Link>
      <Link href="/notification" style={styles.titre}>Notification</Link>
    </View>
  );
}


