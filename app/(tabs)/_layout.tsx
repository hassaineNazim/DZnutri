import { Tabs } from "expo-router";
import { Text, useColorScheme, View } from "react-native";
import BottomNavBar from "../components/BottomNavBar";

export default function TabLayout() {
    const colorScheme = useColorScheme();
    return (
        
        <View className="flex-1 bg-black dark:bg-[#181A20]">
            <Tabs  
             tabBar={props => <BottomNavBar {...props} />}
            screenOptions={{
                  headerStyle: { backgroundColor: colorScheme === 'dark' ? '#181A20' : 'white' , shadowColor: 'transparent' },
                tabBarStyle: { display: 'none' ,  }, 
                tabBarShowLabel: false,
                
            
             
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
            
        </View>
    );
}
