import { Tabs } from "expo-router";
import { Text, View } from "react-native";
import { BottomNavBar } from "../components/BottomNavBar";


export default function TabLayout() {
    return (
        <View className="flex-1 bg-white dark:bg-[#181A20]">
            <Tabs  screenOptions={{
                  headerStyle: { backgroundColor: 'transparent' , shadowColor: 'transparent' },
                tabBarStyle: { display: 'none' ,  }, 
                tabBarShowLabel: false,
                sceneStyle: { backgroundColor: 'transparent' },
                headerTitle: (props) => (
                        <Text className="text-black font-bold text-3xl ml-4 dark:text-white ">
                            {props.children}
                        </Text>
                    ),
            }}>
                <Tabs.Screen name="historique" options={{ title: "Historique" } } />
                <Tabs.Screen name="reglage" options={{ title: "Réglage" }} />
                <Tabs.Screen name="analyse" options={{ title: "Analyse" }} />
                <Tabs.Screen name="rech" options={{ title: "Recherche" }} />
                
            </Tabs>
            <BottomNavBar />
        </View>
    );
}
