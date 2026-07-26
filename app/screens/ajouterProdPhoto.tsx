import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Camera, Check, RefreshCw, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StatusBar, TouchableOpacity, View } from 'react-native';
import AppModal from '../components/ui/AppModal';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import StepHeader from '../components/StepHeader';
import Txt from '../components/ui/Txt';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n';
import { api } from '../services/axios';
import { colors, getThemeScheme, radius, shadows } from '../theme/tokens';
import { getAccessToken } from '../services/tokenStore';

const FRONT_EXAMPLE = require('../../assets/images/Gemini_Generated_Image_dlyit9dlyit9dlyi.png');
const BACK_EXAMPLE = require('../../assets/images/Gemini_Generated_Image_3ypwh63ypwh63ypw.png');
const NUTRITION_EXAMPLE = require('../../assets/images/Gemini_Generated_Image_3ypwh63ypwh63ypw.png');

// Réduit la photo brute (souvent 10+ Mpx) avant l'upload : sur un réseau
// mobile lent, 3 photos non compressées font facilement dépasser le délai
// d'attente et remontent en "Network Error" côté app. L'OCR n'a pas besoin
// de la pleine résolution du capteur.
async function compressForUpload(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1600 } }],
      { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG },
    );
    return result.uri;
  } catch {
    return uri;
  }
}

export default function AjouterProduitPhotoPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ barcode: string; type: string; typeSpecifique: string; productName: string; brand: string; category: string }>();
  const { showToast } = useToast();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageIngredientsUri, setImageIngredientsUri] = useState<string | null>(null);
  const [imageNutritionUri, setImageNutritionUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [activePhotoType, setActivePhotoType] = useState<'front' | 'ingredients' | 'nutrition' | null>(null);

  const openCameraInstruction = (type: 'front' | 'ingredients' | 'nutrition') => {
    setActivePhotoType(type);
    setModalVisible(true);
  };

  const handleCameraLaunch = async () => {
    setModalVisible(false);
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert(t('add_product_title'), t('camera_permission_needed'));
        return;
      }
      // allowsEditing (crop natif) désactivé : source de gels/plantages sur
      // certains appareils Android avec la New Architecture. Pas nécessaire
      // ici, la photo brute suffit pour l'OCR.
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result.canceled && result.assets?.[0]) {
        const uri = await compressForUpload(result.assets[0].uri);
        if (activePhotoType === 'front') setImageUri(uri);
        else if (activePhotoType === 'ingredients') setImageIngredientsUri(uri);
        else if (activePhotoType === 'nutrition') setImageNutritionUri(uri);
      }
    } catch (error: any) {
      showToast(error?.message || t('photo_error'), 'error');
    }
  };

  const handleSubmission = async () => {
    if (!imageUri || !imageIngredientsUri) {
      Alert.alert(t('add_product_title'), t('photo_error'));
      return;
    }
    setLoading(true);
    try {
      const userToken = await getAccessToken();
      if (!userToken) throw new Error(t('connect'));

      const formData = new FormData();
      formData.append('barcode', params.barcode as string);
      formData.append('typeProduct', params.type as string);
      formData.append('typeSpecifique', params.typeSpecifique as string);
      formData.append('productName', params.productName as string);
      formData.append('brand', params.brand as string);
      formData.append('image_front', { uri: imageUri, name: `front_${params.barcode}.jpg`, type: 'image/jpeg' } as any);
      formData.append('image_ingredients', { uri: imageIngredientsUri, name: `ingredients_${params.barcode}.jpg`, type: 'image/jpeg' } as any);
      if (imageNutritionUri) {
        formData.append('image_nutrition', { uri: imageNutritionUri, name: `nutrition_${params.barcode}.jpg`, type: 'image/jpeg' } as any);
      }

      await api.post('/api/submission', formData, { timeout: 60000 });
      showToast(t('success_message') || 'Produit soumis avec succès !', 'success');
      setTimeout(() => router.replace('../scanner'), 1500);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || 'Une erreur est survenue';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const PhotoButton = ({ uri, onPress, label, stepNumber }: { uri: string | null; onPress: () => void; label: string; stepNumber: number }) => (
    <Animated.View entering={FadeInDown.delay(stepNumber * 100).springify()} style={{ marginBottom: 20 }}>
      <Txt variant="medium" size={13} color={colors.inkSoft} style={{ marginBottom: 10, marginLeft: 2 }}>
        {stepNumber}. {label}
      </Txt>
      {uri ? (
        <View style={{ width: '100%', height: 250, borderRadius: radius.card, overflow: 'hidden' }}>
          <Image source={{ uri }} accessible={false} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          <View style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(20,17,16,0.4)', alignItems: 'center', justifyContent: 'center' }}>
            <Animated.View entering={ZoomIn} style={{ backgroundColor: colors.green, borderRadius: 20, padding: 8, marginBottom: 10 }}>
              <Check size={24} color={colors.white} />
            </Animated.View>
            <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={`${t('retake_photo')}, ${label}`} style={{ backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <RefreshCw size={14} color={colors.white} />
              <Txt variant="semibold" size={12} color={colors.white}>{t('retake_photo')}</Txt>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`${t('take_photo')}, ${label}`}
          activeOpacity={0.75}
          style={{ width: '100%', height: 190, backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}
        >
          <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
            <Camera size={30} color={colors.inkSoft} />
          </View>
          <Txt variant="semibold" size={14} color={colors.inkSoft}>{t('take_photo') || 'Prendre une photo'}</Txt>
        </TouchableOpacity>
      )}
    </Animated.View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.sheet }}>
      <StatusBar barStyle={getThemeScheme() === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.sheet} />
      <View style={{ paddingHorizontal: 24, paddingTop: 16 }}>
        <StepHeader step={3} title={t('step_3_title')} />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <PhotoButton stepNumber={1} label={t('take_photo_front')} uri={imageUri} onPress={() => openCameraInstruction('front')} />
        <PhotoButton stepNumber={2} label={t('take_photo_ingredients')} uri={imageIngredientsUri} onPress={() => openCameraInstruction('ingredients')} />
        <PhotoButton stepNumber={3} label={t('take_photo_nutrition') || 'Tableau Nutritionnel'} uri={imageNutritionUri} onPress={() => openCameraInstruction('nutrition')} />

        {imageUri && imageIngredientsUri && (
          <Animated.View entering={FadeInDown.delay(300).springify()} style={{ marginTop: 4, marginBottom: 30 }}>
            <TouchableOpacity
              onPress={handleSubmission}
              disabled={loading}
              accessibilityRole="button"
              accessibilityLabel={t('submit_product')}
              accessibilityState={{ disabled: loading, busy: loading }}
              activeOpacity={0.85}
              style={{ paddingVertical: 16, borderRadius: radius.cta, alignItems: 'center', backgroundColor: loading ? '#e6c94f' : colors.yellow }}
            >
              {loading ? <ActivityIndicator color={colors.inkOnYellow} /> : <Txt variant="bold" size={16} color={colors.inkOnYellow}>{t('submit_product')}</Txt>}
            </TouchableOpacity>
          </Animated.View>
        )}
      </ScrollView>

      {/* Instructions photo — AppModal : le Modal natif figeait l'app. */}
      <AppModal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(20,17,16,0.8)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <View style={[{ backgroundColor: colors.sheet, padding: 20, borderRadius: 28, width: '100%', maxWidth: 380 }, shadows.resultCard]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Txt variant="displayXBold" size={20} color={colors.ink} style={{ flex: 1 }}>
                {activePhotoType === 'front' ? t('take_photo_front') : activePhotoType === 'ingredients' ? t('take_photo_ingredients') : t('take_photo_nutrition') || 'Tableau Nutritionnel'}
              </Txt>
              <TouchableOpacity onPress={() => setModalVisible(false)} accessibilityRole="button" accessibilityLabel={t('close')} style={{ backgroundColor: colors.bordeauxSoft, padding: 8, borderRadius: 20 }}>
                <X size={20} color={colors.accent} />
              </TouchableOpacity>
            </View>

            <View style={{ backgroundColor: colors.chipBg, borderRadius: 18, padding: 8, marginBottom: 18 }}>
              <Image
                source={activePhotoType === 'front' ? FRONT_EXAMPLE : activePhotoType === 'ingredients' ? BACK_EXAMPLE : NUTRITION_EXAMPLE}
                accessible={false}
                style={{ width: '100%', height: 250, borderRadius: 12 }}
                resizeMode="contain"
              />
            </View>

            <Txt variant="body" size={13.5} color={colors.inkSoft} style={{ textAlign: 'center', marginBottom: 20, lineHeight: 20, paddingHorizontal: 8 }}>
              {activePhotoType === 'front' ? t('photo_instruction_front') : activePhotoType === 'ingredients' ? t('photo_instruction_back') : t('photo_instruction_nutrition') || 'Prenez une photo claire du tableau des valeurs nutritionnelles.'}
            </Txt>

            <TouchableOpacity onPress={handleCameraLaunch} accessibilityRole="button" accessibilityLabel={t('open_camera')} activeOpacity={0.85} style={{ backgroundColor: colors.yellow, paddingVertical: 16, borderRadius: radius.cta, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
              <Camera size={20} color={colors.inkOnYellow} />
              <Txt variant="bold" size={16} color={colors.inkOnYellow}>{t('open_camera')}</Txt>
            </TouchableOpacity>
          </View>
        </View>
      </AppModal>
    </View>
  );
}
