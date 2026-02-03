import { BlurView } from 'expo-blur';
import { AlertTriangle, Check, Info, XCircle } from 'lucide-react-native';
import React from 'react';
import { Dimensions, Platform, Text, View } from 'react-native';
import Animated, {
    SlideInUp,
    SlideOutUp
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
    message: string;
    type?: ToastType;
    onHide?: () => void;
    visible: boolean;
}

const Toast = ({ message, type = 'success', onHide, visible }: ToastProps) => {
    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'success': return <Check size={20} color="#10B981" />;
            case 'error': return <XCircle size={20} color="#EF4444" />;
            case 'warning': return <AlertTriangle size={20} color="#F59E0B" />;
            case 'info': return <Info size={20} color="#3B82F6" />;
            default: return <Check size={20} color="#10B981" />;
        }
    };

    const getColors = () => {
        switch (type) {
            case 'success': return 'bg-emerald-50/90 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800';
            case 'error': return 'bg-red-50/90 dark:bg-red-900/40 border-red-200 dark:border-red-800';
            case 'warning': return 'bg-amber-50/90 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800';
            case 'info': return 'bg-blue-50/90 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800';
            default: return 'bg-gray-50/90 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700';
        }
    };

    return (
        <Animated.View
            entering={SlideInUp.springify().damping(15)}
            exiting={SlideOutUp}
            style={{
                position: 'absolute',
                top: Platform.OS === 'ios' ? 60 : 40,
                left: 20,
                right: 20,
                zIndex: 9999,
                alignItems: 'center',
            }}
        >
            <View className={`w-full max-w-[400px] overflow-hidden rounded-2xl border shadow-sm ${getColors()}`}>
                <BlurView intensity={Platform.OS === 'ios' ? 20 : 0} className="w-full flex-row items-center p-4">
                    <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${type === 'success' ? 'bg-emerald-100 dark:bg-emerald-800' : type === 'error' ? 'bg-red-100 dark:bg-red-800' : 'bg-gray-100 dark:bg-gray-700'}`}>
                        {getIcon()}
                    </View>
                    <Text className="flex-1 text-gray-900 dark:text-white font-medium text-base leading-5">
                        {message}
                    </Text>
                </BlurView>
            </View>
        </Animated.View>
    );
};

export default Toast;
