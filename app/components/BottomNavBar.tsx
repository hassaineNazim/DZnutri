import { usePathname, useRouter } from 'expo-router';
import { ChartLine, Clock, Search, Settings } from 'lucide-react-native';
import React from 'react';
import { Pressable, Text, View, useColorScheme } from 'react-native';
import { ScanButton } from './ScanButton';

export function BottomNavBar() {
  const router = useRouter();
  const pathname = usePathname();
  const colorScheme = useColorScheme();
  const isSearch = pathname === '/rech';
  const isHistory = pathname === '/historique';
  const isAnalyse = pathname === '/analyse';
  const isReglage = pathname === '/reglage';

  return (
    <View className="flex-row justify-around items-center h-[70px] bg-slate-50 dark:bg-[#181A20] rounded-t-2xl absolute left-0 right-0 bottom-0 shadow-lg z-10">
      {/* Search (far left) */}
      <Pressable className="flex-1 items-center justify-center py-2" onPress={() => router.push('/rech')}>
        <Search color={isSearch ? (colorScheme === 'dark' ? 'white' : 'limegreen') : (colorScheme === 'dark' ? 'grey' : 'gray')} strokeWidth={1.5} />
        <Text className={isSearch ? 'text-green-500 text-xs mt-0.5 dark:text-white' : 'text-gray-400 text-xs mt-0.5'}>Recher</Text>
      </Pressable>
      {/* History (left) */}
      <Pressable className="flex-1 items-center justify-center py-2" onPress={() => router.push('/historique')}>
        <Clock color={isHistory ? (colorScheme === 'dark' ? 'white' : 'limegreen') : (colorScheme === 'dark' ? 'grey' : 'gray')} strokeWidth={1.5} />
        <Text className={isHistory ? 'text-green-500 text-xs mt-0.5 dark:text-white' : 'text-gray-400 text-xs mt-0.5'}>Historique</Text>
      </Pressable>
      {/* ScanButton (center, floating) */}
      <View className="flex-1 items-center justify-center py-2" pointerEvents="box-none">
        <ScanButton />
      </View>
      {/* Analyse (right) */}
      <Pressable className="flex-1 items-center justify-center py-2" onPress={() => router.push('/analyse')}>
        <ChartLine color={isAnalyse ? (colorScheme === 'dark' ? 'white' : 'limegreen') : (colorScheme === 'dark' ? 'grey' : 'gray')} strokeWidth={1.5} />
        <Text className={isAnalyse ? 'text-green-500 text-xs mt-0.5 dark:text-white' : 'text-gray-400 text-xs mt-0.5' }>Analyse</Text>
      </Pressable>
      {/* Reglage (far right) */}
      <Pressable className="flex-1 items-center justify-center py-2" onPress={() => router.push('/reglage')}>
        <Settings color={isReglage ? (colorScheme === 'dark' ? 'white' : 'limegreen') : (colorScheme === 'dark' ? 'grey' : 'gray')} strokeWidth={1.5} />
        <Text className={isReglage ? 'text-green-500 text-xs mt-0.5 dark:text-white' : 'text-gray-400 text-xs mt-0.5'}>Réglage</Text>
      </Pressable>
    </View>
  );
} 

export default BottomNavBar;