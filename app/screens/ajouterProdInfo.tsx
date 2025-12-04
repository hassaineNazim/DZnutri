import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import StepHeader from '../components/StepHeader';
import { useTranslation } from '../i18n';

// Les catégories techniques de votre Scoring
const TECHNICAL_CATEGORIES = [
  { label: 'Solide (Standard)', value: 'solid' },
  { label: 'Boissons / Liquides', value: 'boissons' },
  { label: 'Matières Grasses / Huiles', value: 'matières grasses' },
  { label: 'Fromages', value: 'fromages' },
  { label: 'Eau', value: 'eau' },
];

export default function AjouterProduitInfoPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');

  // --- NOUVEAU : État pour la catégorie technique ---
  const [category, setCategory] = useState(TECHNICAL_CATEGORIES[0]); // Par défaut "Solide"
  const [dropdownVisible, setDropdownVisible] = useState(false);
  // -----------------------------------------------

  // Error states
  const [nameError, setNameError] = useState('');
  const [brandError, setBrandError] = useState('');

  const handleNext = () => {
    let isValid = true;

    if (!productName.trim()) {
      setNameError(t('fill_all_fields'));
      isValid = false;
    } else {
      setNameError('');
    }

    if (!brand.trim()) {
      setBrandError(t('fill_all_fields'));
      isValid = false;
    } else {
      setBrandError('');
    }

    if (!isValid) return;

    router.push({
      pathname: './ajouterProdPhoto',
      // On passe la catégorie sélectionnée (value) comme paramètre "type" ou "category"
      params: {
        barcode,
        type: category.value, // "boissons", "fromages", etc.
        productName,
        brand
      },
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
              className={`bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border ${nameError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:border-emerald-500 dark:focus:border-emerald-500`}
              placeholder={t('product_name_placeholder')}
              placeholderTextColor="#9CA3AF"
              value={productName}
              onChangeText={(text) => {
                setProductName(text);
                if (text.trim()) setNameError('');
              }}
            />
            {nameError ? <Text className="text-red-500 text-xs mt-1 ml-1">{nameError}</Text> : null}
          </View>

          {/* Brand */}
          <View className="mb-5">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">{t('brand')}</Text>
            <TextInput
              className={`bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white p-4 rounded-xl border ${brandError ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'} focus:border-emerald-500 dark:focus:border-emerald-500`}
              placeholder={t('brand_placeholder')}
              placeholderTextColor="#9CA3AF"
              value={brand}
              onChangeText={(text) => {
                setBrand(text);
                if (text.trim()) setBrandError('');
              }}
            />
            {brandError ? <Text className="text-red-500 text-xs mt-1 ml-1">{brandError}</Text> : null}
          </View>

          {/* --- NOUVEAU : TYPE SPÉCIFIQUE (Dropdown) --- */}
          <View className="mb-8">
            <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 ml-1">
              Type Spécifique (pour le calcul du score)
            </Text>

            <TouchableOpacity
              onPress={() => setDropdownVisible(true)}
              className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex-row justify-between items-center"
            >
              <Text className="text-gray-900 dark:text-white font-medium">
                {category.label}
              </Text>
              <ChevronDown size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
          {/* ------------------------------------------- */}

          {/* Next Button */}
          <TouchableOpacity
            onPress={handleNext}
            className="bg-emerald-500 py-4 rounded-xl items-center shadow-lg shadow-emerald-500/30 active:bg-emerald-600"
          >
            <Text className="text-white font-bold text-lg">{t('next')}</Text>
          </TouchableOpacity>

        </Animated.View>
      </ScrollView>

      {/* --- MODAL POUR LE DROPDOWN --- */}
      <Modal
        visible={dropdownVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View className="bg-white dark:bg-[#1F2937] w-[80%] rounded-2xl overflow-hidden shadow-2xl">
            <View className="p-4 border-b border-gray-100 dark:border-gray-700">
              <Text className="text-lg font-bold text-gray-900 dark:text-white text-center">Choisir un type</Text>
            </View>
            <FlatList
              data={TECHNICAL_CATEGORIES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  className={`p-4 border-b border-gray-50 dark:border-gray-800 flex-row justify-between items-center ${item.value === category.value ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}`}
                  onPress={() => {
                    setCategory(item);
                    setDropdownVisible(false);
                  }}
                >
                  <Text className={`text-base ${item.value === category.value ? 'text-emerald-600 font-bold' : 'text-gray-700 dark:text-gray-300'}`}>
                    {item.label}
                  </Text>
                  {item.value === category.value && <Check size={20} color="#10B981" />}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
      {/* ----------------------------- */}

    </KeyboardAvoidingView>
  );
}