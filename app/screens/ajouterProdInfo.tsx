import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import StepHeader from '../components/StepHeader';
import { useTranslation } from '../i18n';

export default function AjouterProduitInfoPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { barcode, type } = useLocalSearchParams<{ barcode: string, type: string }>();

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');

  const handleNext = () => {
    if (!productName || !brand) {
      Alert.alert(t('add_product_title'), t('fill_all_fields'));
      return;
    }

    router.push({
      pathname: './ajouterProdPhoto',
      params: { barcode, type, productName, brand },
    });
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-gray-50 dark:bg-[#181A20]"
    >
      <ScrollView className="flex-1 p-6">
        <StepHeader step={2} title={t('step_2_title')} />

        <Animated.View entering={FadeInDown.delay(100).springify()} className="bg-white dark:bg-[#1F2937] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <Text className="text-lg font-bold text-gray-900 dark:text-white mb-6">{t('product_details')}</Text>

          {/* Barcode (Read-only) */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2 ml-1">{t('barcode')}</Text>
            <View className="bg-gray-100 dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <Text className="text-gray-500 dark:text-gray-400 font-mono">{barcode}</Text>
            </View>
          </View>

          {/* Product Name */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">{t('product_name')}</Text>
            <TextInput
              className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500"
              placeholder={t('product_name_placeholder')}
              placeholderTextColor="#9CA3AF"
              value={productName}
              onChangeText={setProductName}
            />
          </View>

          {/* Brand */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">{t('brand')}</Text>
            <TextInput
              className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border border-gray-200 dark:border-gray-700 focus:border-emerald-500 dark:focus:border-emerald-500"
              placeholder={t('brand_placeholder')}
              placeholderTextColor="#9CA3AF"
              value={brand}
              onChangeText={setBrand}
            />
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleNext}
            className="bg-emerald-500 py-4 rounded-xl items-center shadow-lg shadow-emerald-500/30 active:bg-emerald-600"
          >
            <Text className="text-white font-bold text-lg">{t('next')}</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}