import { Tabs } from "expo-router";
import { Text, useColorScheme, View } from "react-native";
import BottomNavBar from "../components/BottomNavBar";
import { useTranslation } from "../i18n";
export default function TabLayout() {
    const { t } = useTranslation();
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
                <Tabs.Screen name="historique" options={{ title: t('historique') } } />
                <Tabs.Screen name="reglage" options={{ title: t('reglage') }} />
                <Tabs.Screen name="analyse" options={{ title: t('analyse') }} />
                <Tabs.Screen name="rech" options={{ title: t('rech') }} />
                
            </Tabs>
            
        </View>
    );
}
