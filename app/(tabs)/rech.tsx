import { Text, TouchableOpacity, View } from "react-native";
import { styles } from "../../styles/auth.styles";

export default function Rech() {
    return (
        <View
      style={styles.container}
    >
      <Text style={styles.text}>Bienvenue sur DZnutri !</Text>
      <TouchableOpacity onPress={() => alert("you are bitch")}>
        <Text style={styles.titre}>press me</Text>
      </TouchableOpacity>
      
    </View>
    )
}
