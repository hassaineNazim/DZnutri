import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { Text, TouchableOpacity, View, useColorScheme } from 'react-native';
import { useTranslation } from '../i18n';

type StepHeaderProps = {
    step: number;
    title: string;
    totalSteps?: number;
};

export default function StepHeader({ step, title, totalSteps = 3 }: StepHeaderProps) {
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <View className="mb-8">
            <View className="flex-row items-center mb-6">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center mr-3"
                >
                    <ChevronLeft size={24} color={useColorScheme() === 'dark' ? '#fff' : '#111827'} />
                </TouchableOpacity>
                <View className="flex-1">
                    <Text className="text-sm font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        {t('add_product_title')}
                    </Text>
                    <Text className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                        {title}
                    </Text>
                </View>
            </View>

            {/* Progress Bar */}
            <View className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-row">
                {[...Array(totalSteps)].map((_, i) => (
                    <View
                        key={i}
                        className={`flex-1 ${i < step ? 'bg-emerald-500' : 'bg-transparent'} ${i > 0 ? 'ml-1' : ''}`}
                    />
                ))}
            </View>
            <Text className="text-right text-xs text-gray-500 dark:text-gray-400 mt-2">
                {step}/{totalSteps}
            </Text>
        </View>
    );
}
