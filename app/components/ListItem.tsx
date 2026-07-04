import { MaterialIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from '../i18n';

export type ListItemProps = {
  item: {
    id: number;
    item_type?: 'food' | 'cosmetic';
    product_name?: string;
    brand?: string;
    image_url?: string;
    custom_score?: number;
    nutri_score?: string;
    scanned_at?: string | null;
  };
  onPress: () => void;
  onDelete?: (id: number) => void;
  onLongPress?: () => void;
  selected?: boolean;
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export default function ListItem({ item, onPress, onDelete, onLongPress, selected = false }: ListItemProps) {
  const { t } = useTranslation();
  const score = item.custom_score ?? 0;
  const MAX_SCORE = 100;

  // SVG parameters
  const size = 56;
  const strokeWidth = 5;
  const center = size / 2;
  const radius = center - (strokeWidth / 2);
  const circumference = 2 * Math.PI * radius;

  // Animation
  const progress = useSharedValue(0);

  useEffect(() => {
    // Animate to the score value with a slight delay for a staggered effect
    progress.value = withDelay(200, withTiming(score / MAX_SCORE, { duration: 1000 }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  const color = getScoreColor(score);
  const bgColor = getBackgroundColor(score);
  const isCosmetic = item.item_type === 'cosmetic';

  const relativeTime = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const diff = Date.now() - d.getTime();
      const sec = Math.floor(diff / 1000);
      if (sec < 60) return `${sec}` + t('s');
      const min = Math.floor(sec / 60);
      if (min < 60) return `${min}` + t('m');
      const hr = Math.floor(min / 60);
      if (hr < 24) return `${hr}` + t('h');
      const days = Math.floor(hr / 24);
      return `${days}` + t('d');
    } catch {
      return iso;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      className={`flex-row items-center p-3 rounded-2xl mb-3 bg-white dark:bg-[#1F2937] shadow-sm border ${selected ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-transparent'}`}
      activeOpacity={0.7}
    >
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} className="w-16 h-16 rounded-xl mr-4 bg-gray-100 dark:bg-gray-800" resizeMode="contain" />
      ) : (
        <View className="w-16 h-16 rounded-xl mr-4 bg-gray-100 dark:bg-gray-800 justify-center items-center">
          <MaterialIcons name={isCosmetic ? 'spa' : 'fastfood'} size={24} color={isCosmetic ? '#EC4899' : '#9CA3AF'} />
        </View>
      )}

      <View className="flex-1 mr-2">
        <View className="flex-row items-center">
          <Text className="text-base font-bold text-gray-900 dark:text-white flex-shrink" numberOfLines={1}>
            {item.product_name || t('product_unknown')}
          </Text>
          {isCosmetic && (
            <View className="ml-2 px-1.5 py-0.5 rounded-md bg-pink-100 dark:bg-pink-900/30">
              <Text className="text-[10px] font-bold text-pink-600 dark:text-pink-300">
                {t('cosmetic').toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <Text className="text-sm text-gray-500 dark:text-gray-400 mt-0.5" numberOfLines={1}>
          {item.brand || t('brand_unknown')}
        </Text>

        <View className="flex-row items-center mt-2">
          <View className={`w-2 h-2 rounded-full mr-2`} style={{ backgroundColor: color }} />
          <Text className="text-xs font-medium" style={{ color: color }}>
            {getQualityLabel(item.custom_score, t)}
          </Text>
          <Text className="text-xs text-gray-400 mx-2">•</Text>
          <Text className="text-xs text-gray-400">{relativeTime(item.scanned_at)}</Text>
        </View>
      </View>

      <View className="justify-center items-center" style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background Track */}
          <Circle
            stroke={selected ? "transparent" : "#E5E7EB"} // Hide track if selected to avoid visual clutter or keep it subtle
            strokeOpacity={0.3}
            fill="none"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
          />

          {/* Animated Progress */}
          <AnimatedCircle
            stroke={color}
            fill="none"
            cx={center}
            cy={center}
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            rotation="-90"
            origin={`${center}, ${center}`}
            animatedProps={animatedProps}
          />
        </Svg>

        {/* Score Text */}
        <View className="absolute inset-0 justify-center items-center">
          <View
            className="w-10 h-10 rounded-full justify-center items-center"
            style={{ backgroundColor: bgColor }}
          >
            <Text className="text-sm font-bold" style={{ color: color }}>
              {typeof item.custom_score === 'number' ? item.custom_score : '-'}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Échelle alignée sur le reste de l'app (scanner, recherche, fiches) :
// >=75 excellent (vert), >=50 bon (lime), >=25 médiocre (orange), sinon mauvais.
function getScoreColor(score?: number | null) {
  if (typeof score !== 'number') return '#9CA3AF';
  if (score >= 75) return '#22C55E'; // Green-500
  if (score >= 50) return '#84CC16'; // Lime-500
  if (score >= 25) return '#F97316'; // Orange-500
  return '#EF4444'; // Red-500
}

function getBackgroundColor(score?: number | null) {
  if (typeof score !== 'number') return '#F3F4F6';
  if (score >= 75) return '#DCFCE7'; // Green-100
  if (score >= 50) return '#ECFCCB'; // Lime-100
  if (score >= 25) return '#FFEDD5'; // Orange-100
  return '#FEE2E2'; // Red-100
}

function getQualityLabel(score?: number | null, tFn?: any) {
  try {
    if (typeof score !== 'number') return tFn ? tFn('not_available') : 'N/A';
    if (score >= 75) return tFn ? tFn('excellent') : 'Excellent';
    if (score >= 50) return tFn ? tFn('good') : 'Bon';
    if (score >= 25) return tFn ? tFn('mediocre') : 'Médiocre';
    return tFn ? tFn('bad') : 'Mauvais';
  } catch {
    return 'N/A';
  }
}
