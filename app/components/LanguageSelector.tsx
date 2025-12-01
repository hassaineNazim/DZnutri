import { Check, Globe, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Dimensions, Modal, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown } from 'react-native-reanimated';

type LanguageOption = {
    value: string;
    label: string;
    icon?: string; // Emoji flag
};

type LanguageSelectorProps = {
    visible: boolean;
    onClose: () => void;
    onSelect: (value: string) => void;
    currentLanguage: string;
    languages: LanguageOption[];
};

export default function LanguageSelector({
    visible,
    onClose,
    onSelect,
    currentLanguage,
    languages
}: LanguageSelectorProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    // We rely on the Modal's visible prop for rendering
    // if (!visible) return null; 

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            onRequestClose={onClose}
        >
            <View className="flex-1 justify-end">
                {/* Backdrop with FadeIn */}
                <Animated.View
                    entering={FadeIn.duration(200)}
                    exiting={FadeOut.duration(200)}
                    className="absolute top-0 left-0 right-0 bottom-0 bg-black/50"
                >
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={onClose}
                    />
                </Animated.View>

                {/* Content with SlideIn */}
                <Animated.View
                    entering={SlideInDown.duration(300)}
                    style={{ width: Dimensions.get('screen').width }}
                    className="bg-white dark:bg-[#1F2937] rounded-t-3xl overflow-hidden"
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
                                <Globe size={20} color={isDark ? '#34D399' : '#059669'} />
                            </View>
                            <Text className="text-xl font-bold text-gray-900 dark:text-white">
                                Language
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={onClose}
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
                        >
                            <X size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                        </TouchableOpacity>
                    </View>

                    {/* Options */}
                    <View className="p-4 pb-10">
                        {languages.map((lang, index) => {
                            const isSelected = currentLanguage === lang.value;
                            return (
                                <TouchableOpacity
                                    key={lang.value}
                                    onPress={() => onSelect(lang.value)}
                                    className={`
                    flex-row items-center p-4 mb-2 rounded-2xl
                    ${isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800' : 'bg-gray-50 dark:bg-gray-800 border border-transparent'}
                  `}
                                >
                                    <Text className="text-2xl mr-4">{lang.icon}</Text>
                                    <Text className={`flex-1 text-lg font-medium ${isSelected ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'}`}>
                                        {lang.label}
                                    </Text>
                                    {isSelected && (
                                        <View className="bg-emerald-500 rounded-full p-1">
                                            <Check size={16} color="white" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </Animated.View>
            </View>
        </Modal>
    );
}
