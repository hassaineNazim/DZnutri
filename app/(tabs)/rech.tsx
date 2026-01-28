
import { useRouter } from 'expo-router';
import { ScanBarcode, Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import "../../global.css";
import FilterModal from '../components/FilterModal';
import { useTranslation } from "../i18n";
import { api } from '../services/axios';

type Product = {
  id: string;
  barcode: string;
  product_name?: string;
  brands?: string;
  brand?: string; // Backend uses 'brand'
  image_url?: string;
  grade?: string; // Backend might send nutriscore_grade
  nutriscore_grade?: string;
  custom_score?: number;
};

const getScoreColor = (score?: number) => {
  if (score === undefined || score === null) return '#6B7280';
  if (score >= 75) return '#22C55E';
  if (score >= 50) return '#84CC16';
  if (score >= 25) return '#F97316';
  return '#EF4444';
};

export default function Rech() {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<{
    category?: string;
    subcategory?: string;
    minScore?: number;
    verifiedOnly: boolean;
  }>({
    verifiedOnly: false
  });

  const inputRef = useRef<TextInput | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const searchProducts = async () => {
    // Permettre la recherche vide si des filtres sont appliqués
    if (!query.trim() && Object.keys(filters).length === 1 && !filters.verifiedOnly) return;

    setLoading(true);
    setHasSearched(true);
    try {
      // Construction des paramètres
      const params = new URLSearchParams();
      if (query.trim()) params.append('q', query);
      if (filters.category) params.append('category', filters.category);
      if (filters.subcategory) params.append('subcategory', filters.subcategory);
      if (filters.minScore) params.append('min_score', filters.minScore.toString());
      if (filters.verifiedOnly) params.append('verified_only', 'true');

      const response = await api.get(`/api/search?${params.toString()}`);
      setResults(response.data || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Petite astuce : si on change les filtres, on relance la recherche
  useEffect(() => {
    if (hasSearched) {
      searchProducts();
    }
  }, [filters]);

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#181A20]">
      {/* Header Area */}
      <View className="px-6 pt-6 pb-2">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('search') || "Recherche"}
        </Text>
        <Text className="text-base text-gray-500 dark:text-gray-400 mt-1">
          {t('search_subtitle') || "Trouvez des produits sains"}
        </Text>
      </View>

      {/* Search Bar + Filter Button */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        className="mx-4 mt-4 mb-2 flex-row gap-3"
      >
        <View className="flex-1 flex-row items-center bg-white dark:bg-[#1F2937] rounded-2xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-800">
          <TouchableOpacity onPress={searchProducts}>
            <Search size={20} color={isDark ? "#9CA3AF" : "#9CA3AF"} />
          </TouchableOpacity>

          <TextInput
            ref={inputRef}
            className="ml-3 text-base flex-1 text-gray-900 dark:text-white"
            placeholder={t('search_products')}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchProducts}
            returnKeyType="search"
          />

          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                if (!filters.category) { // Si pas de filtre, on reset tout
                  setHasSearched(false);
                  setResults([]);
                }
                inputRef.current?.focus();
              }}
              className="p-1 bg-gray-100 dark:bg-gray-700 rounded-full"
            >
              <X size={16} color={isDark ? "#D1D5DB" : "#4B5563"} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          onPress={() => setFilterModalVisible(true)}
          className={`w-12 h-13 rounded-2xl items-center justify-center shadow-sm border ${Object.keys(filters).length > 1 || filters.verifiedOnly
            ? 'bg-emerald-500 border-emerald-500'
            : 'bg-white dark:bg-[#1F2937] border-gray-100 dark:border-gray-800'
            }`}
        >
          <SlidersHorizontal
            size={20}
            color={Object.keys(filters).length > 1 || filters.verifiedOnly ? "white" : (isDark ? "#9CA3AF" : "#4B5563")}
          />
        </TouchableOpacity>
      </Animated.View>

      {/* Filters Summary (Chips) */}
      {(filters.category || filters.subcategory || filters.minScore || filters.verifiedOnly) && (
        <View className="mx-6 flex-row gap-2 mb-2 flex-wrap">
          {filters.category && (
            <View className="bg-emerald-100 dark:bg-emerald-900/30 px-3 py-1 rounded-full flex-row items-center">
              <Text className="text-emerald-700 dark:text-emerald-400 text-xs font-medium mr-1">{filters.category}</Text>
              <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, category: undefined, subcategory: undefined }))}>
                <X size={12} color="#047857" />
              </TouchableOpacity>
            </View>
          )}
          {filters.subcategory && (
            <View className="bg-teal-100 dark:bg-teal-900/30 px-3 py-1 rounded-full flex-row items-center">
              <Text className="text-teal-700 dark:text-teal-400 text-xs font-medium mr-1">{filters.subcategory}</Text>
              <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, subcategory: undefined }))}>
                <X size={12} color="#0d9488" />
              </TouchableOpacity>
            </View>
          )}
          {filters.minScore !== undefined && (
            <View className="bg-orange-100 dark:bg-orange-900/30 px-3 py-1 rounded-full">
              <Text className="text-orange-700 dark:text-orange-400 text-xs font-medium">Score {'>'} {filters.minScore}</Text>
              <TouchableOpacity onPress={() => setFilters(prev => ({ ...prev, minScore: undefined }))} className="ml-1">
                <X size={12} color="#c2410c" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {/* Results */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <Animated.FlatList
          data={results}
          keyExtractor={(item) => item.barcode || item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          itemLayoutAnimation={Layout.springify()}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 50).springify()}
            >
              <TouchableOpacity
                className="flex-row items-center mb-3 bg-white dark:bg-[#1F2937] rounded-2xl p-3 shadow-sm border border-gray-50 dark:border-gray-800"
                onPress={() => router.push({
                  pathname: '../screens/productDetail', // Path correction depending on structure
                  params: { product: JSON.stringify(item) }
                })}
              >
                {item.image_url ? (
                  <Image
                    source={{ uri: item.image_url }}
                    className="w-16 h-16 rounded-xl mr-4 bg-gray-100 dark:bg-gray-800"
                    resizeMode="contain"
                  />
                ) : (
                  <View className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 mr-4 items-center justify-center">
                    <ScanBarcode size={24} color={isDark ? "#9CA3AF" : "#9CA3AF"} />
                  </View>
                )}

                <View className="flex-1 mr-2">
                  <Text numberOfLines={1} className="text-base font-bold text-gray-900 dark:text-white">
                    {item.product_name || t('no_name')}
                  </Text>
                  <Text numberOfLines={1} className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {item.brand || item.brands || t('brand_unknown')}
                  </Text>
                </View>

                {item.custom_score !== undefined && (
                  <View className="items-end">
                    <View
                      className="w-10 h-10 rounded-xl items-center justify-center mb-1"
                      style={{ backgroundColor: getScoreColor(item.custom_score) + '20' }}
                    >
                      <Text
                        className="font-bold text-sm"
                        style={{ color: getScoreColor(item.custom_score) }}
                      >
                        {item.custom_score}
                      </Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
          ListEmptyComponent={
            hasSearched ? (
              <View className="mt-10 items-center">
                <Text className="text-gray-500 dark:text-gray-400 text-center">
                  {t('no_products_found')}
                </Text>
              </View>
            ) : (
              <View className="mt-20 items-center opacity-50">
                <Search size={64} color="#9CA3AF" />
                <Text className="text-gray-500 dark:text-gray-400 text-center mt-4 max-w-[200px]">
                  {t('search_placeholder_text')}
                </Text>
              </View>
            )
          }
        />
      )}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        initialFilters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setFilterModalVisible(false);
        }}
      />
    </View>
  );
}
