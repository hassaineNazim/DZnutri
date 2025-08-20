import { AntDesign } from "@expo/vector-icons";
import React, { useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, View, Pressable } from 'react-native';

// Les types restent les mêmes
type OptionItem = {
  value: string;
  label: string;
};

interface DropDownProps {
  data: OptionItem[];
  onChange: (item: OptionItem) => void;
  placeholder: string;
}

export default function Dropdown({ data, onChange, placeholder }: DropDownProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedValue, setSelectedValue] = useState<OptionItem | null>(null);

  // La logique de sélection ne change pas
  const onSelect = (item: OptionItem) => {
    setSelectedValue(item);
    onChange(item);
    setExpanded(false);
  };

  // La couleur de l'icône et du texte du placeholder
  const placeholderColor = "#9CA3AF"; // Un gris standard (gray-400)

  return (
    <View>
      {/* Le bouton qui affiche la valeur sélectionnée */}
      <TouchableOpacity
        onPress={() => setExpanded(true)} // Ouvre simplement le Modal
        className="border border-gray-300 dark:border-gray-600 p-4 rounded-lg flex-row justify-between items-center"
        activeOpacity={0.7}
      >
        <Text className="text-base text-gray-900 dark:text-gray-100">
          {selectedValue ? selectedValue.label : placeholder}
        </Text>
        <AntDesign name="down" size={16} color={placeholderColor} />
      </TouchableOpacity>

      {/* Le Modal qui contient la liste des options */}
      <Modal visible={expanded} transparent animationType="fade">
        {/* Le fond transparent cliquable pour fermer le Modal */}
        <Pressable className="flex-1" onPress={() => setExpanded(false)}>
          <View 
            // On utilise des marges pour positionner la liste au lieu de calculs complexes
            className="mx-4 mt-20 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
          >
            <FlatList
              data={data}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity onPress={() => onSelect(item)} className="p-4">
                  <Text className="text-base text-gray-900 dark:text-gray-100">{item.label}</Text>
                </TouchableOpacity>
              )}
              // Ajoute une ligne de séparation entre les éléments
              ItemSeparatorComponent={() => <View className="h-px bg-gray-200 dark:bg-gray-700" />}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}