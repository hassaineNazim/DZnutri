import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Forklift, MoreHorizontal, SprayCan } from 'lucide-react-native';
import React from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import StepHeader from '../components/StepHeader';
import { useTranslation } from '../i18n';

// Category Item Component
const CategoryItem = ({ icon, title, subtitle, onPress, index }: { icon: any; title: string; subtitle: string; onPress: () => void; index: number }) => (
  <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center bg-white dark:bg-[#1F2937] p-5 rounded-2xl mb-4 shadow-sm border border-gray-100 dark:border-gray-700"
    >
      <View className="w-14 h-14 bg-gray-50 dark:bg-gray-800 rounded-xl items-center justify-center mr-5">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-gray-900 dark:text-white mb-1">{title}</Text>
        <Text className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</Text>
      </View>
      <ChevronLeft size={20} className="text-gray-300 rotate-180" />
    </TouchableOpacity>
  </Animated.View>
);

export default function TypeProduitPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { barcode } = useLocalSearchParams();

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#181A20] p-6">
      <StatusBar barStyle="dark-content" />

      <StepHeader step={1} title={t('step_1_title')} />

      <Text className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
        {t('what_is_it')}
      </Text>

      <CategoryItem
        index={0}
        icon={<Forklift size={28} color="#EF4444" />}
        title={t('food_category')}
        subtitle={t('food_subtitle')}
        onPress={() => router.push({
          pathname: './ajouterProdInfo',
          params: { barcode, type: 'alimentation' },
        })}
      />

      <CategoryItem
        index={1}
        icon={<SprayCan size={28} color="#F97316" />}
        title={t('cosmetics_category')}
        subtitle={t('cosmetics_subtitle')}
        onPress={() => { /* Future logic */ }}
      />

      <CategoryItem
        index={2}
        icon={<MoreHorizontal size={28} color="#6B7280" />}
        title={t('other_category')}
        subtitle={t('other_subtitle')}
        onPress={() => { /* Future logic */ }}
      />
    </View>
  );
}