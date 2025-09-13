import { useFocusEffect } from '@react-navigation/native';
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

  // 2. On utilise useFocusEffect pour charger les données à chaque fois que l'écran est affiché
  useFocusEffect(
    useCallback(() => {
      const loadHistoryFromServer = async () => {
        setLoading(true);
        const serverHistory = await fetchHistory();
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

  return (
    <View className="flex-1 bg-white dark:bg-[#181A20] p-4">
      <FlatList
        data={history}
        // 3. Le keyExtractor utilise maintenant l'ID numérique de la base de données
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <ListItem item={item} onDelete={() => handleDelete(item.id)} />}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-gray-500 text-lg">Aucun historique de scan.</Text>
          </View>
        }
      />
    </View>
  );
}