import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronDown, ChevronUp, Edit3, Share2, ThumbsDown, ThumbsUp } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  FadeInDown,
  FadeInUp,
  interpolate,
  Layout,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScoreGauge from '../components/ScoreGauge';
import { useTranslation } from '../i18n';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 300;

type Product = {
  id: string;
  product_name?: string;
  brand?: string;
  image_url?: string;
  custom_score?: number;
  nutriscore_grade?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  detail_custom_score?: { [key: string]: any };
  nutriments?: { [key: string]: any };
  additives_tags?: string[];
};

const Section = ({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Animated.View layout={Layout.springify()} className="bg-white dark:bg-[#1F2937] rounded-2xl mb-4 overflow-hidden shadow-sm">
      <TouchableOpacity
        onPress={() => setIsOpen(!isOpen)}
        className="flex-row items-center justify-between p-4"
        activeOpacity={0.7}
      >
        <Text className="text-lg font-bold text-gray-900 dark:text-white">{title}</Text>
        {isOpen ? <ChevronUp size={20} color="#9CA3AF" /> : <ChevronDown size={20} color="#9CA3AF" />}
      </TouchableOpacity>
      {isOpen && (
        <Animated.View entering={FadeInDown.duration(300)} exiting={FadeInUp.duration(200)} className="px-4 pb-4">
          {children}
        </Animated.View>
      )}
    </Animated.View>
  );
};

const DetailItem = ({ label, value, isPositive }: { label: string; value?: string | number; isPositive?: boolean }) => (
  <View className="flex-row items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
    <View className="flex-row items-center flex-1 mr-4">
      {isPositive !== undefined && (
        <View className={`mr-3 p-1.5 rounded-full ${isPositive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
          {isPositive ? <ThumbsUp size={14} color={isPositive ? '#22C55E' : '#EF4444'} /> : <ThumbsDown size={14} color={isPositive ? '#22C55E' : '#EF4444'} />}
        </View>
      )}
      <Text className="text-gray-700 dark:text-gray-300 text-base flex-1">{label}</Text>
    </View>
    <Text className="text-gray-900 dark:text-white font-semibold text-base">{value}</Text>
  </View>
);

export default function ProductDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { product: productJson } = useLocalSearchParams();
  const product: Product | null = productJson ? JSON.parse(productJson as string) : null;
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-[#181A20]">
        <Text className="text-red-500 text-lg">{t('product_unknown')}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <Text className="text-gray-900 dark:text-white">{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const scrollHandler = useAnimatedScrollHandler(event => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(scrollY.value, [-100, 0, HEADER_HEIGHT], [HEADER_HEIGHT + 100, HEADER_HEIGHT, 100], Extrapolation.CLAMP),
      opacity: interpolate(scrollY.value, [0, HEADER_HEIGHT - 100], [1, 0]),
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [-100, 0, HEADER_HEIGHT / 2], [1, 1, 0]),
      transform: [
        { scale: interpolate(scrollY.value, [-100, 0], [1.2, 1], Extrapolation.CLAMP) },
        { translateY: interpolate(scrollY.value, [-100, 0, HEADER_HEIGHT], [0, 0, 50], Extrapolation.CLAMP) }
      ]
    };
  });

  const getNutrimentValue = (key: string) => product?.nutriments?.[key + '_100g'] ?? t('not_available');
  const getNutrimentUnit = (key: string) => product?.nutriments?.[key + '_unit'] ?? '';

  const getScoreDescription = (score?: number) => {
    if (score === undefined) return t('unknown_product');
    if (score >= 75) return t('excellent');
    if (score >= 50) return t('good');
    if (score >= 25) return t('mediocre');
    return t('bad');
  };

  const getScoreColor = (score?: number) => {
    if (score === undefined) return '#6B7280';
    if (score >= 75) return '#22C55E';
    if (score >= 50) return '#84CC16';
    if (score >= 25) return '#F97316';
    return '#EF4444';
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#181A20]">
      <StatusBar barStyle="light-content" />

      {/* Fixed Header Actions */}
      <View
        className="absolute top-0 left-0 right-0 z-50 flex-row justify-between items-center px-4"
        style={{ paddingTop: insets.top + 10 }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full items-center justify-center"
        >
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>

        <View className="flex-row space-x-3">
          <TouchableOpacity className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full items-center justify-center">
            <Share2 size={20} color="white" />
          </TouchableOpacity>
          <TouchableOpacity className="w-10 h-10 bg-black/30 backdrop-blur-md rounded-full items-center justify-center">
            <Edit3 size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Parallax Header Background */}
        <Animated.View className="w-full bg-white dark:bg-[#1F2937] items-center justify-end pb-10 overflow-hidden" style={[headerStyle]}>
          <Animated.Image
            source={{ uri: product.image_url || 'https://via.placeholder.com/300' }}
            className="w-64 h-64"
            resizeMode="contain"
            style={imageStyle}
          />
        </Animated.View>

        {/* Content Body */}
        <View className="-mt-6 rounded-t-[32px] bg-gray-50 dark:bg-[#181A20] px-5 pt-8 min-h-screen">

          {/* Title & Brand */}
          <View className="items-center mb-8">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
              {product.product_name || t('no_name')}
            </Text>
            <Text className="text-lg text-gray-500 dark:text-gray-400">
              {product.brand || t('brand_unknown')}
            </Text>
          </View>

          {/* Score Gauge */}
          <View className="items-center mb-10">
            <ScoreGauge score={product.custom_score} size={160} strokeWidth={12} />
            <Text
              className="text-2xl font-bold mt-4"
              style={{ color: getScoreColor(product.custom_score) }}
            >
              {getScoreDescription(product.custom_score)}
            </Text>
          </View>

          {/* Analysis Sections */}
          <Section title={t('quality') || "Qualités"} defaultOpen={true}>
            {product.nutriments?.fiber_100g > 3 && (
              <DetailItem label="Riche en fibres" value={`${getNutrimentValue('fiber')} ${getNutrimentUnit('fiber')}`} isPositive={true} />
            )}
            {product.nutriments?.proteins_100g > 10 && (
              <DetailItem label="Excellente source de protéines" value={`${getNutrimentValue('proteins')} ${getNutrimentUnit('proteins')}`} isPositive={true} />
            )}
            {/* Fallback if no specific qualities detected */}
            {(!product.nutriments?.fiber_100g || product.nutriments.fiber_100g <= 3) &&
              (!product.nutriments?.proteins_100g || product.nutriments.proteins_100g <= 10) && (
                <Text className="text-gray-500 dark:text-gray-400 italic">Aucune qualité spécifique détectée.</Text>
              )}
          </Section>

          <Section title={t('defects') || "Défauts"} defaultOpen={true}>
            {product.nova_group && product.nova_group > 3 && (
              <DetailItem label="Produit ultra-transformé" value={`NOVA ${product.nova_group}`} isPositive={false} />
            )}
            {product.nutriments?.sugars_100g > 10 && (
              <DetailItem label="Trop sucré" value={`${getNutrimentValue('sugars')} ${getNutrimentUnit('sugars')}`} isPositive={false} />
            )}
            {product.nutriments?.saturated_fat_100g > 5 && (
              <DetailItem label="Graisses saturées élevées" value={`${getNutrimentValue('saturated-fat')} ${getNutrimentUnit('saturated-fat')}`} isPositive={false} />
            )}
            {/* Fallback */}
            {(!product.nova_group || product.nova_group <= 3) &&
              (!product.nutriments?.sugars_100g || product.nutriments.sugars_100g <= 10) &&
              (!product.nutriments?.saturated_fat_100g || product.nutriments.saturated_fat_100g <= 5) && (
                <Text className="text-gray-500 dark:text-gray-400 italic">Aucun défaut majeur détecté.</Text>
              )}
          </Section>

          <Section title={t('nutrition_facts') || "Informations nutritionnelles"}>
            <DetailItem label="Énergie" value={`${getNutrimentValue('energy-kcal')} kcal`} />
            <DetailItem label="Graisses" value={`${getNutrimentValue('fat')} ${getNutrimentUnit('fat')}`} />
            <DetailItem label="Glucides" value={`${getNutrimentValue('carbohydrates')} ${getNutrimentUnit('carbohydrates')}`} />
            <DetailItem label="Sel" value={`${getNutrimentValue('salt')} ${getNutrimentUnit('salt')}`} />
          </Section>

          <Section title={t('additional_info') || "Informations complémentaires"}>
            {product.nutriscore_grade && (
              <DetailItem label="Nutri-Score" value={product.nutriscore_grade.toUpperCase()} />
            )}
            {product.ecoscore_grade && (
              <DetailItem label="Eco-Score" value={product.ecoscore_grade.toUpperCase()} />
            )}
            {product.additives_tags && (
              <DetailItem label="Additifs" value={`${product.additives_tags.length} détectés`} />
            )}
          </Section>

        </View>
      </Animated.ScrollView>
    </View>
  );
}