import { useRouter } from 'expo-router';
import { ArrowRight, Sparkles } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, TouchableOpacity, View } from 'react-native';
import { useTranslation } from '../i18n';
import { api } from '../services/axios';
import { colors, radius, shadows } from '../theme/tokens';
import Txt from './ui/Txt';

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
    onSelectProduct?: (product: Product) => void;
};

const getScoreColor = (score?: number) => {
    if (score === undefined) return '#6B7280';
    if (score >= 75) return '#22C55E';
    if (score >= 50) return '#84CC16';
    if (score >= 25) return '#F97316';
    return '#EF4444';
};

export default function AlternativesList({ barcode, currentScore, onSelectProduct }: Props) {
    const [alternatives, setAlternatives] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { t } = useTranslation();

    useEffect(() => {
        let isMounted = true;
        const fetchAlternatives = async () => {
            try {
                setLoading(true);
                const response = await api.get(`/api/product/${barcode}/alternatives`);
                if (isMounted) {
                    setAlternatives(response.data.alternatives || []);
                }
            } catch (error) {
                if (__DEV__) console.error('Failed to fetch alternatives:', error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (barcode) {
            fetchAlternatives();
        }

        return () => {
            isMounted = false;
        };
    }, [barcode]);

    if (loading) {
        return (
            <View style={{ paddingVertical: 20, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.green} />
            </View>
        );
    }

    if (alternatives.length === 0) {
        return null;
    }

    const handlePressItem = (item: Product) => {
        if (onSelectProduct) {
            onSelectProduct(item);
        } else {
            router.push({
                pathname: '/screens/productDetail',
                params: { product: JSON.stringify(item) },
            });
        }
    };

    const renderItem = (item: Product) => {
        const scoreDiff = (item.custom_score || 0) - (currentScore || 0);

        return (
            <TouchableOpacity
                key={item.barcode || item.id}
                accessibilityRole="button"
                accessibilityLabel={`${item.product_name || 'Nom inconnu'}, ${item.brand || ''}, score ${item.custom_score ?? 'inconnu'}`}
                onPress={() => handlePressItem(item)}
                activeOpacity={0.75}
                style={[
                    {
                        width: '100%',
                        minHeight: 96,
                        padding: 12,
                        borderRadius: radius.cardSm,
                        backgroundColor: colors.card,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 13,
                        borderWidth: 1,
                        borderColor: colors.separator,
                    },
                    shadows.listCard,
                ]}
            >
                <Image
                    source={{ uri: item.image_url || 'https://via.placeholder.com/150' }}
                    accessible={false}
                    style={{ width: 72, height: 72, borderRadius: 14, backgroundColor: colors.sheet }}
                    resizeMode="contain"
                />

                <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt variant="semibold" size={14.5} color={colors.ink} numberOfLines={2} style={{ lineHeight: 19 }}>
                        {item.product_name || 'Nom inconnu'}
                    </Txt>
                    <Txt variant="body" size={12} color={colors.inkSoft} numberOfLines={1} style={{ marginTop: 3 }}>
                        {item.brand}
                    </Txt>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 9 }}>
                        <View
                            style={{
                                minWidth: 34,
                                paddingHorizontal: 9,
                                paddingVertical: 4,
                                borderRadius: radius.pill,
                                alignItems: 'center',
                                backgroundColor: getScoreColor(item.custom_score) + '20',
                            }}
                        >
                            <Txt variant="bold" size={12} color={getScoreColor(item.custom_score)}>
                                {item.custom_score ?? '—'}
                            </Txt>
                        </View>
                        {scoreDiff > 0 && (
                            <Txt variant="bold" size={11} color={colors.green} style={{ marginLeft: 7 }}>+{scoreDiff}</Txt>
                        )}
                    </View>
                </View>

                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowRight size={15} color={colors.inkSoft} />
                </View>
            </TouchableOpacity>
        );
    };

    return (
        <View style={{ marginTop: 30, marginBottom: 8 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 14 }}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: 'rgba(79,158,90,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={18} color={colors.green} />
                </View>
                <View style={{ flex: 1, minWidth: 0, marginLeft: 11 }}>
                    <Txt variant="displayXBold" size={20} color={colors.ink} numberOfLines={2}>
                        {t('best_alternatives')}
                    </Txt>
                    <Txt variant="medium" size={12.5} color={colors.green} style={{ marginTop: 2 }}>
                        {alternatives.length} {t('alternatives_found')}
                    </Txt>
                </View>
            </View>

            <View style={{ width: '100%', gap: 10 }}>
                {alternatives.map(renderItem)}
            </View>
        </View>
    );
}
