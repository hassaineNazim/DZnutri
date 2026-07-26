import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Camera, Check } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StatusBar, TextInput, TouchableOpacity, View } from 'react-native';
import Txt from '../components/ui/Txt';
import { useToast } from '../context/ToastContext';
import { useTranslation } from '../i18n';
import { api } from '../services/axios';
import { colors, fonts, getThemeScheme, radius, shadows } from '../theme/tokens';

const PINK = '#EC4899';

// Réduit la photo brute avant l'upload (cf. ajouterProdPhoto.tsx) : évite les
// "Network Error" sur réseau mobile lent avec des fichiers non compressés.
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

export default function AjouterCosmetique() {
  const router = useRouter();
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { barcode } = useLocalSearchParams<{ barcode: string }>();

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [category, setCategory] = useState('');
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const takePhoto = async (which: 'front' | 'back') => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        showToast(t('camera_permission_needed'), 'error');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.6, allowsEditing: false });
      if (!result.canceled && result.assets?.[0]) {
        const uri = await compressForUpload(result.assets[0].uri);
        if (which === 'front') setFrontUri(uri);
        else setBackUri(uri);
      }
    } catch (error: any) {
      showToast(error?.message || t('photo_error'), 'error');
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
      if (backUri) formData.append('image_back', { uri: backUri, name: `back_${barcode}.jpg`, type: 'image/jpeg' } as any);

      await api.post('/api/cosmetic/submission', formData, { timeout: 60000 });
      showToast(t('cosmetic_submitted'), 'success');
      setTimeout(() => router.replace('/(tabs)/historique'), 1200);
    } catch (error: any) {
      const msg = error?.response?.data?.detail || error?.message || 'Une erreur est survenue';
      showToast(typeof msg === 'string' ? msg : "Erreur lors de l'envoi", 'error');
    } finally {
      setLoading(false);
    }
  };

  const PhotoCard = ({ uri, onPress, label, hint }: { uri: string | null; onPress: () => void; label: string; hint: string }) => (
    <TouchableOpacity onPress={onPress} accessibilityRole="button" accessibilityLabel={`${label}. ${hint}`} activeOpacity={0.8} style={{ flex: 1 }}>
      <View style={{ backgroundColor: colors.card, borderRadius: radius.card, borderWidth: 2, borderStyle: 'dashed', borderColor: '#e2b7cf', overflow: 'hidden', height: 160 }}>
        {uri ? (
          <Image source={{ uri }} accessible={false} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 }}>
            <Camera size={28} color={PINK} />
            <Txt variant="semibold" size={14} color={colors.ink} style={{ marginTop: 8, textAlign: 'center' }}>{label}</Txt>
            <Txt variant="body" size={12} color={colors.inkMeta} style={{ marginTop: 3, textAlign: 'center' }}>{hint}</Txt>
          </View>
        )}
        {uri ? (
          <View style={{ position: 'absolute', top: 8, right: 8, backgroundColor: colors.green, borderRadius: 14, width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}>
            <Check size={16} color={colors.white} strokeWidth={3} />
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const inputStyle = {
    backgroundColor: colors.card,
    padding: 15,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    color: colors.ink,
    fontFamily: fonts.sans,
    fontSize: 15,
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.sheet }}>
      <StatusBar barStyle={getThemeScheme() === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.sheet} />
      {/* Entête */}
      <View style={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={t('back')} style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }, shadows.listCard]}>
          <ArrowLeft size={20} color={colors.accent} />
        </Pressable>
        <Txt variant="displayXBold" size={20} color={colors.ink}>{t('add_cosmetic_title')}</Txt>
      </View>

      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Txt variant="body" size={14} color={colors.inkSoft} style={{ marginBottom: 16 }}>
          {t('barcode_label')} <Txt variant="bold" size={14} color={colors.ink}>{barcode}</Txt>
        </Txt>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <PhotoCard uri={frontUri} onPress={() => takePhoto('front')} label={t('front_face')} hint={t('the_product')} />
          <PhotoCard uri={backUri} onPress={() => takePhoto('back')} label={t('back_inci')} hint={t('ingredients_list')} />
        </View>

        <View style={{ marginTop: 20, gap: 12 }}>
          <TextInput accessibilityLabel={t('product_name_optional')} style={inputStyle} placeholder={t('product_name_optional')} placeholderTextColor={colors.inkMeta} value={productName} onChangeText={setProductName} />
          <TextInput accessibilityLabel={t('brand_optional')} style={inputStyle} placeholder={t('brand_optional')} placeholderTextColor={colors.inkMeta} value={brand} onChangeText={setBrand} />
          <TextInput accessibilityLabel={t('category_optional')} style={inputStyle} placeholder={t('category_optional')} placeholderTextColor={colors.inkMeta} value={category} onChangeText={setCategory} />
        </View>

        <TouchableOpacity disabled={loading} onPress={submit} accessibilityRole="button" accessibilityLabel={t('send_for_validation')} accessibilityState={{ disabled: loading, busy: loading }} activeOpacity={0.85} style={{ backgroundColor: PINK, paddingVertical: 16, borderRadius: radius.cta, alignItems: 'center', marginTop: 22 }}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Txt variant="bold" size={16} color={colors.white}>{t('send_for_validation')}</Txt>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
