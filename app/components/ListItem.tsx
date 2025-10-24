import { MaterialIcons } from "@expo/vector-icons";
import React from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
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
  };
  onPress: () => void; // Requis pour la navigation
  onDelete?: (id: number) => void; // Optionnel
  onLongPress?: () => void; // for selection
  selected?: boolean;
};

export default function ListItem({ item, onPress, onDelete, onLongPress, selected = false }: ListItemProps) {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";

  // Fonction pour le style du Nutri-Score (inchangée)
  const getNutriScoreStyle = (grade?: string) => {
    switch (grade?.toLowerCase()) {
      case "a": return styles.nutriScoreA;
      case "b": return styles.nutriScoreB;
      case "c": return styles.nutriScoreC;
      case "d": return styles.nutriScoreD;
      case "e": return styles.nutriScoreE;
      default: return styles.nutriScoreDefault;
    }
  };
  
  // Styles dynamiques pour le mode sombre
  const cardStyle = isDarkMode ? styles.cardDark : styles.cardLight;
  const textStyle = isDarkMode ? styles.textDark : styles.textLight;
  const subTextStyle = isDarkMode ? styles.subTextDark : styles.subTextLight;

  return (
    // 2. Le conteneur principal est un TouchableOpacity qui gère le clic pour la navigation
    <TouchableOpacity onPress={onPress} onLongPress={onLongPress} style={[styles.card, cardStyle, selected ? styles.selectedCard : null]}>
      {/* Image ou Placeholder */}
      {item.image_url ? (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <MaterialIcons name="fastfood" size={28} color="#9CA3AF" />
        </View>
      )}

      {/* Infos Texte */}
      <View style={styles.textContainer}>
        <Text style={[styles.productName, textStyle]} numberOfLines={1}>
          {item.product_name || t('product_unknown')}
        </Text>
        <Text style={[styles.brandName, subTextStyle]} numberOfLines={1}>
          {item.brand || t('brand_unknown')}
        </Text>
        <Text style={[styles.score, subTextStyle]}>
          {t('score_label')}: {item.custom_score ?? "N/A"}
        </Text>
      </View>

      {/* Nutri-Score */}
      <View style={[styles.nutriScoreBadge, getNutriScoreStyle(item.nutri_score)]}>
        <Text style={styles.nutriScoreText}>
          {item.nutri_score?.toUpperCase() || "?"}
        </Text>
      </View>

      {/* Selected overlay */}
      {selected && (
        <View style={styles.selectedOverlay} pointerEvents="none">
          
        </View>
      )}
    </TouchableOpacity>
  );
}

// 4. Styles complets et propres
const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardLight: { backgroundColor: "white" },
  cardDark: { backgroundColor: "#27272A" },
  image: {
    width: 64,
    height: 64,
    borderRadius: 8,
    marginRight: 12,
  },
  imagePlaceholder: {
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: { flex: 1 },
  productName: { fontSize: 16, fontWeight: "600" },
  brandName: { fontSize: 14, marginTop: 2 },
  score: { fontSize: 13, marginTop: 4 },
  textLight: { color: "#1F2937" },
  textDark: { color: "white" },
  subTextLight: { color: "#6B7280" },
  subTextDark: { color: "#D1D5DB" },
  nutriScoreBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 8,
  },
  nutriScoreText: { color: "white", fontWeight: "bold" },
  nutriScoreA: { backgroundColor: "#059669" },
  nutriScoreB: { backgroundColor: "#84CC16" },
  nutriScoreC: { backgroundColor: "#F97316" },
  nutriScoreD: { backgroundColor: "#EF4444" },
  nutriScoreE: { backgroundColor: "#DC2626" },
  nutriScoreDefault: { backgroundColor: "#6B7280" },
  deleteButton: { padding: 6 },
  selectedCard: { borderColor: '#22c55e', borderWidth: 2 },
  selectedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(34,197,94,0.15)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#16a34a',
    justifyContent: 'center',
    alignItems: 'center',
  },
});