import { Check, Globe, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from 'react-native-reanimated';

type LanguageOption = {
    value: string;
    label: string;
    icon?: string;
};

type LanguageSelectorProps = {
    visible: boolean;
    onClose: () => void;
    onSelect: (value: string) => void;
    currentLanguage: string;
    languages: LanguageOption[];
};

const SCREEN_HEIGHT = Dimensions.get('window').height;

export default function LanguageSelector({
    visible,
    onClose,
    onSelect,
    currentLanguage,
    languages,
}: LanguageSelectorProps) {
    const { colorScheme } = useColorScheme();
    const isDark = colorScheme === 'dark';

    // 1. Internal state to keep Modal open during exit animation
    const [showModal, setShowModal] = useState(visible);

    // 2. Shared values for manual animation control
    const translateY = useSharedValue(SCREEN_HEIGHT);
    const opacity = useSharedValue(0);

    // 3. Effect: Watch 'visible' prop to trigger animations
    useEffect(() => {
        if (visible) {
            setShowModal(true); // Mount the Modal immediately
            translateY.value = withSpring(0, {
                damping: 18,
                stiffness: 120,
                mass: 0.8,
            });
            opacity.value = withTiming(1, { duration: 200 });
        } else {
            // Animate out, THEN unmount
            opacity.value = withTiming(0, { duration: 200 });
            translateY.value = withSpring(
                SCREEN_HEIGHT,
                {
                    damping: 20,
                    stiffness: 120,
                    mass: 0.8,
                },
                () => {
                    // Callback when animation finishes
                    runOnJS(setShowModal)(false);
                }
            );
        }
    }, [visible]);

    // Animated styles
    const backdropStyle = useAnimatedStyle(() => ({
        opacity: opacity.value,
    }));

    const sheetStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: translateY.value }],
    }));

    // Handle closing trigger
    const handleClose = () => {
        onClose(); // This updates parent 'visible' to false, triggering the useEffect above
    };

    return (
        <Modal
            transparent
            visible={showModal} // Controlled by internal state, not prop directly
            animationType="none"
            onRequestClose={handleClose}
            statusBarTranslucent
        >
            <View className="flex-1 justify-end">
                {/* Backdrop */}
                <Animated.View
                    className="absolute top-0 left-0 right-0 bottom-0 bg-black/50"
                    style={backdropStyle}
                >
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPress={handleClose}
                    />
                </Animated.View>

                {/* Content Sheet */}
                <Animated.View
                    style={[sheetStyle, { width: Dimensions.get('window').width }]}
                    className="bg-white dark:bg-[#1F2937] rounded-t-[32px] overflow-hidden shadow-2xl pb-6"
                >
                    {/* Header */}
                    <View className="flex-row items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
                        <View className="flex-row items-center">
                            <View className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 items-center justify-center mr-3">
                                <Globe size={20} color={isDark ? '#34D399' : '#059669'} />
                            </View>
                            <Text className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">
                                Language
                            </Text>
                        </View>
                        <TouchableOpacity
                            onPress={handleClose}
                            className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
                        >
                            <X size={18} color={isDark ? '#9CA3AF' : '#6B7280'} />
                        </TouchableOpacity>
                    </View>

                    {/* Options */}
                    <View className="p-4">
                        {languages.map((lang) => {
                            const isSelected = currentLanguage === lang.value;
                            return (
                                <TouchableOpacity
                                    key={lang.value}
                                    activeOpacity={0.7}
                                    onPress={() => {
                                        onSelect(lang.value);
                                        handleClose(); // Optional: Close on select
                                    }}
                                    className={`
                    flex-row items-center p-4 mb-3 rounded-2xl
                    ${isSelected
                                            ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800'
                                            : 'bg-gray-50 dark:bg-gray-800 border border-transparent'
                                        }
                  `}
                                >
                                    <Text className="text-2xl mr-4">{lang.icon}</Text>
                                    <View className="flex-1">
                                        <Text
                                            className={`text-lg font-semibold ${isSelected
                                                    ? 'text-emerald-700 dark:text-emerald-400'
                                                    : 'text-gray-700 dark:text-gray-200'
                                                }`}
                                        >
                                            {lang.label}
                                        </Text>
                                        {isSelected && (
                                            <Text className="text-xs text-emerald-600 dark:text-emerald-500 font-medium mt-0.5">
                                                Active
                                            </Text>
                                        )}
                                    </View>
                                    {isSelected && (
                                        <View className="bg-emerald-500 rounded-full p-1.5 shadow-sm shadow-emerald-500">
                                            <Check size={14} color="white" strokeWidth={3} />
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Safe Area Spacer for bottom phones (iPhone 14/15/etc) */}
                    <View className="h-4" />
                </Animated.View>
            </View>
        </Modal>
    );
}