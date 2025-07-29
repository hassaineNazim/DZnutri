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
        setHistory(JSON.parse(saved));
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
    const updatedData = history.filter((item) => item.id !== id);
    setHistory(updatedData);
    AsyncStorage.setItem('scanHistory', JSON.stringify(updatedData))
   
  };

  const renderItem = ({ item }) => (
    <ListItem item={item} onDelete={handleDeleteItem} />
  );


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

        keyExtractor={(item) => item.code}
        renderItem={renderItem}
        
      />
     
      
     

      
    </View>
  );
}




