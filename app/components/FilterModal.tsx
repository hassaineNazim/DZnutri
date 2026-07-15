import { Check, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import { colors, radius, shadows } from '../theme/tokens';
import Txt from './ui/Txt';

type Filters = {
    category?: string;
    subcategory?: string;
    minScore?: number;
    maxScore?: number;
    verifiedOnly: boolean;
};

type Props = {
    visible: boolean;
    onClose: () => void;
    onApply: (filters: Filters) => void;
    initialFilters: Filters;
};

const SCORES = [0, 25, 50, 75, 100];

const CATEGORIES_MAP: Record<string, string[]> = {
    'solid': ['Gâteaux et pâtisseries', 'Plats préparés', 'Céréales', 'Snacks salés', 'Confiseries', 'Autre'],
    'boissons': ['Sodas', 'Jus de fruits', 'Thé et infusions', 'Café', 'Boissons énergisantes', 'Autre'],
    'matières grasses': ['Huile', 'Beurre', 'Margarine', 'Mayonnaise', 'Autre'],
    'fromages': ['Fromage frais', 'Fromage à pâte dure', 'Fromage à pâte molle', 'Fromage fondu', 'Autre'],
    'eau': ['Eau plate', 'Eau gazeuse', 'Eau aromatisée'],
};

const CATEGORY_LABELS: Record<string, string> = {
    'solid': 'Solide (Gâteaux, Plats...)',
    'boissons': 'Boissons',
    'matières grasses': 'Matières Grasses',
    'fromages': 'Fromages',
    'eau': 'Eau',
};

export default function FilterModal({ visible, onClose, onApply, initialFilters }: Props) {
    const [filters, setFilters] = useState<Filters>(initialFilters);

    const handleApply = () => onApply(filters);
    const resetFilters = () => setFilters({ category: undefined, subcategory: undefined, minScore: 0, verifiedOnly: false });

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={{ flex: 1, backgroundColor: 'rgba(30,18,12,0.55)', justifyContent: 'flex-end' }}>
                <Pressable style={{ flex: 1 }} onPress={onClose} />

                <View style={{ backgroundColor: colors.cream, borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '86%', paddingHorizontal: 22, paddingTop: 18, paddingBottom: 22 }}>
                    <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: '#d9cdb6', alignSelf: 'center', marginBottom: 18 }} />

                    {/* Header */}
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                        <View>
                            <Txt variant="display" size={26} color={colors.ink}>Filtres</Txt>
                            <TouchableOpacity onPress={resetFilters} style={{ marginTop: 2 }}>
                                <Txt variant="semibold" size={13} color={colors.bordeaux}>Réinitialiser</Txt>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={onClose} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(89,18,31,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                            <X size={20} color={colors.bordeaux} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
                        {/* Score minimum */}
                        <Txt variant="displayXBold" size={17} color={colors.ink} style={{ marginBottom: 12 }}>Score minimum</Txt>
                        <View style={{ flexDirection: 'row', backgroundColor: '#efe6d3', borderRadius: radius.cardSm, padding: 4, marginBottom: 26 }}>
                            {SCORES.map((score) => {
                                const isSelected = filters.minScore === score;
                                return (
                                    <TouchableOpacity
                                        key={score}
                                        onPress={() => setFilters((prev) => ({ ...prev, minScore: score }))}
                                        style={{ flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 11, backgroundColor: isSelected ? colors.yellow : 'transparent' }}
                                    >
                                        <Txt variant="bold" size={14} color={isSelected ? colors.inkOnYellow : colors.inkSoft}>{score}+</Txt>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Catégories */}
                        <Txt variant="displayXBold" size={17} color={colors.ink} style={{ marginBottom: 12 }}>Catégories</Txt>
                        <View style={{ marginBottom: 26 }}>
                            {Object.keys(CATEGORIES_MAP).map((cat) => {
                                const isSelected = filters.category === cat;
                                const subcategories = CATEGORIES_MAP[cat];
                                return (
                                    <View key={cat} style={{ marginBottom: 8 }}>
                                        <TouchableOpacity
                                            onPress={() => setFilters((prev) => ({ ...prev, category: isSelected ? undefined : cat, subcategory: undefined }))}
                                            activeOpacity={0.8}
                                            style={{
                                                flexDirection: 'row',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                paddingHorizontal: 16,
                                                paddingVertical: 15,
                                                borderRadius: radius.cardSm,
                                                borderWidth: 1.5,
                                                backgroundColor: isSelected ? 'rgba(89,18,31,0.06)' : colors.white,
                                                borderColor: isSelected ? colors.bordeaux : '#e7ddc9',
                                            }}
                                        >
                                            <Txt variant="semibold" size={15} color={isSelected ? colors.bordeaux : colors.ink}>
                                                {CATEGORY_LABELS[cat] || cat}
                                            </Txt>
                                            {isSelected && <Check size={18} color={colors.bordeaux} strokeWidth={3} />}
                                        </TouchableOpacity>

                                        {isSelected && subcategories?.length > 0 && (
                                            <View style={{ marginLeft: 16, marginTop: 6, borderLeftWidth: 2, borderLeftColor: 'rgba(89,18,31,0.15)', paddingLeft: 16, paddingVertical: 4 }}>
                                                {subcategories.map((sub) => {
                                                    const subSelected = filters.subcategory === sub;
                                                    return (
                                                        <TouchableOpacity
                                                            key={sub}
                                                            onPress={() => setFilters((prev) => ({ ...prev, subcategory: prev.subcategory === sub ? undefined : sub }))}
                                                            style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8 }}
                                                        >
                                                            <View style={{ width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, marginRight: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: subSelected ? colors.bordeaux : 'transparent', borderColor: subSelected ? colors.bordeaux : '#cbbfa8' }}>
                                                                {subSelected && <Check size={12} color={colors.white} strokeWidth={4} />}
                                                            </View>
                                                            <Txt variant={subSelected ? 'semibold' : 'body'} size={14} color={subSelected ? colors.bordeaux : colors.inkSoft}>
                                                                {sub}
                                                            </Txt>
                                                        </TouchableOpacity>
                                                    );
                                                })}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>

                        {/* Vérifiés uniquement */}
                        <TouchableOpacity
                            onPress={() => setFilters((prev) => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
                            activeOpacity={0.8}
                            style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.white, borderWidth: 1.5, borderColor: '#e7ddc9', padding: 16, borderRadius: radius.cardSm, marginBottom: 24 }}
                        >
                            <Txt variant="semibold" size={15} color={colors.ink}>Produits vérifiés uniquement</Txt>
                            <View style={{ width: 44, height: 26, borderRadius: 13, padding: 3, justifyContent: 'center', backgroundColor: filters.verifiedOnly ? colors.green : '#d9cdb6' }}>
                                <View style={{ width: 20, height: 20, backgroundColor: colors.white, borderRadius: 10, alignSelf: filters.verifiedOnly ? 'flex-end' : 'flex-start' }} />
                            </View>
                        </TouchableOpacity>
                    </ScrollView>

                    {/* Footer */}
                    <View style={{ paddingTop: 14, borderTopWidth: 1, borderTopColor: '#e7ddc9' }}>
                        <TouchableOpacity onPress={handleApply} activeOpacity={0.85} style={[{ backgroundColor: colors.yellow, borderRadius: radius.cta, paddingVertical: 17, alignItems: 'center' }, shadows.listCard]}>
                            <Txt variant="bold" size={16} color={colors.inkOnYellow}>Appliquer</Txt>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
