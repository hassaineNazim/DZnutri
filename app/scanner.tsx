import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Plus, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import Animated, {
  SlideInDown,
  ZoomIn
} from 'react-native-reanimated';
import ScoreGauge from './components/ScoreGauge';
import { useTranslation } from './i18n';
import { fetchProduct } from './services/openFoodFacts';
import { saveToHistory } from './services/saveHistorique';

const { width, height } = Dimensions.get('window');
const SCAN_BOX_WIDTH = width * 0.8;
const SCAN_BOX_HEIGHT = 200;
const MASK_COLOR = 'rgba(0, 0, 0, 0.6)';

const topMaskHeight = (height - SCAN_BOX_HEIGHT) / 2;
const bottomMaskHeight = (height - SCAN_BOX_HEIGHT) / 2;
const sideMaskWidth = (width - SCAN_BOX_WIDTH) / 2;

type Product = {
  id: string;
  product_name?: string;
  brands?: string;
  image_url?: string;
  custom_score?: number;
};

type ScanResult =
  | { status: 'scanning' }
  | { status: 'loading' }
  | { status: 'found', product: Product }
  | { status: 'notFound', barcode: string };

const getScoreDescription = (score?: number) => {
  if (score === undefined || score === null) return 'Inconnu';
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Bon';
  if (score >= 25) return 'Médiocre';
  return 'Mauvais';
}

const getScoreColor = (score?: number) => {
  if (score === undefined || score === null) return '#6B7280';
  if (score >= 75) return '#22C55E';
  if (score >= 50) return '#84CC16';
  if (score >= 25) return '#F97316';
  return '#EF4444';
};

export default function Scanner() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanResult, setScanResult] = useState<ScanResult>({ status: 'scanning' });
  const router = useRouter();

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanResult.status !== 'scanning') return;

    setScanResult({ status: 'loading' });

    try {
      const fetchedProduct = await fetchProduct(data);
      if (fetchedProduct) {
        setScanResult({ status: 'found', product: fetchedProduct });
        await saveToHistory(fetchedProduct);
      } else {
        setScanResult({ status: 'notFound', barcode: data });
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setScanResult({ status: 'notFound', barcode: data });
    }
  };

  const resetScanner = () => setScanResult({ status: 'scanning' });

  const navigateToProductDetails = (product: Product) => {
    router.push({
      pathname: './screens/productDetail',
      params: { product: JSON.stringify(product) },
    });
    resetScanner();
  };

  if (!permission?.granted) {
    return (
      <View className="flex-1 justify-center items-center bg-black">
        <Text className="text-white mb-4">{t('camera_permission_needed')}</Text>
        <Button onPress={requestPermission} title={t('give_camera_permission')} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      <StatusBar barStyle="light-content" />

      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={scanResult.status === 'scanning' ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8'] }}
      />

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        <View style={{ width: width, height: topMaskHeight, backgroundColor: MASK_COLOR }} />

        <View style={{ flexDirection: 'row', height: SCAN_BOX_HEIGHT }}>
          <View style={{ width: sideMaskWidth, height: SCAN_BOX_HEIGHT, backgroundColor: MASK_COLOR }} />

          <View style={{ width: SCAN_BOX_WIDTH, height: SCAN_BOX_HEIGHT, overflow: 'hidden', position: 'relative' }}>
            <View className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-emerald-500 rounded-tl-xl" />
            <View className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-emerald-500 rounded-tr-xl" />
            <View className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-emerald-500 rounded-bl-xl" />
            <View className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-emerald-500 rounded-br-xl" />
          </View>

          <View style={{ width: sideMaskWidth, height: SCAN_BOX_HEIGHT, backgroundColor: MASK_COLOR }} />
        </View>

        <View style={{ width: width, height: bottomMaskHeight, backgroundColor: MASK_COLOR, alignItems: 'center', paddingTop: 40 }}>
          <Text className="text-white/90 text-center bg-black/40 px-6 py-3 rounded-full font-medium text-sm">
            {t('search_placeholder_text') || "Scannez un code-barres"}
          </Text>
        </View>
      </View>

      {scanResult.status === 'loading' && (
        <View className="absolute inset-0 bg-black/60 items-center justify-center z-50">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      )}

      <Modal
        visible={scanResult.status === 'found' || scanResult.status === 'notFound'}
        transparent={true}
        animationType="fade"
        onRequestClose={resetScanner}
      >
        <Pressable
          className={`flex-1 bg-black/60 ${scanResult.status === 'found' ? 'justify-center items-center px-6' : 'justify-end'}`}
          onPress={resetScanner}
        >

          {scanResult.status === 'found' && (
            <Pressable onPress={(e) => e.stopPropagation()} className="w-full max-w-sm">
              <Animated.View
                entering={ZoomIn.duration(200)}
                className="bg-white dark:bg-[#1F2937] rounded-3xl p-6 shadow-2xl"
              >
                <View className="flex-row justify-between items-center mb-5">
                  <Text className="text-2xl font-bold text-gray-900 dark:text-white flex-1 mr-3" numberOfLines={1}>
                    {scanResult.product.product_name || t('no_name')}
                  </Text>
                  <TouchableOpacity
                    onPress={resetScanner}
                    className="bg-white/90 w-10 h-10 rounded-full items-center justify-center shadow-lg"
                    activeOpacity={0.7}
                  >
                    <X size={22} color="#1F2937" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                <Text className="text-sm text-gray-500 dark:text-gray-400 mb-5" numberOfLines={1}>
                  {scanResult.product.brands || t('brand_unknown')}
                </Text>

                <View className="flex-row items-center mb-6 bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-4">
                  <Image
                    source={{ uri: scanResult.product.image_url || 'https://via.placeholder.com/100' }}
                    className="w-20 h-20 rounded-xl bg-white dark:bg-gray-700"
                    resizeMode="contain"
                  />

                  <View className="flex-1 ml-4 flex-row items-center">
                    <ScoreGauge
                      score={scanResult.product.custom_score ?? 0}
                      size={60}
                      strokeWidth={6}
                      showText={true}
                    />
                    <View className="ml-4 flex-1">
                      <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-widest font-bold mb-1">
                        SCORE
                      </Text>
                      <Text
                        className="text-xl font-extrabold"
                        style={{ color: getScoreColor(scanResult.product.custom_score) }}
                      >
                        {getScoreDescription(scanResult.product.custom_score)}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => navigateToProductDetails(scanResult.product)}
                  className="w-full bg-emerald-500 py-4 rounded-2xl items-center active:bg-emerald-600"
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-bold text-base">{t('product_details')}</Text>
                </TouchableOpacity>
              </Animated.View>
            </Pressable>
          )}

          {scanResult.status === 'notFound' && (
            <Pressable onPress={(e) => e.stopPropagation()} className="w-full">
              <Animated.View
                entering={SlideInDown.duration(200)}
                className="bg-white dark:bg-[#1F2937] rounded-t-[32px] p-6 items-center"
              >
                <View className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mb-6" />

                <View className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full items-center justify-center mb-4">
                  <Plus size={32} color="#9CA3AF" />
                </View>

                <Text className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                  {t('unknown_product')}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-center mb-6 px-4 text-sm">
                  {t('help_add_product')}
                </Text>

                <TouchableOpacity
                  className="w-full bg-emerald-500 py-3.5 rounded-xl items-center active:bg-emerald-600 mb-3"
                  onPress={() => {
                    resetScanner();
                    router.push({
                      pathname: './screens/typeProd',
                      params: { barcode: scanResult.barcode },
                    });
                  }}
                >
                  <Text className="text-white font-bold text-base">{t('add_product')}</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={resetScanner} className="p-3">
                  <Text className="text-gray-400 dark:text-gray-500 font-medium text-sm">{t('cancel')}</Text>
                </TouchableOpacity>
              </Animated.View>
            </Pressable>
          )}

        </Pressable>
      </Modal>
    </View>
  );
}