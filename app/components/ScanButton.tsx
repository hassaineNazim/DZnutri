import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet } from 'react-native';

export function ScanButton() {
  const router = useRouter();

  const handlePress = () => {
    router.push('/scanner'); 
  };

  return (
    <Pressable onPress={handlePress} style={styles.button}>
      <Ionicons name="scan-outline" size={30} color="white" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'lightgreen', 
    justifyContent: 'center',
    alignItems: 'center',
    
  },
});