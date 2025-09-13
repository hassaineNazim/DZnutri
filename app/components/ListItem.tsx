import React, { useRef } from "react";
import {
  Animated,
  Image,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

export type ListItemProps = {
  item: {
    id: number;
    product_name?: string;
    nutrition_grades?: string; 
    brands?: string;
    image_url?: string;
    custom_score?: number;
  };
  onDelete: (id: number) => void; 
};

export default function ListItem({ item, onDelete }: ListItemProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const borderRadius = translateX.interpolate({
    inputRange: [-100, 0],
    outputRange: [0, 12],
    extrapolate: 'clamp'
  });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dx) > 5,
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

  // --- Gestion du mode sombre ---
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // --- Styles dynamiques ---
  const getNutriScoreStyle = (grade?: string) => {
    switch (grade?.toLowerCase()) {
      case 'a':
        return styles.nutriScoreA;
      case 'b':
        return styles.nutriScoreB;
      case 'c':
        return styles.nutriScoreC;
      case 'd':
        return styles.nutriScoreD;
      case 'e':
        return styles.nutriScoreE;
      default:
        return styles.nutriScoreDefault;
    }
  };

  const containerStyle = isDarkMode ? styles.itemContainerDark : styles.itemContainerLight;
  const textStyle = isDarkMode ? styles.textDark : styles.textLight;
  const subTextStyle = isDarkMode ? styles.subTextDark : styles.subTextLight;

  return (
    <View style={styles.swipeContainer}>
      <Animated.View style={{ transform: [{ translateX }] }}>
        <View {...panResponder.panHandlers}>
          <Animated.View 
            style={[
              styles.itemContainer, 
              containerStyle,
              { 
                borderTopRightRadius: borderRadius,
                borderBottomRightRadius: borderRadius,
              }
            ]}
          >
            <TouchableOpacity style={styles.touchableContent}>
              {item.image_url && (
                <Image source={{ uri: item.image_url }} style={styles.image} />
              )}
              <View style={styles.textContainer}>
                <Text style={[styles.productName, textStyle]} numberOfLines={1}>{item.product_name}</Text>
                <Text style={[styles.brandName, subTextStyle]}>{item.brands}</Text>
              </View>
              <View style={[styles.nutriScoreBadge, getNutriScoreStyle(item.nutrition_grades)]}>
                <Text style={styles.nutriScoreText}>
                  {item.nutrition_grades?.toUpperCase() || 'N/A'}
                </Text>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  swipeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    height: 91,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  itemContainerLight: {
    backgroundColor: '#F3F4F6', // gray-100
  },
  itemContainerDark: {
    backgroundColor: '#3F3F46', // neutral-700
  },
  touchableContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  image: {
    width: 68,
    height: 68,
    marginRight: 12,
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
  },
  brandName: {
    fontSize: 14,
  },
  textLight: {
    color: '#1F2937', // gray-800
  },
  textDark: {
    color: 'white',
  },
  subTextLight: {
    color: '#6B7280', // gray-500
  },
  subTextDark: {
    color: '#D1D5DB', // gray-300
  },
  nutriScoreBadge: {
    marginLeft: 'auto',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nutriScoreText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  nutriScoreA: { backgroundColor: '#059669' }, // green-600
  nutriScoreB: { backgroundColor: '#84CC16' }, // lime-500
  nutriScoreC: { backgroundColor: '#F97316' }, // orange-500
  nutriScoreD: { backgroundColor: '#EF4444' }, // red-500
  nutriScoreE: { backgroundColor: '#DC2626' }, // red-600
  nutriScoreDefault: { backgroundColor: '#6B7280' }, // gray-500
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 100,
    backgroundColor: '#EF4444', // red-500
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
  },
  deleteButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});