import { Link } from "expo-router";
import { View } from "react-native";
import { styles } from "../../styles/auth.styles";

export default function Reco() {
  return (
    <View style={styles.container}>
      <Link href="/analyse" style={styles.titre}>Profile</Link>
      
    </View>
  );
}


