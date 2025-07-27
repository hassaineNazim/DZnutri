import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Image, Text, TouchableOpacity, View } from "react-native";
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

const clearHistory = async () => {
    await AsyncStorage.removeItem('scanHistory');
    setHistory([]);
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#181A20] p-4">
      
      <TouchableOpacity onPress={clearHistory} className="bg-red-500 p-2 rounded mb-4"> 
        <Text className="text-white">Clear History</Text >
      </TouchableOpacity>
     

      <FlatList 
        data={history}
        keyExtractor={(item) => item.code}
        renderItem={({ item }) => (
          <TouchableOpacity className=" flex-row items-center bg-gray-200 dark:bg-neutral-800 rounded-lg shadow-md size-auto p-3 mb-2  ">
            {item.image_url && (
              <Image source={{ uri: item.image_url }} className="w-20 h-20 mr-2 rounded-lg" />
            )}
            <View >
              <Text className="text-black dark:text-white font-semibold" >{item.product_name} </Text>
              <Text className="text-gray-500" >{item.brands}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}




