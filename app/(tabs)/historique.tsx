import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Text, TouchableOpacity, View } from "react-native";
import ListItem from "../components/ListItem";

export default function Reco() {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    
    const loadHistory = async () => {
  const saved = await AsyncStorage.getItem('scanHistory');
  if (saved) {
    try {
      const parsedData = JSON.parse(saved);
      // Filter out any null, undefined, or invalid entries
      const cleanData = parsedData.filter(item => item && item.code);
      setHistory(cleanData);
    } catch (e) {
      // If JSON is corrupted, start with a fresh history
      console.error("Failed to parse history, clearing it.", e);
      setHistory([]);
      await AsyncStorage.removeItem('scanHistory');
    }
  } else {
    setHistory([]);
  }
};
    loadHistory();
  }, []);

useFocusEffect(
  useCallback(() => {
    const loadHistory = async () => {
      const saved = await AsyncStorage.getItem('scanHistory');
      
      if (saved) setHistory(JSON.parse(saved));
      else setHistory([]);
    };

    loadHistory();
  }, [])
);


 const handleDeleteItem = (id) => {
    const updatedData = history.filter((item) => item?.id !== id);
    setHistory(updatedData);
    AsyncStorage.setItem('scanHistory', JSON.stringify(updatedData))
   
  };

  const renderItem = ({ item }) => {
  // If the item is somehow invalid, don't render anything for it.
  if (!item) {
    return null;
  }
  return <ListItem item={item} onDelete={handleDeleteItem} />;
};


const clearHistory = async () => {
    await AsyncStorage.removeItem('scanHistory');
    setHistory([]);
  };

  return (
    <View className="flex-auto bg-white dark:bg-[#181A20] p-4">


      <FlatList
        data={history}
        

        ListEmptyComponent={
            <View className="flex-1 items-center justify-center">
              <Text className="text-gray-500">Aucun historique trouvé</Text>
            </View>
          
        }

ListFooterComponent={() => (
    history.length > 5 ? (
      <View className="h-32">
        <TouchableOpacity 
          onPress={clearHistory} 
          className="bg-red-500 p-2 rounded mb-4"
        > 
          <Text className="text-center text-white font-medium">
            Clear History
          </Text>
        </TouchableOpacity>
      </View>
    ) : null
  )}

        keyExtractor={(item, index) => item?.code || index.toString()}
        renderItem={renderItem}
        
      />
     
      
     

      
    </View>
  );
}




