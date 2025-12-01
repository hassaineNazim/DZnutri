import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, Heart, MoreVertical, Star, ThumbsUp, PenTool as Tool } from 'lucide-react-native';
import React, { useState } from 'react';
import { Dimensions, Image, ScrollView, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ReportModal from '../components/ReportModal';
import ScoreGauge from '../components/ScoreGauge';
import { useTranslation } from '../i18n';

const { width } = Dimensions.get('window');

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

// Helper to get nutrient status (color, icon)
const getNutrientStatus = (level: string) => {
  switch (level) {
    case 'low':
      return { color: '#22C55E', icon: 'check', text: 'Faible teneur' }; // Green
    case 'moderate':
      return { color: '#F97316', icon: 'minus', text: 'Teneur modérée' }; // Orange
    case 'high':
      return { color: '#EF4444', icon: 'up', text: 'Forte teneur' }; // Red
    default:
      return { color: '#6B7280', icon: 'help', text: 'Inconnu' }; // Gray
  }
};

// Helper for Nutri-Score badge
const NutriScoreBadge = ({ grade }: { grade?: string }) => {
  if (!grade) return null;
  const grades = ['a', 'b', 'c', 'd', 'e'];
  return (
    <View className="flex-row items-center bg-gray-100 rounded-md p-1">
      {grades.map((g) => (
        <View
          key={g}
          className={`w-6 h-6 items-center justify-center rounded-sm mx-[1px] ${grade.toLowerCase() === g
              ? g === 'a' ? 'bg-[#038141]'
                : g === 'b' ? 'bg-[#85BB2F]'
                  : g === 'c' ? 'bg-[#FECB02]'
                    : g === 'd' ? 'bg-[#EE8100]'
                      : 'bg-[#E63E11]'
              : 'bg-transparent'
            }`}
        >
          <Text className={`font-bold uppercase ${grade.toLowerCase() === g ? 'text-white' : 'text-gray-400'}`}>
            {g}
          </Text>
        </View>
      ))}
    </View>
  );
};

const NovaBadge = ({ group }: { group?: number }) => {
  if (!group) return null;
  const color = group === 1 ? '#22C55E' : group === 2 ? '#85BB2F' : group === 3 ? '#FECB02' : '#EF4444';
  return (
    <View className="flex-row items-center ml-4">
      <Text className="text-gray-500 mr-1">Nova</Text>
      <View className="w-6 h-8 rounded-md items-center justify-center" style={{ backgroundColor: color }}>
        <Text className="text-white font-bold">{group}</Text>
      </View>
    </View>
  );
};


export default function ProductDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { product: productJson } = useLocalSearchParams();
  const product: Product | null = productJson ? JSON.parse(productJson as string) : null;
  const insets = useSafeAreaInsets();
  const [reportModalVisible, setReportModalVisible] = useState(false);

  if (!product) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <Text className="text-red-500 text-lg">{t('product_unknown')}</Text>
        <TouchableOpacity onPress={() => router.back()} className="mt-4 p-3 bg-gray-100 rounded-lg">
          <Text className="text-gray-900">{t('cancel')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const getNutrimentValue = (key: string) => product?.nutriments?.[key + '_100g'] ?? 0;
  const getNutrimentUnit = (key: string) => product?.nutriments?.[key + '_unit'] ?? '';

  // Determine nutrient levels (simplified logic - ideally use API provided levels)
  // This is a placeholder logic. In a real app, you'd check product.nutrient_levels
  const getLevel = (key: string, value: number) => {
    // Basic thresholds (example)
    if (key === 'fat') return value > 20 ? 'high' : value > 3 ? 'moderate' : 'low';
    if (key === 'saturated-fat') return value > 5 ? 'high' : value > 1.5 ? 'moderate' : 'low';
    if (key === 'sugars') return value > 12.5 ? 'high' : value > 5 ? 'moderate' : 'low';
    if (key === 'salt') return value > 1.5 ? 'high' : value > 0.3 ? 'moderate' : 'low';
    return 'moderate';
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        className="flex-row justify-between items-center px-4 pb-2 bg-white z-10"
        style={{ paddingTop: insets.top }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={28} color="black" />
        </TouchableOpacity>
        <View className="flex-row gap-4">
          <TouchableOpacity>
            <Star size={28} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setReportModalVisible(true)}>
            <MoreVertical size={28} color="black" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* Top Section: Image & Basic Info */}
        <View className="flex-row px-4 py-4">
          {/* Image */}
          <View className="w-1/3 mr-4">
            <Image
              source={{ uri: product.image_url || 'https://via.placeholder.com/150' }}
              className="w-full h-40"
              resizeMode="contain"
            />
          </View>

          {/* Info */}
          <View className="flex-1 justify-between">
            <View>
              <Text className="text-2xl font-bold text-gray-900" numberOfLines={2}>
                {product.product_name || t('no_name')}
              </Text>
              <Text className="text-gray-500 text-base">
                {product.brand || t('brand_unknown')}
              </Text>
            </View>

            <View className="flex-row items-center mt-2">
              <View>
                <Text className="text-gray-400 text-xs mb-1">Nutri-score</Text>
                <NutriScoreBadge grade={product.nutriscore_grade} />
              </View>
              <NovaBadge group={product.nova_group} />
            </View>
          </View>

          {/* Score Gauge */}
          <View className="justify-center ml-2">
            <ScoreGauge score={product.custom_score} size={80} strokeWidth={8} />
          </View>
        </View>

        {/* Additives Section */}
        <View className="mx-4 mt-4 border border-gray-200 rounded-xl p-4 shadow-sm bg-white">
          <View className="flex-row items-center mb-3">
            <View className="bg-orange-100 p-1.5 rounded-full mr-2">
              <Tool size={16} color="#F97316" />
            </View>
            <Text className="text-lg font-bold text-gray-900">Additifs</Text>
          </View>

          {product.additives_tags && product.additives_tags.length > 0 ? (
            product.additives_tags.map((tag, index) => (
              <View key={index} className="flex-row justify-between items-center py-2 border-b border-gray-100 last:border-0">
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full bg-yellow-400 mr-2" />
                  <Text className="text-gray-700 font-medium">{tag.replace('en:', '').toUpperCase()}</Text>
                </View>
                {/* Placeholder for additive risk/function if available */}
                <View className="flex-row items-center">
                  <Text className="text-gray-500 text-sm mr-1">Détails</Text>
                  <ChevronRight size={16} color="#9CA3AF" />
                </View>
              </View>
            ))
          ) : (
            <Text className="text-gray-500 italic">Aucun additif détecté.</Text>
          )}
        </View>

        {/* Nutrition Facts Section */}
        <View className="mx-4 mt-6 border border-gray-200 rounded-xl p-4 shadow-sm bg-white">
          <View className="flex-row items-center mb-4">
            <View className="bg-red-100 p-1.5 rounded-full mr-2">
              <Heart size={16} color="#EF4444" />
            </View>
            <View>
              <Text className="text-lg font-bold text-gray-900">Informations</Text>
              <Text className="text-lg font-bold text-gray-900">nutritionnelles</Text>
            </View>
            <View className="ml-auto bg-orange-100 px-3 py-1 rounded-full">
              <Text className="text-orange-600 font-bold">Score : {product.custom_score}</Text>
            </View>
          </View>

          <View className="flex-row flex-wrap justify-between">
            {/* Energy */}
            <NutritionCard
              label="Energie"
              value={`${Math.round(getNutrimentValue('energy-kcal'))} Kcal`}
              status="high" // Example
              subtext="Forte teneur en calories"
            />
            {/* Proteins */}
            <NutritionCard
              label="Protéines"
              value={`${getNutrimentValue('proteins')} g`}
              status="high" // Example (using red for low protein might be counter intuitive depending on context, sticking to design)
              subtext="Faible teneur en protéines"
            />
            {/* Glucides - No status in screenshot */}
            <NutritionCard
              label="Glucides"
              value={`${getNutrimentValue('carbohydrates')} g`}
              simple
            />
            {/* Sugar */}
            <NutritionCard
              label="Sucre"
              value={`${getNutrimentValue('sugars')} g`}
              status="low"
              subtext="Teneur en sucre saines"
            />
            {/* Fat */}
            <NutritionCard
              label="Fat"
              value={`${getNutrimentValue('fat')} g`}
              status="high"
              subtext="Forte teneur en gras"
            />
            {/* Saturated Fat */}
            <NutritionCard
              label="Gras saturés"
              value={`${getNutrimentValue('saturated-fat')} g`}
              status="high"
              subtext="Forte teneur en gras saturés"
            />
          </View>

          {/* Bottom List Items */}
          <View className="mt-4 pt-2">
            <ListItem label="Fibre" value={`${getNutrimentValue('fiber')} g`} status="high" />
            <ListItem label="Sel" value={`${getNutrimentValue('salt')} g`} status="high" />
            <ListItem label="Calcium" value={`${(getNutrimentValue('calcium') * 1000).toFixed(1)} mg`} />
            <ListItem label="Additifs" value={`${product.additives_tags?.length || 0} trouvés`} />
          </View>

        </View>

      </ScrollView>

      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        barcode={product.barcode}
      />
    </View>
  );
}

const NutritionCard = ({ label, value, status, subtext, simple }: { label: string, value: string, status?: 'high' | 'moderate' | 'low', subtext?: string, simple?: boolean }) => {
  const { color, icon } = status ? getNutrientStatus(status) : { color: '#374151', icon: '' };

  return (
    <View className="w-[48%] bg-gray-100 rounded-xl p-3 mb-3">
      <View className="flex-row justify-between items-start">
        <Text className="text-gray-500 text-base mb-1">{label}</Text>
        {!simple && status && (
          <View className={`w-5 h-5 rounded-full items-center justify-center`} style={{ backgroundColor: status === 'low' ? '#22C55E' : '#EF4444' }}>
            {status === 'low' ? <ThumbsUp size={12} color="white" /> : <ChevronDown size={14} color="white" className={status === 'high' ? 'rotate-180' : ''} />}
            {/* Note: Icon logic simplified for demo */}
          </View>
        )}
        {status === 'low' && !simple && <View className="w-4 h-4 bg-green-500 rounded-full items-center justify-center"><Text className="text-white text-[10px]">✓</Text></View>}
        {status === 'high' && !simple && <View className="w-4 h-4 bg-red-500 rounded-full items-center justify-center"><View className="border-b-4 border-l-4 border-r-4 border-transparent border-b-white transform rotate-180 translate-y-0.5" /></View>}
        {/* Using simple shapes or icons */}
      </View>
      <Text className="text-gray-900 font-bold text-lg">{value}</Text>
      {subtext && (
        <Text className="text-xs mt-1" style={{ color: status === 'low' ? '#22C55E' : '#EF4444' }}>
          {subtext}
        </Text>
      )}
    </View>
  );
};

const ListItem = ({ label, value, status }: { label: string, value: string, status?: 'high' | 'low' }) => (
  <View className="flex-row justify-between items-center py-2">
    <Text className="text-gray-900 font-bold text-base">{label}</Text>
    <View className="flex-row items-center">
      <Text className="text-gray-900 font-bold text-base mr-2">{value}</Text>
      {status === 'high' && <View className="w-5 h-5 bg-red-500 rounded-full items-center justify-center"><ChevronDown size={14} color="white" className="rotate-180" /></View>}
      {status === 'low' && <View className="w-5 h-5 bg-green-500 rounded-full items-center justify-center"><ChevronDown size={14} color="white" /></View>}
    </View>
  </View>
);