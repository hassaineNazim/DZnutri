// Dans app/tabs/_layout.tsx

import { Tabs } from "expo-router";
import { Text } from "react-native";
import { BottomNavBar } from "../components/BottomNavBar"; // Assurez-vous que le chemin est correct

export default function TabLayout() {
    return (
        <Tabs 
            // C'est ici qu'on passe la barre de navigation personnalisée
            tabBar={props => <BottomNavBar {...props} />}
            screenOptions={{
                headerTitle: (props) => (
                    <Text className="text-black font-bold text-3xl ml-4 dark:text-white ">
                        {props.children}
                    </Text>
                ),
            }}
        >
            <Tabs.Screen name="historique" options={{ title: "Historique" }} />
            <Tabs.Screen name="reglage" options={{ title: "Réglages" }} />
            <Tabs.Screen name="analyse" options={{ title: "Analyse" }} />
            <Tabs.Screen name="rech" options={{ title: "Recherche" }} />
        </Tabs>
    );
}