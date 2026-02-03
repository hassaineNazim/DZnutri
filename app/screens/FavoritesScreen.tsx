import { useQuery } from '@tanstack/react-query';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { ArrowLeft, Heart, ScanBarcode } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../i18n';
import { api } from '../services/axios';

type Product = {
    id: string;
    barcode: string;
    product_name?: string;
    brand?: string;
    image_url?: string;
    custom_score?: number;
};

const getScoreColor = (score?: number) => {
    if (score === undefined) return '#6B7280';
    if (score >= 75) return '#22C55E';
    if (score >= 50) return '#84CC16';
    if (score >= 25) return '#F97316';
    return '#EF4444';
};

export default function FavoritesScreen() {
    const router = useRouter();
    const { t } = useTranslation();
    const { data: favorites = [], isLoading: loading, refetch } = useQuery({
        queryKey: ['favorites_list'],
        queryFn: async () => {
            const response = await api.get('/api/favorites');
            return response.data || [];
        },
    });

    useFocusEffect(
        useCallback(() => {
            refetch();
        }, [])
    );

    return (
        <View className="flex-1 bg-gray-50 dark:bg-[#181A20]">
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View className="px-6 pt-12 pb-4 flex-row items-center bg-white dark:bg-[#1F2937] border-b border-gray-100 dark:border-gray-800 shadow-sm rounded-b-3xl mb-4">
                <TouchableOpacity onPress={() => router.back()} className="mr-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700">
                    <ArrowLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-2xl font-bold text-gray-900 dark:text-white">
                    {t('favorites') || "Favoris"}
                </Text>
            </View>

            {loading ? (
                <View className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#10B981" />
                </View>
            ) : (
                <FlatList
                    data={favorites}
                    keyExtractor={(item) => item.barcode}
                    contentContainerStyle={{ padding: 16 }}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            className="flex-row items-center mb-3 bg-white dark:bg-[#1F2937] rounded-2xl p-3 shadow-sm border border-gray-50 dark:border-gray-800"
                            onPress={() => router.push({
                                pathname: '/screens/productDetail',
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
                                    <ScanBarcode size={24} color="#9CA3AF" />
                                </View>
                            )}

                            <View className="flex-1 mr-2">
                                <Text numberOfLines={1} className="text-base font-bold text-gray-900 dark:text-white">
                                    {item.product_name || t('no_name')}
                                </Text>
                                <Text numberOfLines={1} className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                    {item.brand || t('brand_unknown')}
                                </Text>
                            </View>

                            <View className="items-end">
                                <View
                                    className="w-10 h-10 rounded-xl items-center justify-center mb-1"
                                    style={{ backgroundColor: getScoreColor(item.custom_score) + '20' }}
                                >
                                    <Text
                                        className="font-bold text-sm"
                                        style={{ color: getScoreColor(item.custom_score) }}
                                    >
                                        {item.custom_score || '-'}
                                    </Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    )}
                    ListEmptyComponent={
                        <View className="mt-20 items-center opacity-50">
                            <Heart size={64} color="#9CA3AF" />
                            <Text className="text-gray-500 dark:text-gray-400 text-center mt-4">
                                {t('no_favorites') || "Aucun favori pour le moment"}
                            </Text>
                        </View>
                    }
                />
            )}
        </View>
    );
}
