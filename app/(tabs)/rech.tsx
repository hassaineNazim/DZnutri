import { useState } from "react";
import { ActivityIndicator, FlatList, Image, Text, TextInput, TouchableOpacity, View } from "react-native";
import "../../global.css";
import { useTranslation } from "../i18n";



type Product = {
  id: string;
  product_name?: string;
  brands?: string;
  image_small_url?: string;
  nutrition_grades?: string;
};

export default function Rech() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  const searchProducts = async () => {
    if (!query.trim()) return;
    setLoading(true);
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
        <View className="flex-1 bg-white dark:bg-[#181A20] px-4">
            <View className="w-full max-w-md bg-slate-100 dark:bg-neutral-800 rounded-xl shadow-md p-4 flex-row m-3  right-3">
                
                <TextInput
                    className="rounded-md  py-3 text-base w-full bg-white dark:bg-neutral-900 placeholder:px-12 placeholder:text-gray-400 dark:placeholder:text-gray-500 border border-gray-200 dark:border-neutral-700 focus:border-emerald-400 dark:focus:border-emerald-500 outline-none text-gray-800 dark:text-gray-200"
                    placeholder={t('search_products')}
                   
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={searchProducts}
                    returnKeyType="search"
                />
           






            </View>
            

              {loading ? (
        <ActivityIndicator size="large" color="#4B5563" />
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity className="flex-row items-center mb-3 bg-gray-100 dark:bg-neutral-800 rounded-xl p-3">
              {item.image_small_url ? (
                <Image
                  source={{ uri: item.image_small_url }}
                  className="w-16 h-16 rounded-md mr-4"
                />
              ) : (
                <View className="w-16 h-16 rounded-md bg-gray-300 mr-4" />
              )}
              <View className="flex-1">
                <Text className="text-lg font-semibold text-gray-800 dark:text-gray-200">{item.product_name || t('no_name')}</Text>
                <Text className="text-sm text-gray-500">{item.brands || t('no_brand')}</Text>
              </View>
                 <View className={item.nutrition_grades === "a" ? "bg-green-500 ml-auto rounded-md " : item.nutrition_grades === "b" ? "bg-yellow-500 ml-auto rounded-md" : "bg-red-500 ml-auto rounded-md"}  >
            <Text className="text-slate-100 py-1 px-2 font-bold" >{item.nutrition_grades !== null ? item.nutrition_grades.toUpperCase() : t('not_available')}</Text>
            </View>
            </TouchableOpacity> 
          )}
          ListEmptyComponent={
            <Text className="text-gray-500 text-center mt-4">{t('no_products_found')}</Text>
          }
        />
      )}
        </View>
    )
}
