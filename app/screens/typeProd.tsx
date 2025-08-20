import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Forklift, MoreHorizontal, SprayCan } from 'lucide-react-native';
import React from 'react';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';

// Composant réutilisable pour chaque ligne de catégorie
const CategoryItem = ({ icon, title, subtitle, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    className="flex-row items-center bg-gray-100 dark:bg-gray-800 p-4 rounded-xl mb-4"
  >
    {/* Conteneur pour l'icône avec fond coloré */}
    <View className="w-12 h-12 bg-red-100 dark:bg-red-900/50 rounded-lg items-center justify-center mr-4">
      {icon}
    </View>
    <View>
      <Text className="text-lg font-semibold text-gray-900 dark:text-white">{title}</Text>
      <Text className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</Text>
    </View>
  </TouchableOpacity>
);

export default function TypeProduitPage() {
  const router = useRouter();

  const { barcode } = useLocalSearchParams();
  console.log('Navigating to ajouterProdInfo with barcode:', barcode)

  return (
    <View className="flex-1 bg-white dark:bg-black p-6">
      <StatusBar barStyle="dark-content" />
      
      {/* En-tête */}
      <View className="flex-row items-center mb-8">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ChevronLeft size={28} className="text-gray-800 dark:text-white" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-gray-900 dark:text-white ml-4">
          Ajouter un produit
        </Text>
      </View>

      <Text className="text-xl font-bold text-gray-900 dark:text-white mb-6">
        De quoi s'agit-il ?
      </Text>

      {/* Liste des catégories */}
      <CategoryItem
        icon={<Forklift size={24} color="#EF4444" />}
        title="Alimentation"
        subtitle="Produits de la cuisine"
        onPress={() => router.push({
          pathname: './ajouterProdInfo',
          // On passe les deux informations à la page suivante
          params: { barcode, type: 'alimentation' },
        })}
      />
      <CategoryItem
        icon={<SprayCan size={24} color="#F97316" />} // Icône orange
        title="Cosmétiques"
        subtitle="Produits de la salle de bain"
        onPress={() => { /* Logique future pour les cosmétiques */ }}
      />
      <CategoryItem
        icon={<MoreHorizontal size={24} color="#6B7280" />} // Icône grise
        title="Autre produit"
        subtitle="Aucune des catégories ci-dessus"
        onPress={() => { /* Logique future pour les autres produits */ }}
      />
    </View>
  );
}