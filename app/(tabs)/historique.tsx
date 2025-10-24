import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import ConfirmModal from '../components/ConfirmModal';
import ListItem from '../components/ListItem';
import { useTranslation } from '../i18n';
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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { t } = useTranslation();
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

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const clearSelection = () => setSelectedIds([]);

  const confirmDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    setConfirmVisible(true);
  };

  const deleteSelected = async () => {
    try {
      // call backend delete for each selected id
      await Promise.all(selectedIds.map(id => deleteFromHistory(id)));
      setHistory(prev => prev.filter(item => !selectedIds.includes(item.id)));
      clearSelection();
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
     
      {selectedIds.length > 0 && (
      <View 
  className="
    flex-row items-center justify-between bg-white dark:bg-neutral-800 
    p-3 rounded-xl mb-3 shadow-md 
    flex-wrap 
  "
>
  
  <Text className="font-semibold text-base text-gray-900 dark:text-gray-100 mb-2 sm:mb-0">
    {selectedIds.length} {t('selected') ?? 'sélectionné(s)'}
  </Text>

  
  <View 
    className="
      flex-row space-x-2 
      flex-wrap 
      justify-end 
      gap-y-2 
    "
  >
    <Pressable
      onPress={() => setSelectedIds(history.map((h) => h.id))}
      className="px-3 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg active:opacity-70"
    >
      <Text className="font-medium text-gray-800 dark:text-gray-200">
        {t('select_all')}
      </Text>
    </Pressable>

    
    <Pressable
      onPress={clearSelection}
      className="px-3 py-2 bg-gray-100 dark:bg-neutral-700 rounded-lg active:opacity-70"
    >
      <Text className="font-medium text-gray-800 dark:text-gray-200">
        {t('deselect_all')}
      </Text>
    </Pressable>

    <Pressable
      onPress={confirmDeleteSelected}
      className="px-3 py-2 bg-red-600 rounded-lg active:opacity-70"
    >
      <Text className="text-white font-medium">{t('confirm')}</Text>
    </Pressable>
  </View>
</View>
      )}
      <FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        // 4. On passe la fonction de navigation au composant ListItem
        renderItem={({ item }) => (
          <ListItem
            item={item}
            onPress={() => {
              if (selectedIds.length > 0) {
                // in selection mode, tap toggles selection
                toggleSelect(item.id);
              } else {
                handleItemPress(item);
              }
            }}
            onLongPress={() => toggleSelect(item.id)}
            selected={selectedIds.includes(item.id)}
          />
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20">
            <Text className="text-gray-500 text-lg">Aucun historique de scan.</Text>
          </View>
        }
      />
      <ConfirmModal
        visible={confirmVisible}
        title={t('confirm_delete_title')}
        message={t('confirm_delete_message')}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={async () => { setConfirmVisible(false); await deleteSelected(); }}
        confirmLabel={t('confirm')}
        cancelLabel={t('cancel')}
      />
    </View>
  );
}