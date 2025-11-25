import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { CheckSquare, Trash2, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import ConfirmModal from '../components/ConfirmModal';
import ListItem from '../components/ListItem';
import { useTranslation } from '../i18n';
import { deleteFromHistory, fetchHistory } from '../services/saveHistorique';

type Product = {
  id: number;
  brands?: string;
  brand?: string;
  product_name?: string;
  image_url?: string;
  custom_score?: number;
  nutrition_grades?: string;
  scanned_at?: string | null;
};

export default function HistoriquePage() {
  const [history, setHistory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      await Promise.all(selectedIds.map(id => deleteFromHistory(id)));
      setHistory(prev => prev.filter(item => !selectedIds.includes(item.id)));
      clearSelection();
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemPress = (product: Product) => {
    router.push({
      pathname: '../screens/productDetail',
      params: { product: JSON.stringify(product) },
    });
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 dark:bg-[#181A20]">
        <ActivityIndicator size="large" color="#84CC16" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 dark:bg-[#181A20]">

      {/* Header / Selection Bar */}
      {selectedIds.length > 0 ? (
        <Animated.View
          entering={FadeInDown.duration(300)}
          layout={Layout.springify()}
          className="absolute top-4 left-4 right-4 z-10 bg-white dark:bg-[#1F2937] rounded-2xl shadow-lg p-4 flex-row items-center justify-between"
        >
          <View className="flex-row items-center space-x-3">
            <Pressable onPress={clearSelection} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
              <X size={20} color={isDark ? "#D1D5DB" : "#4B5563"} />
            </Pressable>
            <Text className="text-lg font-bold text-gray-900 dark:text-white">
              {selectedIds.length} {t('selected') || 'sélectionné(s)'}
            </Text>
          </View>

          <View className="flex-row items-center space-x-2">
            <Pressable
              onPress={() => setSelectedIds(history.map(h => h.id))}
              className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full mr-2"
            >
              <CheckSquare size={20} color={isDark ? "#D1D5DB" : "#4B5563"} />
            </Pressable>
            <Pressable
              onPress={confirmDeleteSelected}
              className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"
            >
              <Trash2 size={20} color={isDark ? "#F87171" : "#DC2626"} />
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <View className="px-6 pt-6 pb-2">
          <Text className="text-3xl font-bold text-gray-900 dark:text-white">
            {t('history') || "Historique"}
          </Text>
          <Text className="text-base text-gray-500 dark:text-gray-400 mt-1">
            {t('history_subtitle')}
          </Text>
        </View>
      )}

      <Animated.FlatList
        data={history}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16, paddingTop: selectedIds.length > 0 ? 80 : 16 }}
        itemLayoutAnimation={Layout.springify()}
        renderItem={({ item, index }) => (
          <Animated.View
            entering={FadeInDown.delay(index * 50).springify()}
            layout={Layout.springify()}
          >
            <ListItem
              item={item}
              onPress={() => {
                if (selectedIds.length > 0) {
                  toggleSelect(item.id);
                } else {
                  handleItemPress(item);
                }
              }}
              onLongPress={() => toggleSelect(item.id)}
              selected={selectedIds.includes(item.id)}
            />
          </Animated.View>
        )}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-20 opacity-50">
            <Trash2 size={64} color="#9CA3AF" />
            <Text className="text-gray-500 text-lg mt-4 text-center">
              {t('history_empty')}
            </Text>
          </View>
        }
      />

      <ConfirmModal
        visible={confirmVisible}
        title={t('confirm_delete_title') || "Supprimer ?"}
        message={t('confirm_delete_message') || "Voulez-vous vraiment supprimer ces éléments ?"}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={async () => { setConfirmVisible(false); await deleteSelected(); }}
        confirmLabel={t('confirm') || "Supprimer"}
        cancelLabel={t('cancel') || "Annuler"}
      />
    </View>
  );
}