import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import { Image, Text, TouchableOpacity, View } from "react-native";
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from '../i18n';
// 1. Définition des props corrigée
export type ListItemProps = {
  item: {
    id: number;
    product_name?: string;
    brand?: string;
    image_url?: string;
    custom_score?: number;
    nutri_score?: string;
    scanned_at?: string | null;
  };
  onPress: () => void; // Requis pour la navigation
  onDelete?: (id: number) => void; // Optionnel
  onLongPress?: () => void; // for selection
  selected?: boolean;
};




export default function ListItem({ item, onPress, onDelete, onLongPress, selected = false }: ListItemProps) {
  const { t } = useTranslation();
// --- Component logic ---
const score = item.custom_score ?? 0;
const MAX_SCORE = 100; // IMPORTANT: Change this to your maximum possible score

// SVG parameters
const size = 56;
const strokeWidth = 6; // This creates the 6px thick ring from your screenshot
const center = size / 2;
const radius = center - (strokeWidth / 2);
const circumference = 2 * Math.PI * radius;

// Calculate progress
const progressPercentage = (typeof score === 'number' ? score : 0) / MAX_SCORE;
const strokeDashoffset = circumference * (1 - progressPercentage);

// Get the color
const color = getScoreColor(score);
  const relativeTime = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      const diff = Date.now() - d.getTime();
      const sec = Math.floor(diff / 1000);
      if (sec < 60) return `${sec}`+t('s');
      const min = Math.floor(sec / 60);
      if (min < 60) return `${min}`+t('m');
      const hr = Math.floor(min / 60);
      if (hr < 24) return `${hr}`+t('h');
      const days = Math.floor(hr / 24);
      return `${days}`+t('d');
    } catch (e) {
      return iso;
    }
    
  };

  return (
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} className="flex-row items-center p-3 rounded-xl mb-3 bg-slate-100 dark:bg-[#111214] shadow-md" style={selected ? { borderWidth: 2, borderColor: 'limegreen' } : {}}>
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} className="w-16 h-16 rounded-lg mr-3" />
      ) : (
        <View className="w-16 h-16 rounded-lg mr-3 bg-gray-100 justify-center items-center">
          <MaterialIcons name="fastfood" size={28} color="#9CA3AF" />
        </View>
      )}

      <View className="flex-1">
        <Text className="text-lg font-bold text-gray-900 dark:text-gray-100" numberOfLines={1}>{item.product_name || t('product_unknown')}</Text>

        <Text className="text-sm text-gray-500" numberOfLines={1}>{item.brand || t('brand_unknown')}</Text>

        <View className="flex-row items-center mt-1">
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: getScoreColor(item.custom_score) }} />
          <Text className="text-sm ml-2" style={{ color: getScoreColor(item.custom_score) }}>{getQualityLabel(item.custom_score, t)}</Text>
        </View>

        <Text className="text-xs text-gray-400 mt-1">{relativeTime(item.scanned_at)}</Text>
      </View>

   <View className="ml-3 justify-center items-center" style={{ width: size, height: size }}>
    
    {/* SVG container for the rings */}
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background "track" circle (light grey) */}
      <Circle
        stroke="#E6E7E8"
        fill="none"
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={strokeWidth}
      />
      
      {/* Foreground "progress" circle */}
      <Circle
        stroke={color}
        fill="none"
        cx={center}
        cy={center}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round" // Makes the end of the line rounded
        transform={`rotate(-90 ${center} ${center})`} // Starts the ring at the top (12 o'clock)
      />
    </Svg>
    
    {/* This is the white circle and text, absolutely positioned in the center */}
    <View 
      style={{ 
        width: 44, 
        height: 44, 
        borderRadius: 22, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: getbackgroundColor(item.custom_score),
        position: 'absolute' // This puts it on top of the Svg
      }}
    >
      <Text style={{ 
        color: color, 
        fontWeight: '800', 
        fontSize: 16 
      }}>
        {typeof item.custom_score === 'number' ? item.custom_score : (item.custom_score ?? 'N/A')}
      </Text>
    </View>
    
  </View>
</TouchableOpacity>
  );
}



function getScoreColor(score?: number | null) {
  if (typeof score !== 'number') return '#9CA3AF';
  if (score >= 70) return '#16a34a';
  if (score >= 35) return '#F97316';
  return '#EF4444';
}
function getbackgroundColor(score?: number | null) {
  if (typeof score !== 'number') return '#FFFFFF';
  if (score >= 70) return '#D1FAE5';
  if (score >= 35) return '#FFEDD5';
  return '#FEE2E2';
}

function getQualityLabel(score?: number | null, tFn?: any) {
  // Use i18n translations if available, otherwise fall back to French labels
  try {
    if (typeof score !== 'number') return tFn ? tFn('not_available') : 'N/A';
    if (score >= 70) return tFn ? tFn('excellent') : t('Excellent');
    if (score >= 35) return tFn ? tFn('mediocre') : 'Médiocre';
    return tFn ? tFn('bad') : 'Mauvais';
  } catch (e) {
    if (typeof score !== 'number') return 'N/A';
    if (score >= 70) return 'Excellent';
    if (score >= 35) return 'Médiocre';
    return 'Mauvais';
  }
}
