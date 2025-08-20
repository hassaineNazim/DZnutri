import {
  Animated,
  Image,
  PanResponder,
  Text,
  TouchableOpacity,
  View
} from "react-native";

import { useRef } from "react";

/**
 * ListItem component that displays an item with swipe-to-delete functionality.
 * @param {Object} props - The component props.
 * @param {Object} props.item - The item to display.
 * @param {Function} props.onDelete - Callback function to handle item deletion.
 */
export type ListItemProps = {
  item: {
    id: string;
    product_name: string;
    nutrition_grades: string;
    brands?: string;
    image_url?: string;
  };
  onDelete: (id: string) => void;
};

export default function ListItem({ item, onDelete }: ListItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const borderRadius = translateX.interpolate({
    inputRange: [-100, 0],
    outputRange: [0, 8], // 8 is equivalent to rounded-lg
    extrapolate: 'clamp'
  });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          Animated.spring(translateX, {
            toValue: -100,
            useNativeDriver: true,
          }).start();
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;



  return (
    <View  className="flex-row items-center">
      <Animated.View
        style={{
          flex: 1,
          transform: [{ translateX: translateX }],
        }}
      >
        <View  {...panResponder.panHandlers}>
  <Animated.View  className="flex-row items-center bg-gray-200 dark:bg-neutral-800  shadow-md  p-3 mb-2  h-[91px] rounded-l-lg " style={{ borderTopRightRadius: borderRadius,
              borderBottomRightRadius: borderRadius,}}>
          <TouchableOpacity className="flex-row items-center w-full   ">
            {item.image_url && (
              <Image source={{ uri: item.image_url }} className="w-20 h-20 mr-2 rounded-lg" />
            )}
            <View >
              <Text className="text-black dark:text-white font-semibold" >{item.product_name} </Text>
              <Text className="text-gray-500" >{item.brands}</Text>
            </View>
            <View className={item.nutrition_grades === "a" ? "bg-green-500 ml-auto rounded-md " : item.nutrition_grades === "b" ? "bg-yellow-500 ml-auto rounded-md" : "bg-red-500 ml-auto rounded-md"}  >
            <Text className="text-slate-100 py-1 px-2 font-bold" >{item.nutrition_grades !== null && item.nutrition_grades !== undefined ? item.nutrition_grades.toUpperCase() : 'N/A'}</Text>
            </View>
            
          </TouchableOpacity>
          </Animated.View>
        
        </View>
        <TouchableOpacity
         
            className="absolute right-[-100px] h-[91px] w-[100px] bg-red-500 justify-center size-auto items-center rounded-r-lg  p-3 mb-2"
          onPress={() => onDelete(item.id)}
        >
          <Text className="text-white font-bold">Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

