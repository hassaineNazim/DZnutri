import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Check, RefreshCw, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  useColorScheme
} from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import StepHeader from '../components/StepHeader';
import { API_URL } from '../config/api';
import { useTranslation } from '../i18n';

// Example images
const FRONT_EXAMPLE = require('../../assets/images/Gemini_Generated_Image_dlyit9dlyit9dlyi.png');
const BACK_EXAMPLE = require('../../assets/images/Gemini_Generated_Image_3ypwh63ypwh63ypw.png');
// --- MODIF 1: Image exemple pour la nutrition (réutilisation ou nouvelle image) ---
const NUTRITION_EXAMPLE = require('../../assets/images/Gemini_Generated_Image_3ypwh63ypwh63ypw.png');

export default function AjouterProduitPhotoPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const params = useLocalSearchParams<{
    barcode: string;
    type: string;
    productName: string;
    brand: string;
    category: string;
  }>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageIngredientsUri, setImageIngredientsUri] = useState<string | null>(null);
  // --- MODIF 2: État pour la 3ème image ---
  const [imageNutritionUri, setImageNutritionUri] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  // --- MODIF 3: Type mis à jour ---
  const [activePhotoType, setActivePhotoType] = useState<'front' | 'ingredients' | 'nutrition' | null>(null);

  const openCameraInstruction = (type: 'front' | 'ingredients' | 'nutrition') => {
    setActivePhotoType(type);
    setModalVisible(true);
  };

  const handleCameraLaunch = async () => {
    setModalVisible(false);

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
      // --- MODIF 4: Gestion de la 3ème image ---
      if (activePhotoType === 'front') {
        setImageUri(result.assets[0].uri);
      } else if (activePhotoType === 'ingredients') {
        setImageIngredientsUri(result.assets[0].uri);
      } else if (activePhotoType === 'nutrition') {
        setImageNutritionUri(result.assets[0].uri);
      }
    }
  };

  const handleSubmission = async () => {
    // --- MODIF 5: Vérification optionnelle ou obligatoire ? ---
    // Ici j'ai rendu la photo nutrition optionnelle, mais vous pouvez ajouter !imageNutritionUri si obligatoire
    if (!imageUri || !imageIngredientsUri) {
      Alert.alert(t('add_product_title'), t('photo_error'));
      return;
    }
    setLoading(true);

    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error(t('connect'));

      const formData = new FormData();
      formData.append('barcode', params.barcode as string);
      formData.append('typeProduct', params.type as string);
      formData.append('productName', params.productName as string);
      formData.append('brand', params.brand as string);
      formData.append('category', params.category as string);

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

      // --- MODIF 6: Ajout au FormData ---
      if (imageNutritionUri) {
        formData.append('image_nutrition', {
          uri: imageNutritionUri,
          name: `nutrition_${params.barcode}.jpg`,
          type: 'image/jpeg',
        } as any);
      }

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
        <View className="relative w-full h-64">
          <Image source={{ uri }} className="w-full h-full rounded-2xl bg-gray-100 dark:bg-gray-800" resizeMode="cover" />
          <View className="absolute top-0 left-0 w-full h-full bg-black/40 rounded-2xl items-center justify-center">
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
            <Camera size={32} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
          </View>
          <Text className="text-gray-500 dark:text-gray-400 font-medium">{t('take_photo') || "Tap to take photo"}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#181A20]">
      <View className="px-6 pt-6">
        <StepHeader step={3} title={t('step_3_title')} />
      </View>

      <ScrollView className="flex-1 px-6">
        <PhotoButton
          stepNumber={1}
          label={t('take_photo_front')}
          uri={imageUri}
          onPress={() => openCameraInstruction('front')}
        />

        <PhotoButton
          stepNumber={2}
          label={t('take_photo_ingredients')}
          uri={imageIngredientsUri}
          onPress={() => openCameraInstruction('ingredients')}
        />

        {/* --- MODIF 7: Bouton pour la 3ème photo --- */}
        <PhotoButton
          stepNumber={3}
          label={t('take_photo_nutrition') || "Tableau Nutritionnel"}
          uri={imageNutritionUri}
          onPress={() => openCameraInstruction('nutrition')}
        />

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

      {/* Instruction Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/80 justify-center items-center p-6">
          <View className="bg-white dark:bg-[#1F2937] p-5 rounded-3xl w-full max-w-sm shadow-2xl">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">
                {/* --- MODIF 8: Titre dynamique --- */}
                {activePhotoType === 'front' ? t('take_photo_front') :
                  activePhotoType === 'ingredients' ? t('take_photo_ingredients') :
                    t('take_photo_nutrition') || "Tableau Nutritionnel"}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} className="bg-gray-100 dark:bg-gray-800 p-2 rounded-full">
                <X size={20} color={colorScheme === 'dark' ? '#9CA3AF' : '#6B7280'} />
              </TouchableOpacity>
            </View>

            <View className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-2 mb-6">
              <Image
                // --- MODIF 9: Image exemple dynamique ---
                source={activePhotoType === 'front' ? FRONT_EXAMPLE :
                  activePhotoType === 'ingredients' ? BACK_EXAMPLE :
                    NUTRITION_EXAMPLE}
                className="w-full h-64 rounded-xl"
                resizeMode="contain"
              />
            </View>

            <Text className="text-center text-gray-600 dark:text-gray-300 mb-8 px-2 leading-6">
              {/* --- MODIF 10: Texte instruction dynamique --- */}
              {activePhotoType === 'front' ? t('photo_instruction_front') :
                activePhotoType === 'ingredients' ? t('photo_instruction_back') :
                  t('photo_instruction_nutrition') || "Prenez une photo claire du tableau des valeurs nutritionnelles."}
            </Text>

            <TouchableOpacity
              onPress={handleCameraLaunch}
              className="bg-emerald-500 py-4 rounded-2xl items-center shadow-lg shadow-emerald-500/30 active:bg-emerald-600"
            >
              <View className="flex-row items-center">
                <Camera size={20} color="white" className="mr-2 pr-2 " />
                <Text className="text-white font-bold text-lg ml-2">{t('open_camera')}</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}