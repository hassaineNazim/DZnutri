import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, Check, ChevronDown, ChevronRight, ChevronUp, Edit3, Heart } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Image, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  Extrapolation,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReportModal from '../components/ReportModal';
import ScoreGauge from '../components/ScoreGauge';
import { useTranslation } from '../i18n';

const { width } = Dimensions.get('window');
const HEADER_HEIGHT = 300;

type Product = {
  id: string;
  barcode?: string;
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
  ingredients_text?: string;
};

// --- HELPERS DE COULEUR ---
const getScoreColor = (score?: number) => {
  if (score === undefined) return '#6B7280';
  if (score >= 60) return '#22C55E'; // Vert
  if (score >= 30) return '#F97316'; // Orange
  return '#EF4444'; // Rouge
};

// Helper pour simuler les niveaux (Low/Moderate/High)
// Dans un vrai cas, utilisez les données 'nutrient_levels' d'OFF si disponibles
const getLevelColor = (value: number, highThreshold: number, moderateThreshold: number) => {
  if (value > highThreshold) return '#EF4444'; // Rouge (Élevé - Mauvais)
  if (value > moderateThreshold) return '#F97316'; // Orange (Modéré)
  return '#22C55E'; // Vert (Faible - Bon)
};

// Pour les nutriments positifs (Protéines, Fibres), la logique est inversée
const getPositiveLevelColor = (value: number, highThreshold: number, moderateThreshold: number) => {
  if (value > highThreshold) return '#22C55E'; // Vert (Élevé - Bon)
  if (value > moderateThreshold) return '#F97316'; // Orange
  return '#EF4444'; // Rouge (Faible - Mauvais)
};


export default function ProductDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { product: productJson } = useLocalSearchParams();
  const product: Product | null = productJson ? JSON.parse(productJson as string) : null;
  const insets = useSafeAreaInsets();
  const scrollY = useSharedValue(0);
  const [reportModalVisible, setReportModalVisible] = useState(false);

  if (!product) return null;

  console.log(product);

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

  const getNutrimentValue = (key: string) => Math.round(Number(product?.nutriments?.[key + '_100g'] ?? 0) * 10) / 10;

  return (
    <View className="flex-1 bg-white dark:bg-[#181A20]">
      <StatusBar barStyle="dark-content" />

      {/* Header Flottant */}
      <View
        className="absolute top-0 left-0 right-0 z-50 flex-row justify-between items-center px-4"
        style={{ paddingTop: insets.top + 10 }}
      >
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full items-center justify-center shadow-sm">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <View className="flex-row space-x-3">
          <TouchableOpacity onPress={() => setReportModalVisible(true)} className="w-10 h-10 bg-white/80 dark:bg-black/50 backdrop-blur-md rounded-full items-center justify-center shadow-sm">
            <Edit3 size={20} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Header Produit + Score */}
        <View className="flex-row px-5 pt-24 pb-6">
          <Image
            source={{ uri: product.image_url }}
            className="w-28 h-40 rounded-lg mr-4 bg-gray-50 dark:bg-gray-800"
            resizeMode="contain"
          />
          <View className="flex-1 justify-center">
            <Text className="text-2xl font-bold text-gray-900 dark:text-white mb-1 leading-7">{product.product_name}</Text>
            <Text className="text-gray-500 dark:text-gray-400 text-base mb-4">{product.brand}</Text>
            <View className="flex-row items-center gap-3">
              {product.nutriscore_grade && (
                <View>
                  <Text className="text-xs text-gray-400 dark:text-gray-500 mb-0.5 uppercase font-bold">Nutri-score</Text>
                  <NutriScoreBadge grade={product.nutriscore_grade} />
                </View>
              )}
              {product.nova_group && (
                <View>
                  <Text className="text-xs text-gray-400 dark:text-gray-500 mb-0.5 uppercase font-bold">Nova</Text>
                  <View className={`w-8 h-8 rounded items-center justify-center ${product.nova_group > 3 ? 'bg-red-500' : 'bg-green-500'}`}>
                    <Text className="text-white font-bold">{product.nova_group}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
          <View className="justify-center ml-2">
            <ScoreGauge score={product.custom_score} size={90} strokeWidth={8} />
          </View>
        </View>


        {/* --- SECTION ADDITIFS --- */}
        <View className="mx-4 mt-4 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1F2937] shadow-sm overflow-hidden">
          <View className="flex-row items-center p-3 border-b border-gray-100 dark:border-gray-700">
            <View className="bg-orange-100 dark:bg-orange-900/40 p-1.5 rounded-full mr-2">
              <AlertTriangle size={16} color="#F97316" />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">Additifs</Text>
          </View>

          {product.additives_tags && product.additives_tags.length > 0 ? (
            product.additives_tags.map((tag, index) => (
              <View key={`add-${index}`} className="flex-row items-center justify-between p-3 border-b border-gray-50 dark:border-gray-800 last:border-0">
                <View className="flex-row items-center flex-1">
                  {/* Simulation couleur risque : pair=vert, impair=orange */}
                  <View className={`w-3 h-3 rounded-full mr-3 ${index % 2 === 0 ? 'bg-green-500' : 'bg-orange-400'}`} />
                  <Text className="text-base text-gray-800 dark:text-gray-200 font-medium">{tag.replace('en:', '').toUpperCase()}</Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-sm text-gray-400 dark:text-gray-500 mr-2">
                    {index % 2 === 0 ? 'Fonction A' : 'Fonction B'}
                  </Text>
                  <ChevronRight size={16} color="#D1D5DB" />
                </View>
              </View>
            ))
          ) : (
            <View className="p-4">
              <Text className="text-gray-500 dark:text-gray-400 italic">Aucun additif à déclarer.</Text>
            </View>
          )}
        </View>


        {/* --- SECTION NUTRITION (Design Grille + Liste) --- */}
        <View className="mx-4 mt-6 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-[#1F2937] shadow-sm overflow-hidden">
          <View className="flex-row items-center justify-between p-3 border-b border-gray-100 dark:border-gray-700">
            <View className="flex-row items-center">
              <View className="bg-red-100 dark:bg-red-900/40 p-1.5 rounded-full mr-2">
                <Heart size={16} color="#EF4444" />
              </View>
              <View>
                <Text className="text-lg font-bold text-gray-900 dark:text-white leading-5">Informations</Text>
                <Text className="text-lg font-bold text-gray-900 dark:text-white leading-5">nutritionnelles</Text>
              </View>
            </View>
            <View className="bg-orange-50 dark:bg-orange-900/20 px-3 py-1 rounded-full border border-orange-100 dark:border-orange-800">
              <Text className="text-orange-600 dark:text-orange-400 font-bold text-sm">Score : {product.custom_score}</Text>
            </View>
          </View>

          <View className="p-3">
            <View className="flex-row flex-wrap justify-between">
              {/* Energie (Seuil 300kcal pour "modéré") */}
              <NutritionCard
                label="Energie"
                value={`${Math.round(getNutrimentValue('energy-kcal'))} Kcal`}
                subtext={getNutrimentValue('energy-kcal') > 300 ? "Forte teneur" : "Faible teneur"}
                color={getLevelColor(getNutrimentValue('energy-kcal'), 500, 300)}
                icon="up"
              />
              {/* Protéines (Seuil 10g pour "bon") */}
              <NutritionCard
                label="Protéines"
                value={`${getNutrimentValue('proteins')} g`}
                subtext={getNutrimentValue('proteins') > 10 ? "Excellente source" : "Faible teneur"}
                color={getPositiveLevelColor(getNutrimentValue('proteins'), 10, 5)}
                icon="down" // Flèche vers le bas si faible
              />

              {/* Sucre */}
              <NutritionCard
                label="Glucides"
                value={`${getNutrimentValue('sugars')} g`}
                subtext="Teneur"
                color={getLevelColor(getNutrimentValue('sugars'), 20, 5)}
                icon="check"
              />

              {/* Gras Saturés */}
              <NutritionCard
                label="Gras saturés"
                value={`${getNutrimentValue('saturated-fat')} g`}
                subtext="Gras saturés"
                color={getLevelColor(getNutrimentValue('saturated-fat'), 5, 1.5)}
                icon="up"
              />
            </View>

            {/* Liste détaillée en bas */}
            <View className="mt-2 border-t border-gray-100 dark:border-gray-700 pt-2">
              <SmallNutriItem
                label="Fibre"
                value={`${getNutrimentValue('fiber')} g`}
                color={getPositiveLevelColor(getNutrimentValue('fiber'), 3, 1)}
                icon="down"
              />
              <SmallNutriItem
                label="Sel"
                value={`${getNutrimentValue('salt')} g`}
                color={getLevelColor(getNutrimentValue('salt'), 1.5, 0.5)}
                icon="up"
              />
              <SmallNutriItem
                label="Calcium"
                value={`${(getNutrimentValue('calcium') * 1000).toFixed(1)} mg`}
                color="#6B7280"
              />
            </View>
          </View>
        </View>

      </Animated.ScrollView>

      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        barcode={product.barcode || product.id}
      />
    </View>
  );
}

// --- COMPOSANT CARTE NUTRITION (Carré gris) ---
const NutritionCard = ({ label, value, subtext, color, icon, simple }: any) => (
  <View className="w-[48%] bg-gray-50 dark:bg-gray-800 rounded-xl p-3 mb-3 border border-gray-100 dark:border-gray-700">
    <View className="flex-row justify-between items-start mb-1">
      <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium">{label}</Text>
      {!simple && (
        <View className="w-5 h-5 rounded-full items-center justify-center" style={{ backgroundColor: color }}>
          {icon === 'check' && <Check size={12} color="white" />}
          {/* Utilisation correcte du style pour la rotation */}
          {icon === 'up' && <ChevronUp size={14} color="white" />}
          {icon === 'down' && <ChevronDown size={14} color="white" />}
        </View>
      )}
    </View>
    <Text className="text-gray-900 dark:text-white font-bold text-lg">{value}</Text>
    {subtext ? (
      <Text className="text-xs mt-1 font-medium" style={{ color: color }}>{subtext}</Text>
    ) : null}
  </View>
);

// --- COMPOSANT LIGNE SIMPLE (Bas de tableau) ---
const SmallNutriItem = ({ label, value, color, icon }: any) => (
  <View className="flex-row justify-between items-center py-2">
    <Text className="text-gray-900 dark:text-white font-bold text-sm">{label}</Text>
    <View className="flex-row items-center">
      <Text className="text-gray-900 dark:text-white font-bold text-sm mr-2">{value}</Text>
      {icon && (
        <View className="w-4 h-4 rounded-full items-center justify-center" style={{ backgroundColor: color }}>
          {icon === 'check' && <Check size={10} color="white" />}
          {icon === 'up' && <ChevronUp size={10} color="white" />}
          {icon === 'down' && <ChevronDown size={10} color="white" />}
        </View>
      )}
    </View>
  </View>
);

// --- HELPER BADGE NUTRISCORE ---
const NutriScoreBadge = ({ grade }: { grade?: string }) => {
  if (!grade) return null;
  const grades = ['a', 'b', 'c', 'd', 'e'];
  return (
    <View className="flex-row items-center bg-gray-100 dark:bg-gray-800 rounded p-0.5">
      {grades.map((g) => (
        <View
          key={g}
          className={`w-5 h-5 items-center justify-center rounded-sm mx-[1px] ${grade.toLowerCase() === g
            ? g === 'a' ? 'bg-[#038141]' : g === 'b' ? 'bg-[#85BB2F]' : g === 'c' ? 'bg-[#FECB02]' : g === 'd' ? 'bg-[#EE8100]' : 'bg-[#E63E11]'
            : 'bg-transparent'
            }`}
        >
          <Text className={`font-bold uppercase text-xs ${grade.toLowerCase() === g ? 'text-white' : 'text-gray-300'}`}>{g}</Text>
        </View>
      ))}
    </View>
  );
};