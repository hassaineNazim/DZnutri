import { Tabs } from "expo-router";
import { useColorScheme, View } from "react-native";
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
                    headerShown: false,
                    tabBarStyle: { display: 'none' },
                    tabBarShowLabel: false,
                }}>
                <Tabs.Screen name="historique" options={{ title: t('historique') }} />
                <Tabs.Screen name="reglage" options={{ title: t('reglage') }} />
                <Tabs.Screen name="analyse" options={{ title: t('analyse') }} />
                <Tabs.Screen name="rech" options={{ title: t('rech') }} />

            </Tabs>

        </View>
    );
}
