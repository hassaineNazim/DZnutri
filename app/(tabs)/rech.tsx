import { ScanBarcode, Search, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useRef, useState } from "react";
import { ActivityIndicator, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import "../../global.css";
import { useTranslation } from "../i18n";

type Product = {
  id: string;
  product_name?: string;
  brands?: string;
  image_small_url?: string;
  nutrition_grades?: string;
};

const getNutriScoreColor = (grade?: string) => {
  switch (grade?.toLowerCase()) {
    case 'a': return 'bg-[#038141]';
    case 'b': return 'bg-[#85BB2F]';
    case 'c': return 'bg-[#FECB02]';
    case 'd': return 'bg-[#EE8100]';
    case 'e': return 'bg-[#E63E11]';
    default: return 'bg-gray-400';
  }
};

export default function Rech() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const inputRef = useRef<TextInput | null>(null);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const searchProducts = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    try {
      const response = await fetch(`https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1`);
      const data = await response.json();
      setResults(data.products || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#181A20]">
      {/* Header Area */}
      <View className="px-6 pt-6 pb-2">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('search') || "Recherche"}
        </Text>
        <Text className="text-base text-gray-500 dark:text-gray-400 mt-1">
          {t('search_subtitle')}
        </Text>
      </View>

      {/* Search Bar */}
      <Animated.View
        entering={FadeInDown.duration(500)}
        className="mx-4 mt-4 mb-2"
      >
        <View className="flex-row items-center bg-white dark:bg-[#1F2937] rounded-2xl px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-800">
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
                setHasSearched(false);
                setResults([]);
                inputRef.current?.focus();
              }}
              className="p-1 bg-gray-100 dark:bg-gray-700 rounded-full"
            >
              <X size={16} color={isDark ? "#D1D5DB" : "#4B5563"} />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Results */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#84CC16" />
        </View>
      ) : (
        <Animated.FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          itemLayoutAnimation={Layout.springify()}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={FadeInDown.delay(index * 50).springify()}
              className="flex-row items-center mb-3 bg-white dark:bg-[#1F2937] rounded-2xl p-3 shadow-sm"
            >
              {item.image_small_url ? (
                <Image
                  source={{ uri: item.image_small_url }}
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
                  {item.brands || t('brand_unknown')}
                </Text>
              </View>

              {item.nutrition_grades && (
                <View className={`w-10 h-10 rounded-lg items-center justify-center ${getNutriScoreColor(item.nutrition_grades)}`}>
                  <Text className="text-white font-bold text-lg uppercase">
                    {item.nutrition_grades}
                  </Text>
                </View>
              )}
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
    </View>
  );
}
