import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { Check, Plus, X, Zap } from 'lucide-react-native';
import React, { useEffect } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Pressable,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Txt from './components/ui/Txt';
import ScoreRing from './components/ui/ScoreRing';
import { useTranslation } from './i18n';
import { fetchCosmetic } from './services/cosmetics';
import { fetchProduct } from './services/openFoodFacts';
import { saveCosmeticToHistory, saveToHistory } from './services/saveHistorique';
import { colors, radius, scoreBand, shadows } from './theme/tokens';

const { width } = Dimensions.get('window');
const VIEWFINDER = Math.min(260, width * 0.68);

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
  | { status: 'found'; product: Product }
  | { status: 'notFound'; barcode: string };

// Laser rouge animé (keyframe dz-scan : translateY -70 → 70 → -70, 2.6s boucle).
function ScanLaser({ color }: { color: string }) {
  const y = useSharedValue(-VIEWFINDER / 2 + 20);
  useEffect(() => {
    y.value = withRepeat(
      withTiming(VIEWFINDER / 2 - 20, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: y.value }] }));
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: -6,
          right: -6,
          height: 3,
          top: '50%',
          backgroundColor: color,
          shadowColor: color,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.6,
          shadowRadius: 8,
        },
        style,
      ]}
    />
  );
}

// Coins jaunes/verts du viseur.
function Corner({ pos, color }: { pos: 'tl' | 'tr' | 'bl' | 'br'; color: string }) {
  const S = 42;
  const base: any = { position: 'absolute', width: S, height: S, borderColor: color };
  const map: Record<string, any> = {
    tl: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 14 },
    tr: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 14 },
    bl: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 14 },
    br: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 14 },
  };
  return <View style={[base, map[pos]]} />;
}

export default function Scanner() {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanResult, setScanResult] = React.useState<ScanResult>({ status: 'scanning' });
  const [mode, setMode] = React.useState<'food' | 'cosmetic'>('food');
  const [torch, setTorch] = React.useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!permission?.granted) requestPermission();
  }, [permission?.granted, requestPermission]);

  const isCosmetic = mode === 'cosmetic';
  const accent = isCosmetic ? '#EC4899' : colors.yellow;

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanResult.status !== 'scanning') return;
    Vibration.vibrate(60);
    setScanResult({ status: 'loading' });
    try {
      if (mode === 'cosmetic') {
        const cosmetic = await fetchCosmetic(data);
        if (cosmetic) {
          setScanResult({
            status: 'found',
            product: { ...cosmetic, brands: cosmetic.brand, custom_score: cosmetic.cosmetic_score ?? undefined } as any,
          });
          await saveCosmeticToHistory(cosmetic.id);
        } else {
          setScanResult({ status: 'notFound', barcode: data });
        }
      } else {
        const fetchedProduct = await fetchProduct(data);
        if (fetchedProduct) {
          setScanResult({ status: 'found', product: fetchedProduct });
          await saveToHistory(fetchedProduct);
        } else {
          setScanResult({ status: 'notFound', barcode: data });
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
      setScanResult({ status: 'notFound', barcode: data });
    }
  };

  const resetScanner = () => setScanResult({ status: 'scanning' });

  const navigateToProductDetails = (product: Product) => {
    router.push({
      pathname: mode === 'cosmetic' ? './screens/cosmeticDetail' : './screens/productDetail',
      params: { product: JSON.stringify(product) },
    });
    resetScanner();
  };

  const goToAddFlow = (barcode?: string) => {
    resetScanner();
    router.push({
      pathname: mode === 'cosmetic' ? './screens/ajouterCosmetique' : './screens/typeProd',
      params: barcode ? { barcode } : {},
    });
  };

  if (!permission?.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Txt variant="medium" size={16} color={colors.cream} style={{ marginBottom: 16, textAlign: 'center' }}>
          {t('camera_permission_needed')}
        </Txt>
        <TouchableOpacity
          onPress={requestPermission}
          accessibilityRole="button"
          accessibilityLabel={t('give_camera_permission')}
          style={{ backgroundColor: colors.yellow, paddingHorizontal: 24, paddingVertical: 14, borderRadius: radius.cta }}
        >
          <Txt variant="bold" size={15} color={colors.inkOnYellow}>{t('give_camera_permission')}</Txt>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.dark }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      <CameraView
        style={StyleSheet.absoluteFill}
        enableTorch={torch}
        onBarcodeScanned={scanResult.status === 'scanning' ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8'] }}
      />

      {/* Voile sombre pour faire ressortir le viseur */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,17,16,0.55)' }]} pointerEvents="none" />

      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {/* Entête : fermer + flash */}
        <View style={{ paddingHorizontal: 22, paddingTop: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('close')}
            style={styles.roundGlass}
          >
            <X size={20} color={colors.cream} strokeWidth={2.2} />
          </Pressable>
          <Pressable
            onPress={() => setTorch((v) => !v)}
            accessibilityRole="switch"
            accessibilityLabel={t('flash')}
            accessibilityState={{ checked: torch }}
            style={[styles.roundGlass, torch && { backgroundColor: 'rgba(240,138,60,0.35)' }]}
          >
            <Zap size={20} color={colors.orangeAlt} fill={torch ? colors.orangeAlt : 'none'} />
          </Pressable>
        </View>

        {/* Titre */}
        <View style={{ alignItems: 'center', marginTop: 18 }}>
          <Txt variant="bold" size={12} color={accent} style={{ letterSpacing: 2 }}>
            {(t('scan_in_progress') || 'SCAN EN COURS').toUpperCase()}
          </Txt>
          <Txt variant="display" size={30} color={colors.creamTitle} style={{ marginTop: 8, textAlign: 'center' }}>
            {isCosmetic ? t('cosmetic') || 'Cosmétique' : t('scan_frame_title') || 'Cadrez le code-barres'}
          </Txt>
        </View>

        {/* Viseur */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ width: VIEWFINDER, height: VIEWFINDER }}>
            <Corner pos="tl" color={accent} />
            <Corner pos="tr" color={accent} />
            <Corner pos="bl" color={accent} />
            <Corner pos="br" color={accent} />
            <ScanLaser color={colors.laser} />
          </View>
        </View>

        {/* Sélecteur Aliment / Cosmétique */}
        <View style={{ alignItems: 'center', marginBottom: 44 }}>
          <View style={{ flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: radius.pill, padding: 4 }}>
            <TouchableOpacity
              onPress={() => setMode('food')}
              accessibilityRole="radio"
              accessibilityState={{ selected: mode === 'food' }}
              accessibilityLabel={t('food')}
              style={{ paddingHorizontal: 20, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: mode === 'food' ? colors.yellow : 'transparent' }}
              activeOpacity={0.85}
            >
              <Txt variant="bold" size={13} color={mode === 'food' ? colors.inkOnYellow : 'rgba(244,234,214,0.7)'}>
                {t('food') || 'Aliment'}
              </Txt>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setMode('cosmetic')}
              accessibilityRole="radio"
              accessibilityState={{ selected: mode === 'cosmetic' }}
              accessibilityLabel={t('cosmetic')}
              style={{ paddingHorizontal: 20, paddingVertical: 9, borderRadius: radius.pill, backgroundColor: mode === 'cosmetic' ? '#EC4899' : 'transparent' }}
              activeOpacity={0.85}
            >
              <Txt variant="bold" size={13} color={mode === 'cosmetic' ? colors.white : 'rgba(244,234,214,0.7)'}>
                {t('cosmetic') || 'Cosmétique'}
              </Txt>
            </TouchableOpacity>
          </View>
        </View>

      </View>

      {/* Chargement */}
      {scanResult.status === 'loading' && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(20,17,16,0.6)', alignItems: 'center', justifyContent: 'center' }]}>
          <ActivityIndicator size="large" color={accent} />
        </View>
      )}

      {/* Résultat du scan : overlay EN LIGNE, PAS de <Modal> natif.
          Sur la nouvelle architecture Android, le contenu d'un Modal natif se
          rendait replié en haut à gauche et sa fenêtre invisible figeait
          l'écran. Un overlay absolu dans la même hiérarchie est fiable. */}
      {(scanResult.status === 'found' || scanResult.status === 'notFound') && (
        <Pressable
          accessible={false}
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(20,17,16,0.6)',
              justifyContent: scanResult.status === 'found' ? 'center' : 'flex-end',
              alignItems: scanResult.status === 'found' ? 'center' : 'stretch',
              padding: scanResult.status === 'found' ? 24 : 0,
              zIndex: 50,
              elevation: 50,
            },
          ]}
          onPress={resetScanner}
        >
          {scanResult.status === 'found' && (
            <Pressable accessible={false} onPress={(e) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380 }}>
              <View style={[{ backgroundColor: colors.sheet, borderRadius: radius.sheet, padding: 20 }, shadows.resultCard]}>
                {/* Bandeau succès */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={16} color={colors.white} strokeWidth={3} />
                  </View>
                  <Txt variant="bold" size={12} color={colors.green} style={{ letterSpacing: 1.5 }}>
                    {(t('product_detected') || 'PRODUIT DÉTECTÉ').toUpperCase()}
                  </Txt>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
                  <Image
                    source={{ uri: scanResult.product.image_url || 'https://via.placeholder.com/100' }}
                    accessible={false}
                    style={{ width: 64, height: 64, borderRadius: 15, backgroundColor: colors.thumbBg }}
                    resizeMode="contain"
                  />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt variant="displayXBold" size={20} color={colors.ink} numberOfLines={1}>
                      {scanResult.product.product_name || t('no_name')}
                    </Txt>
                    <Txt variant="body" size={13} color={colors.inkSoft} numberOfLines={1} style={{ marginTop: 3 }}>
                      {scanResult.product.brands || t('brand_unknown')}
                    </Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: scoreBand(scanResult.product.custom_score).color }} />
                      <Txt variant="semibold" size={12.5} color={scoreBand(scanResult.product.custom_score).color}>
                        {t(scoreBand(scanResult.product.custom_score).labelKey) || scoreBand(scanResult.product.custom_score).label}
                      </Txt>
                    </View>
                  </View>
                  <ScoreRing score={scanResult.product.custom_score} size={58} fontSize={18} />
                </View>

                <TouchableOpacity
                  onPress={() => navigateToProductDetails(scanResult.product)}
                  accessibilityRole="button"
                  accessibilityLabel={t('product_details')}
                  style={{ marginTop: 18, backgroundColor: colors.dark, borderRadius: radius.cta, paddingVertical: 18, alignItems: 'center' }}
                  activeOpacity={0.85}
                >
                  <Txt variant="bold" size={16} color={colors.cream}>{t('product_details')}</Txt>
                </TouchableOpacity>
              </View>
            </Pressable>
          )}

          {scanResult.status === 'notFound' && (
            <Pressable accessible={false} onPress={(e) => e.stopPropagation()} style={{ width: '100%' }}>
              <View style={{ backgroundColor: colors.sheet, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, alignItems: 'center' }}>
                <View style={{ width: 48, height: 6, borderRadius: 3, backgroundColor: colors.handle, marginBottom: 22 }} />
                <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <Plus size={32} color={colors.inkOnYellow} />
                </View>
                <Txt variant="displayXBold" size={22} color={colors.ink} style={{ marginBottom: 6, textAlign: 'center' }}>
                  {t('product_not_found_q') || 'Produit introuvable ?'}
                </Txt>
                <Txt variant="body" size={14} color={colors.inkSoft} style={{ marginBottom: 22, textAlign: 'center', paddingHorizontal: 16 }}>
                  {t('help_add_product')}
                </Txt>
                <TouchableOpacity
                  style={{ width: '100%', backgroundColor: colors.dark, borderRadius: radius.cta, paddingVertical: 16, alignItems: 'center', marginBottom: 12 }}
                  onPress={() => goToAddFlow(scanResult.barcode)}
                  accessibilityRole="button"
                  accessibilityLabel={t('add_product')}
                  activeOpacity={0.85}
                >
                  <Txt variant="bold" size={16} color={colors.cream}>{t('add_product')}</Txt>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={resetScanner}
                  accessibilityRole="button"
                  accessibilityLabel={t('cancel')}
                  style={{ padding: 12 }}
                >
                  <Txt variant="semibold" size={14} color={colors.inkSoft}>{t('cancel')}</Txt>
                </TouchableOpacity>
              </View>
            </Pressable>
          )}
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  roundGlass: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
