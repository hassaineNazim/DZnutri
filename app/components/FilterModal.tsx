import { Check, X } from 'lucide-react-native';
import { cssInterop } from 'nativewind';
import React, { useState } from 'react';
import {
    Modal,
    Pressable as RNPressable,
    ScrollView,
    Text,
    View,
} from 'react-native';

// --- THE FIX ---
// We create a version of Pressable that ONLY maps className to style
// and skips the Navigation Context check that causes the crash.
const StaticButton = RNPressable;
cssInterop(StaticButton, { className: 'style' });

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

// Hardcoded categories matching the admin approval modal
const CATEGORIES_MAP: Record<string, string[]> = {
    'solid': ['Gâteaux et pâtisseries', 'Plats préparés', 'Céréales', 'Snacks salés', 'Confiseries', 'Autre'],
    'boissons': ['Sodas', 'Jus de fruits', 'Thé et infusions', 'Café', 'Boissons énergisantes', 'Autre'],
    'matières grasses': ['Huile', 'Beurre', 'Margarine', 'Mayonnaise', 'Autre'],
    'fromages': ['Fromage frais', 'Fromage à pâte dure', 'Fromage à pâte molle', 'Fromage fondu', 'Autre'],
    'eau': ['Eau plate', 'Eau gazeuse', 'Eau aromatisée']
};

// Friendly display names for categories
const CATEGORY_LABELS: Record<string, string> = {
    'solid': 'Solide (Gâteaux, Plats...)',
    'boissons': 'Boissons',
    'matières grasses': 'Matières Grasses',
    'fromages': 'Fromages',
    'eau': 'Eau'
};

export default function FilterModal({ visible, onClose, onApply, initialFilters }: Props) {
    const [filters, setFilters] = useState<Filters>(initialFilters);

    const handleApply = () => onApply(filters);

    const resetFilters = () => {
        setFilters({
            category: undefined,
            subcategory: undefined,
            minScore: 0,
            verifiedOnly: false
        });
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View className="flex-1 bg-black/50 justify-end">
                {/* Using StaticButton for the backdrop too just in case */}
                <StaticButton className="flex-1" onPress={onClose} />

                <View className="bg-white dark:bg-[#1F2937] rounded-t-3xl h-[85%] p-6">

                    {/* Header */}
                    <View className="flex-row justify-between items-center mb-6">
                        <View>
                            <Text className="text-xl font-bold text-gray-900 dark:text-white">Filtres</Text>
                            <StaticButton onPress={resetFilters}>
                                <Text className="text-sm text-emerald-600 font-medium">Réinitialiser</Text>
                            </StaticButton>
                        </View>
                        <StaticButton onPress={onClose} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full">
                            <X size={20} color="#9CA3AF" />
                        </StaticButton>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} className="flex-1">

                        {/* Score Minimum */}
                        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">Score Minimum</Text>
                        <View className="flex-row justify-between mb-8 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                            {SCORES.map(score => {
                                const isSelected = filters.minScore === score;

                                return (
                                    <RNPressable
                                        key={score}
                                        onPress={() => setFilters(prev => ({ ...prev, minScore: score }))}
                                        // WE ARE NOT USING className HERE. THIS BYPASSES THE ERROR.
                                        style={{
                                            flex: 1,
                                            paddingVertical: 12,
                                            alignItems: 'center',
                                            borderRadius: 8,
                                            backgroundColor: isSelected ? '#4B5563' : 'transparent',
                                            // Adding shadow for selected item
                                            shadowColor: isSelected ? "#000" : "transparent",
                                            shadowOffset: { width: 0, height: 1 },
                                            shadowOpacity: 0.2,
                                            shadowRadius: 1.41,
                                            elevation: isSelected ? 2 : 0,
                                        }}
                                    >
                                        <Text
                                            style={{
                                                fontWeight: 'bold',
                                                color: isSelected ? '#10B981' : '#9CA3AF'
                                            }}
                                        >
                                            {score}+
                                        </Text>
                                    </RNPressable>
                                );
                            })}
                        </View>

                        {/* Categories */}
                        <Text className="text-base font-semibold text-gray-900 dark:text-white mb-3">Catégories</Text>
                        <View className="space-y-3 mb-8">
                            {Object.keys(CATEGORIES_MAP).map(cat => {
                                const isSelected = filters.category === cat;
                                const subcategories = CATEGORIES_MAP[cat];
                                return (
                                    <View key={cat} >
                                        <StaticButton
                                            onPress={() => setFilters(prev => ({
                                                ...prev,
                                                category: isSelected ? undefined : cat,
                                                subcategory: undefined
                                            }))}
                                            className={`flex-row items-center justify-between px-4 py-4 rounded-xl border ${isSelected
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500'
                                                : 'bg-gray-50 dark:bg-gray-800 border-gray-100 dark:border-gray-700'
                                                } mb-2`}
                                        >
                                            <Text className={`font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                                {CATEGORY_LABELS[cat] || cat}
                                            </Text>
                                            {isSelected && <Check size={18} color="#10B981" strokeWidth={3} />}
                                        </StaticButton>

                                        {isSelected && subcategories?.length > 0 && (
                                            <View className="ml-4 mt-2 border-l-2 border-emerald-100 dark:border-emerald-900 pl-4 py-2">
                                                {subcategories.map(sub => (
                                                    <StaticButton
                                                        key={sub}
                                                        onPress={() => setFilters(prev => ({
                                                            ...prev,
                                                            subcategory: prev.subcategory === sub ? undefined : sub
                                                        }))}
                                                        className="py-2 flex-row items-center"
                                                    >
                                                        <View className={`w-5 h-5 rounded border mr-3 items-center justify-center ${filters.subcategory === sub ? 'bg-emerald-500 border-emerald-500' : 'border-gray-300 dark:border-gray-600'}`}>
                                                            {filters.subcategory === sub && <Check size={12} color="white" strokeWidth={4} />}
                                                        </View>
                                                        <Text className={filters.subcategory === sub ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-gray-500 dark:text-gray-400'}>
                                                            {sub}
                                                        </Text>
                                                    </StaticButton>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                );
                            })}
                        </View>

                        {/* Verified Toggle */}
                        <StaticButton
                            onPress={() => setFilters(prev => ({ ...prev, verifiedOnly: !prev.verifiedOnly }))}
                            className="flex-row items-center justify-between bg-gray-50 dark:bg-gray-800 p-4 rounded-xl mb-10"
                        >
                            <Text className="text-base font-medium text-gray-900 dark:text-white">Produits vérifiés uniquement</Text>
                            <View className={`w-10 h-6 rounded-full px-1 justify-center ${filters.verifiedOnly ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                                <View className={`w-4 h-4 bg-white rounded-full ${filters.verifiedOnly ? 'self-end' : 'self-start'}`} />
                            </View>
                        </StaticButton>
                    </ScrollView>

                    {/* Footer */}
                    <View className="pt-4 border-t border-gray-100 dark:border-gray-700">
                        <StaticButton
                            onPress={handleApply}
                            className="bg-emerald-500 py-4 rounded-2xl items-center shadow-md active:opacity-90"
                        >
                            <Text className="text-white font-bold text-lg">Appliquer</Text>
                        </StaticButton>
                    </View>
                </View>
            </View>
        </Modal>
    );
}