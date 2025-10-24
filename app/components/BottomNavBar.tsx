// Dans components/BottomNavBar.tsx

import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useRouter } from 'expo-router'; // useRouter peut rester pour le ScanButton
import { ChartLine, Clock, Search, Settings } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import { useTranslation } from '../i18n';
import { ScanButton } from './ScanButton';


// Un petit helper pour choisir la bonne icône

const getIconForRoute = (routeName: string, color: string) => {
  switch (routeName) {
    case 'rech':
      return <Search color={color} strokeWidth={1.5} />;
    case 'historique':
      return <Clock color={color} strokeWidth={1.5} />;
    case 'analyse':
      return <ChartLine color={color} strokeWidth={1.5} />;
    case 'reglage':
      return <Settings color={color} strokeWidth={1.5} />;
    default:
      return null;
  }
};
 
 
// On accepte les props ici
export function BottomNavBar({ state, navigation }: BottomTabBarProps) {
  const colorScheme = useColorScheme();
  const router = useRouter(); // On le garde pour le ScanButton si besoin

 const { t } = useTranslation();
  return (
    <View className="flex-row justify-around items-center h-[70px] bg-slate-50 dark:bg-[#181A20] rounded-t-2xl absolute left-0 right-0 bottom-0 shadow-lg z-10">
      
      {/* On génère les boutons en bouclant sur les routes */}
      {state.routes.map((route, index) => {
        // 1. Déterminer si l'onglet est actif
        const isFocused = state.index === index;

        // 2. Définir l'action au clic
        const onPress = () => {
          if (!isFocused) {
            navigation.navigate(route.name);
          }
        };

        // On insère le bouton Scan au milieu
        if (index === 2) {
          return (
            <React.Fragment key="scan-fragment">
              <View className="flex-1 items-center justify-center py-2" pointerEvents="box-none">
                <ScanButton />
              </View>
              <Pressable key={route.key} className="flex-1 items-center justify-center py-2" onPress={onPress}>
                {getIconForRoute(route.name, isFocused ? (colorScheme === 'dark' ? 'white' : 'limegreen') : 'gray')}
                <Text className={isFocused ? 'text-green-500 text-xs mt-0.5 dark:text-white' : 'text-gray-400 text-xs mt-0.5'}>
                  {route.name.charAt(0).toUpperCase() + route.name.slice(1)}
                </Text>
              </Pressable>
            </React.Fragment>
          );
        }

        return (
          <Pressable key={route.key} className="flex-1 items-center justify-center py-2" onPress={onPress}>
            {getIconForRoute(route.name, isFocused ? (colorScheme === 'dark' ? 'white' : 'limegreen') : 'gray')}
            <Text className={isFocused ? 'text-green-500 text-xs mt-0.5 dark:text-white' : 'text-gray-400 text-xs mt-0.5'}>
              {t(route.name)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default BottomNavBar;