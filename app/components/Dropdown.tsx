import { AntDesign } from "@expo/vector-icons";

import React, { useRef, useState } from 'react';
import { FlatList, Modal, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';


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
  const [dropdownTop, setDropdownTop] = useState(0);
  const buttonRef = useRef<TouchableOpacity>(null);

  const toggleExpanded = () => {
    if (buttonRef.current) {
      buttonRef.current.measure((_fx, _fy, _width, height, _px, pageY) => {
        setDropdownTop(pageY + height);
      });
    }
    setExpanded(!expanded);
  };


  const onSelect = (item: OptionItem) => {
    setSelectedValue(item);
    onChange(item);
    setExpanded(false);
  };


  return (
    <View>
      <TouchableOpacity
        ref={buttonRef}
        onPress={toggleExpanded}
        className="flex-1"
        activeOpacity={0.7}
      >
        <View className="flex-row items-center justify-end space-x-2">
          <Text className="text-base text-gray-500 dark:text-gray-400">
            {selectedValue ? selectedValue.label : placeholder}
          </Text>
          <AntDesign name={expanded ? "up" : "down"} size={16} className="text-gray-400" />
        </View>
      </TouchableOpacity>

      <Modal visible={expanded} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setExpanded(false)}>
          <View className="flex-1">
            <View
              style={{ top: dropdownTop }}
              className="absolute mx-4 right-0 left-0 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700"
            >
              <FlatList
                data={data}
                keyExtractor={(item) => item.value}
                renderItem={({ item }) => (
                  <TouchableOpacity onPress={() => onSelect(item)} className="p-4">
                    <Text className="text-base text-gray-900 dark:text-gray-100">{item.label}</Text>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View className="h-px bg-gray-200 dark:bg-gray-700" />}
              />
            </View>
          </View>
        </TouchableWithoutFeedback>

      </Modal>
    </View>
  );
}