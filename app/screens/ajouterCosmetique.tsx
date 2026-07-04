import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n';
import { api } from '../services/axios';

export default function AjouterCosmetique() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async (which: 'front' | 'back') => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      showToast(t('camera_permission_needed'), 'error');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: false });
    if (!result.canceled && result.assets?.[0]) {
      const uri = result.assets[0].uri;
      which === 'front' ? setFrontUri(uri) : setBackUri(uri);
    }
  };

  const submit = async () => {
    if (!frontUri) {
      showToast(t('front_photo_required'), 'error');
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('barcode', String(barcode));
      if (productName) formData.append('productName', productName);
      if (brand) formData.append('brand', brand);
      if (category) formData.append('category', category);
      formData.append('image_front', { uri: frontUri, name: `front_${barcode}.jpg`, type: 'image/jpeg' } as any);
      if (backUri) {
        formData.append('image_back', { uri: backUri, name: `back_${barcode}.jpg`, type: 'image/jpeg' } as any);
      }

      // Instance `api` : token + refresh auto ; timeout allongé pour l'upload.
      await api.post('/api/cosmetic/submission', formData, { timeout: 60000 });

      showToast(t('cosmetic_submitted'), 'success');
      setTimeout(() => router.replace('/(tabs)/historique'), 1200);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || 'Une erreur est survenue';
      showToast(typeof msg === 'string' ? msg : 'Erreur lors de l\'envoi', 'error');
    } finally {
      setLoading(false);
    }
  };

  const PhotoCard = ({ uri, onPress, label, hint }: { uri: string | null; onPress: () => void; label: string; hint: string }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} className="flex-1">
      <View className="bg-white dark:bg-[#1F2937] rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 overflow-hidden" style={{ height: 160 }}>
        {uri ? (
          <Image source={{ uri }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="flex-1 items-center justify-center p-3">
            <Camera size={28} color="#EC4899" />
            <Text className="text-gray-700 dark:text-gray-200 font-semibold mt-2 text-center">{label}</Text>
            <Text className="text-gray-400 text-xs mt-1 text-center">{hint}</Text>
          </View>
        )}
        {uri ? (
          <View className="absolute top-2 right-2 bg-emerald-500 rounded-full w-7 h-7 items-center justify-center">
            <Check size={16} color="white" strokeWidth={3} />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#181A20]">
      <View style={{ paddingTop: insets.top + 8 }} className="bg-white dark:bg-[#1F2937] px-4 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center">
          <ArrowLeft size={22} color={isDark ? '#D1D5DB' : '#374151'} />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900 dark:text-white mr-10">{t('add_cosmetic_title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <Text className="text-gray-500 dark:text-gray-400 mb-4">
          {t('barcode_label')} <Text className="font-bold text-gray-800 dark:text-gray-200">{barcode}</Text>
        </Text>

        <View className="flex-row" style={{ gap: 12 }}>
          <PhotoCard uri={frontUri} onPress={() => takePhoto('front')} label={t('front_face')} hint={t('the_product')} />
          <PhotoCard uri={backUri} onPress={() => takePhoto('back')} label={t('back_inci')} hint={t('ingredients_list')} />
        </View>

        <View className="mt-6" style={{ gap: 12 }}>
          <TextInput
            className="bg-white dark:bg-[#1F2937] p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            placeholder={t('product_name_optional')}
            placeholderTextColor="#9CA3AF"
            value={productName}
            onChangeText={setProductName}
          />
          <TextInput
            className="bg-white dark:bg-[#1F2937] p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            placeholder={t('brand_optional')}
            placeholderTextColor="#9CA3AF"
            value={brand}
            onChangeText={setBrand}
          />
          <TextInput
            className="bg-white dark:bg-[#1F2937] p-4 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            placeholder={t('category_optional')}
            placeholderTextColor="#9CA3AF"
            value={category}
            onChangeText={setCategory}
          />
        </View>

        <TouchableOpacity
          disabled={loading}
          onPress={submit}
          className="bg-pink-500 py-4 rounded-2xl items-center mt-6 shadow-lg shadow-pink-500/30"
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-bold text-base">{t('send_for_validation')}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
