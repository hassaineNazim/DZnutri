import { useQuery } from '@tanstack/react-query';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Heart } from 'lucide-react-native';
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { BackButton } from '../components/ui/FormKit';
import ProductCard from '../components/ui/ProductCard';
import Txt from '../components/ui/Txt';
import { useTranslation } from '../i18n';
import { api } from '../services/axios';
import { colors, radius } from '../theme/tokens';

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
        }, [refetch]),
    );

    return (
        <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* ---- Entête bordeaux ---- */}
            <View style={{ paddingHorizontal: 26, paddingTop: 18, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <BackButton onPress={() => router.back()} />
                <Txt variant="display" size={30} color={colors.creamTitle} style={{ letterSpacing: -0.5 }}>
                    {t('favorites') || 'Favoris'}
                </Txt>
            </View>

            {/* ---- Feuille crème ---- */}
            <View style={{ flex: 1, backgroundColor: colors.cream, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
                {loading ? (
                    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                        <ActivityIndicator size="large" color={colors.green} />
                    </View>
                ) : (
                    <FlatList
                        data={favorites}
                        keyExtractor={(item: any) => item.barcode}
                        contentContainerStyle={{ padding: 22, paddingBottom: 120 }}
                        showsVerticalScrollIndicator={false}
                        renderItem={({ item, index }: { item: any; index: number }) => (
                            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).springify()} style={{ marginBottom: 12 }}>
                                <ProductCard
                                    item={item}
                                    onPress={() =>
                                        router.push({
                                            pathname: '/screens/productDetail',
                                            params: { product: JSON.stringify(item) },
                                        })
                                    }
                                />
                            </Animated.View>
                        )}
                        ListEmptyComponent={
                            <View style={{ marginTop: 70, alignItems: 'center', opacity: 0.5 }}>
                                <Heart size={60} color={colors.inkSoft} />
                                <Txt variant="medium" size={15} color={colors.inkSoft} style={{ textAlign: 'center', marginTop: 16 }}>
                                    {t('no_favorites') || 'Aucun favori pour le moment'}
                                </Txt>
                            </View>
                        }
                    />
                )}
            </View>
        </View>
    );
}
