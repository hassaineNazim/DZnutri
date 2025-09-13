import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import ListItem from '../components/ListItem';
import { deleteFromHistory, fetchHistory } from '../services/saveHistorique';

type Product = {
  id: number;
  brands?: string;
  product_name?: string;
  image_url?: string;
  custom_score?: number;
  nutrition_grades?: string;

};

export default function HistoriquePage() {
  const [history, setHistory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // 2. On utilise useFocusEffect pour charger les données à chaque fois que l'écran est affiché
  useFocusEffect(
    useCallback(() => {
      const loadHistoryFromServer = async () => {
        setLoading(true);
        const serverHistory = await fetchHistory();    

         // --- LIGNE DE VÉRIFICATION ---
         if (serverHistory.length > 0) {
          console.log("Données reçues par le frontend (premier produit) :", serverHistory[0]);
         }
         // ----------------------------
        
        setHistory(serverHistory);
        setLoading(false);
      };

      loadHistoryFromServer();
    }, [])
  );

  // Affiche un indicateur de chargement
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white dark:bg-[#181A20]">
        <ActivityIndicator size="large" />
      </View>
    );
  }
   const handleDelete = async (itemId: number) => {
    try {
      // 1. On dit au backend de supprimer l'élément
      await deleteFromHistory(itemId);
      // 2. Si la suppression réussit, on met à jour l'affichage localement
      setHistory(prevHistory => prevHistory.filter(item => item.id !== itemId));
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemPress = (product: Product) => {
    // On passe l'objet produit entier en le convertissant en chaîne JSON
    router.push({
      pathname: '../screens/productDetail', 
      params: { product: JSON.stringify(product) },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-[#181A20] p-4">
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        // 4. On passe la fonction de navigation au composant ListItem
        renderItem={({ item }) => (
          <ListItem
            item={item}
            onPress={() => handleItemPress(item)}
          />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-gray-500 text-lg">Aucun historique de scan.</Text>
          </View>
        }
      />
    </View>
  );
}