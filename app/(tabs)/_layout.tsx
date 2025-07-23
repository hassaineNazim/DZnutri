import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { styles } from "../../styles/auth.styles";

export default function TabLayout() {
    return (
        <Tabs screenOptions={{
            tabBarStyle: styles.navbar,
            tabBarShowLabel : false,
        }}>
            <Tabs.Screen name="index" options={{ title: "Historique", tabBarIcon: ({size,color}) => <Ionicons name="home" size={size} color={color}/>}}  />
            <Tabs.Screen name="reco" options={{ title: "Recommandations"}} />
            <Tabs.Screen name="analyse" options={{ title: "Analyse"}} />
            <Tabs.Screen name="rech" options={{ title: "Recherche"}} />
            
        </Tabs>
    );
}
