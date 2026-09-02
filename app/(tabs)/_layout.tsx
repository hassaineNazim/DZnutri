import { Tabs } from "expo-router";
import { View } from "react-native";
import BottomNavBar from "../components/BottomNavBar";
import { useTranslation } from "../i18n";
import { colors } from "../theme/tokens";
export default function TabLayout() {
    const { t } = useTranslation();
    return (

        <View style={{ flex: 1, backgroundColor: colors.sheet }}>
            <Tabs
                tabBar={props => <BottomNavBar {...props} />}
                screenOptions={{
                    headerShown: false,
                    tabBarStyle: { display: 'none' },
                    tabBarShowLabel: false,
                }}>
                {/* Ordre = ordre d'affichage dans la barre (le bouton Scan central
                    est inséré au milieu par BottomNavBar) : Accueil, Rechercher,
                    [Scan], Carnet, Moi. */}
                <Tabs.Screen name="historique" options={{ title: t('historique') }} />
                <Tabs.Screen name="rech" options={{ title: t('rech') }} />
                <Tabs.Screen name="analyse" options={{ title: t('analyse') }} />
                <Tabs.Screen name="reglage" options={{ title: t('reglage') }} />

            </Tabs>

        </View>
    );
}
