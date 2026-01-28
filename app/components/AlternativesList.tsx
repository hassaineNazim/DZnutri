
import { useRouter } from 'expo-router';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native';
import { api } from '../services/axios';

type Product = {
    id: string;
    barcode: string;
    product_name?: string;
    brand?: string;
    image_url?: string;
    custom_score?: number;
    nutriscore_grade?: string;
    nova_group?: number;
};

type Props = {
    barcode: string;
    currentScore?: number;
};

const getScoreColor = (score?: number) => {
    if (score === undefined) return '#6B7280';
    if (score >= 75) return '#22C55E';
    if (score >= 50) return '#84CC16';
    if (score >= 25) return '#F97316';
    return '#EF4444';
};

export default function AlternativesList({ barcode, currentScore }: Props) {
    const [alternatives, setAlternatives] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchAlternatives = async () => {
            try {
                const response = await api.get(`/api/product/${barcode}/alternatives`);
                setAlternatives(response.data.alternatives || []);
            } catch (error) {
                console.error('Failed to fetch alternatives:', error);
            } finally {
                setLoading(false);
            }
        };

        if (barcode) {
            fetchAlternatives();
        }
    }, [barcode]);

    if (loading) {
        return (
            <View className="p-4 items-center">
                <ActivityIndicator size="small" color="#10B981" />
            </View>
        );
    }

    if (alternatives.length === 0) {
        return null;
    }

    const renderItem = ({ item }: { item: Product }) => {
        const scoreDiff = (item.custom_score || 0) - (currentScore || 0);

        return (
            <TouchableOpacity
                className="w-40 mr-4 bg-white dark:bg-[#1F2937] rounded-2xl p-3 shadow-sm border border-gray-100 dark:border-gray-700"
                onPress={() => {
                    router.push({
                        pathname: '/screens/productDetail',
                        params: { product: JSON.stringify(item) },
                    });
                }}
                activeOpacity={0.8}
            >
                <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                    className="w-full h-24 rounded-xl bg-gray-50 dark:bg-gray-800 mb-3"
                    resizeMode="contain"
                />

                <View className="mb-2">
                    <Text className="text-gray-900 dark:text-white font-bold text-sm leading-4" numberOfLines={2}>
                        {item.product_name || 'Nom inconnu'}
                    </Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs mt-0.5" numberOfLines={1}>
                        {item.brand}
                    </Text>
                </View>

                <View className="flex-row items-center justify-between mt-auto pt-2 border-t border-gray-50 dark:border-gray-800">
                    <View className="flex-row items-center">
                        <View
                            className="px-1.5 py-0.5 rounded-full mr-2"
                            style={{ backgroundColor: getScoreColor(item.custom_score) + '20' }}
                        >
                            <Text
                                className="font-bold text-xs"
                                style={{ color: getScoreColor(item.custom_score) }}
                            >
                                {item.custom_score}
                            </Text>
                        </View>
                        {scoreDiff > 0 && (
                            <Text className="text-[10px] text-green-500 font-medium">+{scoreDiff}</Text>
                        )}
                    </View>
                    <View className="bg-gray-100 dark:bg-gray-700 rounded-full p-1">
                        <ArrowRight size={12} className="text-gray-600 dark:text-gray-300" color="#4B5563" />
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View className="mt-8 mb-4">
            <View className="flex-row items-center px-5 mb-4 justify-between">
                <View className="flex-row items-center">
                    <View className="bg-emerald-100 dark:bg-emerald-900/40 p-1.5 rounded-full mr-2">
                        <Sparkles size={16} color="#10B981" />
                    </View>
                    <View>
                        <Text className="text-lg font-bold text-gray-900 dark:text-white leading-5">Meilleures</Text>
                        <Text className="text-lg font-bold text-gray-900 dark:text-white leading-5">Alternatives</Text>
                    </View>
                </View>
                <Text className="text-emerald-600 font-medium text-xs bg-emerald-50 px-2 py-1 rounded-full">
                    {alternatives.length} trouvés
                </Text>
            </View>

            <FlatList
                data={alternatives}
                renderItem={renderItem}
                keyExtractor={(item) => item.barcode}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20 }}
            />
        </View>
    );
}
