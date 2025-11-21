import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Check, RefreshCw } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import StepHeader from '../components/StepHeader';
import { API_URL } from '../config/api';
import { useTranslation } from '../i18n';

export default function AjouterProduitPhotoPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{
    barcode: string;
    type: string;
    productName: string;
    brand: string;
  }>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageIngredientsUri, setImageIngredientsUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async (setImageToUpdate: (uri: string) => void) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert(t('add_product_title'), t('camera_permission_needed'));
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageToUpdate(result.assets[0].uri);
    }
  };

  const handleSubmission = async () => {
    if (!imageUri || !imageIngredientsUri) {
      Alert.alert(t('add_product_title'), t('photo_error'));
      return;
    }
    setLoading(true);

    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error(t('connect')); // Or generic error

      const formData = new FormData();
      formData.append('barcode', params.barcode as string);
      formData.append('typeProduct', params.type as string);
      formData.append('productName', params.productName as string);
      formData.append('brand', params.brand as string);

      formData.append('image_front', {
        uri: imageUri,
        name: `front_${params.barcode}.jpg`,
        type: 'image/jpeg',
      } as any);

      formData.append('image_ingredients', {
        uri: imageIngredientsUri,
        name: `ingredients_${params.barcode}.jpg`,
        type: 'image/jpeg',
      } as any);

      const response = await fetch(`${API_URL}/api/submission`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Server Error');
      }

      Alert.alert(t('success_title'), t('success_message'), [
        {
          text: 'OK',
          onPress: () => router.replace('../scanner'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const PhotoButton = ({
    uri,
    onPress,
    label,
    stepNumber
  }: {
    uri: string | null,
    onPress: () => void,
    label: string,
    stepNumber: number
  }) => (
    <Animated.View entering={FadeInDown.delay(stepNumber * 100).springify()} className="mb-6">
      <Text className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 ml-1">
        {stepNumber}. {label}
      </Text>

      {uri ? (
        <View className="relative">
          <Image source={{ uri }} className="w-full h-64 rounded-2xl bg-gray-100 dark:bg-gray-800" resizeMode="cover" />
          <View className="absolute inset-0 bg-black/20 rounded-2xl items-center justify-center">
            <Animated.View entering={ZoomIn} className="bg-emerald-500 rounded-full p-2 mb-2">
              <Check size={24} color="white" />
            </Animated.View>
            <TouchableOpacity onPress={onPress} className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex-row items-center">
              <RefreshCw size={14} color="white" className="mr-2" />
              <Text className="text-white font-medium text-xs">{t('retake_photo')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          className="w-full h-48 bg-white dark:bg-[#1F2937] rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 items-center justify-center"
        >
          <View className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full items-center justify-center mb-3">
            <Camera size={32} className="text-emerald-500" />
          </View>
          <Text className="text-gray-500 dark:text-gray-400 font-medium">{t('take_photo') || "Tap to take photo"}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-[#181A20] p-6">
      <StepHeader step={3} title={t('step_3_title')} />

      <PhotoButton
        stepNumber={1}
        label={t('take_photo_front')}
        uri={imageUri}
        onPress={() => takePhoto(setImageUri)}
      />

      {imageUri && (
        <PhotoButton
          stepNumber={2}
          label={t('take_photo_ingredients')}
          uri={imageIngredientsUri}
          onPress={() => takePhoto(setImageIngredientsUri)}
        />
      )}

      {imageUri && imageIngredientsUri && (
        <Animated.View entering={FadeInDown.delay(300).springify()} className="mt-4 mb-10">
          <TouchableOpacity
            onPress={handleSubmission}
            disabled={loading}
            className={`py-4 rounded-xl items-center shadow-lg ${loading ? 'bg-gray-400' : 'bg-emerald-500 shadow-emerald-500/30 active:bg-emerald-600'}`}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-lg">{t('submit_product')}</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      )}
    </ScrollView>
  );
}