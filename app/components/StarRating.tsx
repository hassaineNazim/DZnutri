import { Star } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity, View } from 'react-native';

type Props = {
  value: number;                    // note (0-5, décimale acceptée pour l'affichage)
  onChange?: (v: number) => void;   // si fourni -> étoiles cliquables
  size?: number;
  color?: string;
};

// Étoiles de notation. Lecture seule par défaut ; interactif si `onChange`.
export default function StarRating({ value, onChange, size = 24, color = '#F59E0B' }: Props) {
  return (
    <View
      accessible={!onChange}
      accessibilityRole={!onChange ? 'text' : undefined}
      accessibilityLabel={!onChange ? `Note ${value} sur 5` : undefined}
      style={{ flexDirection: 'row' }}
    >
      {[1, 2, 3, 4, 5].map((s) => {
        const filled = value >= s - 0.5; // arrondi à la demi-étoile la plus proche
        const icon = (
          <Star size={size} color={color} fill={filled ? color : 'transparent'} strokeWidth={2} />
        );
        return onChange ? (
          <TouchableOpacity
            key={s}
            onPress={() => onChange(s)}
            accessibilityRole="button"
            accessibilityLabel={`${s} étoile${s > 1 ? 's' : ''} sur 5`}
            accessibilityState={{ selected: Math.round(value) === s }}
            activeOpacity={0.7}
            style={{ padding: 6 }}
          >
            {icon}
          </TouchableOpacity>
        ) : (
          <View key={s} style={{ padding: 2 }}>
            {icon}
          </View>
        );
      })}
    </View>
  );
}
