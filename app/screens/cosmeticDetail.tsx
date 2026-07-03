import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, CheckCircle2, FlaskConical } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScoreGauge from '../components/ScoreGauge';
import { CosmeticProduct, fetchCosmetic } from '../services/cosmetics';

const scoreColor = (s?: number | null) => {
  if (s === undefined || s === null) return '#6B7280';
  if (s >= 75) return '#22C55E';
  if (s >= 50) return '#84CC16';
  if (s >= 25) return '#F97316';
  return '#EF4444';
};

const scoreLabel = (s?: number | null) => {
  if (s === undefined || s === null) return 'Analyse indisponible';
  if (s >= 75) return 'Excellent';
  if (s >= 50) return 'Bon';
  if (s >= 25) return 'Médiocre';
  return 'Mauvais';
};

// 1 = faible, 2 = modéré, 3 = élevé
const dangerStyle = (level: number) => {
  if (level >= 3) return { color: '#EF4444', bg: '#FEE2E2', label: 'Risque élevé' };
  if (level === 2) return { color: '#F97316', bg: '#FFEDD5', label: 'Risque modéré' };
  return { color: '#F59E0B', bg: '#FEF3C7', label: 'Risque faible' };
};

export default function CosmeticDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { product: productJson } = useLocalSearchParams();
  const initial: CosmeticProduct | null = productJson ? JSON.parse(productJson as string) : null;
  const [product, setProduct] = useState<CosmeticProduct | null>(initial);
  const [loading, setLoading] = useState(false);

  // Si on arrive depuis une liste (données allégées), on complète par un fetch.
  useEffect(() => {
    if (product && !product.risky_ingredients && product.barcode) {
      setLoading(true);
      fetchCosmetic(product.barcode)
        .then((full) => full && setProduct(full))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [product?.barcode]);

  if (!product) return null;

  const risky = product.risky_ingredients ?? [];
  const score = product.cosmetic_score;

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      {/* Header */}
      <View style={{ paddingTop: insets.top + 8 }} className="bg-white px-4 pb-3 flex-row items-center">
        <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
          <ArrowLeft size={22} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-gray-900 mr-10" numberOfLines={1}>
          {product.product_name || 'Cosmétique'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Bloc produit + score */}
        <View className="bg-white mx-4 mt-4 rounded-3xl p-5 shadow-sm">
          <View className="flex-row items-center">
            <Image
              source={{ uri: product.image_url || 'https://via.placeholder.com/100' }}
              className="w-24 h-24 rounded-2xl bg-gray-100"
              resizeMode="contain"
            />
            <View className="flex-1 ml-4">
              <Text className="text-xl font-bold text-gray-900" numberOfLines={2}>
                {product.product_name || 'Sans nom'}
              </Text>
              <Text className="text-sm text-gray-500 mt-1" numberOfLines={1}>
                {product.brand || 'Marque inconnue'}
              </Text>
              {product.category ? (
                <Text className="text-xs text-gray-400 mt-1" numberOfLines={1}>{product.category}</Text>
              ) : null}
            </View>
          </View>

          <View className="flex-row items-center justify-center mt-5 pt-5 border-t border-gray-100">
            <ScoreGauge score={score ?? 0} size={72} strokeWidth={7} showText={score !== null && score !== undefined} />
            <View className="ml-5">
              <Text className="text-xs text-gray-400 uppercase tracking-widest font-bold">Score cosmétique</Text>
              <Text className="text-2xl font-extrabold mt-0.5" style={{ color: scoreColor(score) }}>
                {scoreLabel(score)}
              </Text>
            </View>
          </View>
        </View>

        {/* Ingrédients à risque */}
        <View className="mx-4 mt-5">
          <View className="flex-row items-center mb-3">
            <AlertTriangle size={18} color="#EF4444" />
            <Text className="ml-2 text-base font-bold text-gray-900">
              Ingrédients à risque {risky.length > 0 ? `(${risky.length})` : ''}
            </Text>
          </View>

          {risky.length === 0 ? (
            <View className="bg-white rounded-2xl p-4 flex-row items-center">
              <CheckCircle2 size={22} color="#22C55E" />
              <Text className="ml-3 text-gray-600 flex-1">
                {score === null ? "Composition non analysée." : 'Aucun ingrédient préoccupant détecté.'}
              </Text>
            </View>
          ) : (
            risky.map((ing, idx) => {
              const st = dangerStyle(ing.danger_level);
              return (
                <View key={idx} className="bg-white rounded-2xl p-4 mb-2 flex-row items-center">
                  <View style={{ backgroundColor: st.bg }} className="w-11 h-11 rounded-full items-center justify-center">
                    <FlaskConical size={20} color={st.color} />
                  </View>
                  <View className="flex-1 ml-3">
                    <Text className="text-gray-900 font-semibold capitalize" numberOfLines={1}>{ing.name}</Text>
                    {ing.concern ? <Text className="text-xs text-gray-500 mt-0.5">{ing.concern}</Text> : null}
                  </View>
                  <View style={{ backgroundColor: st.bg }} className="px-2.5 py-1 rounded-full">
                    <Text style={{ color: st.color }} className="text-xs font-bold">{st.label}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Composition INCI */}
        {product.ingredients_text ? (
          <View className="mx-4 mt-5">
            <Text className="text-base font-bold text-gray-900 mb-2">Composition (INCI)</Text>
            <View className="bg-white rounded-2xl p-4">
              <Text className="text-sm text-gray-600 leading-5">{product.ingredients_text}</Text>
            </View>
          </View>
        ) : null}

        {loading ? (
          <View className="items-center mt-6">
            <ActivityIndicator color="#EC4899" />
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}
