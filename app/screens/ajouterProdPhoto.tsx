import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { API_URL } from '../config/api';

export default function AjouterProduitPhotoPage() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    barcode: string;
    type: string;
    productName: string;
    brand: string;
  }>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageIngredientsUri, setImageIngredientsUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // CORRECTION 1 : La fonction pour prendre une photo a maintenant un paramètre
  // pour savoir quel état mettre à jour (photo avant OU photo ingrédients).
  const takePhoto = async (setImageToUpdate: (uri: string) => void) => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("La permission d'utiliser la caméra est requise !");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7,
    });

    if (!result.canceled) {
      setImageToUpdate(result.assets[0].uri);
    }
  };

  const handleSubmission = async () => {
    if (!imageUri || !imageIngredientsUri) {
      Alert.alert('Erreur', 'Veuillez prendre les deux photos du produit.');
      return;
    }
    setLoading(true);

    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) throw new Error('Utilisateur non connecté.');

      const formData = new FormData();
      formData.append('barcode', params.barcode as string);
      formData.append('typeProduct', params.type as string);
      formData.append('productName', params.productName as string);
      formData.append('brand', params.brand as string);

      formData.append('image_front', {
        uri: imageUri,
        name: `front_${params.barcode}.jpg`,
        type: 'image/jpeg',
      } as any);
      
      formData.append('image_ingredients', {
        uri: imageIngredientsUri,
        name: `ingredients_${params.barcode}.jpg`,
        type: 'image/jpeg',
      } as any);

      const response = await fetch(`${API_URL}/api/submission`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${userToken}` },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur du serveur');
      }

      Alert.alert('Succès !', 'Produit soumis pour validation. Merci !', [
        {
          text: 'OK',
          onPress: () => router.replace('../scanner'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photos du produit</Text>
      
      {/* --- CORRECTION 2 : Logique d'affichage des boutons --- */}

      {/* Affiche le bouton pour la photo de l'avant */}
      {!imageUri && (
        <TouchableOpacity style={styles.button} onPress={() => takePhoto(setImageUri)}>
          <Text style={styles.buttonText}>1. Prendre une photo de l'avant</Text>
        </TouchableOpacity>
      )}

      {/* Affiche l'image de l'avant si elle a été prise */}
      {imageUri && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Photo de l'avant :</Text>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
        </View>
      )}
      
      {/* Affiche le bouton pour la photo des ingrédients, seulement si la première a été prise */}
      {imageUri && !imageIngredientsUri && (
         <TouchableOpacity style={styles.button} onPress={() => takePhoto(setImageIngredientsUri)}>
           <Text style={styles.buttonText}>2. Prendre une photo des ingrédients</Text>
         </TouchableOpacity>
      )}

      {/* Affiche l'image des ingrédients si elle a été prise */}
      {imageIngredientsUri && (
        <View style={styles.imageContainer}>
          <Text style={styles.imageLabel}>Photo des ingrédients :</Text>
          <Image source={{ uri: imageIngredientsUri }} style={styles.imagePreview} />
        </View>
      )}

      {/* Le bouton de soumission n'apparaît que si LES DEUX photos sont prises */}
      {imageUri && imageIngredientsUri && (
        <TouchableOpacity 
            style={[styles.button, {backgroundColor: '#16A34A'}]} 
            onPress={handleSubmission} 
            disabled={loading}>
          <Text style={styles.buttonText}>Soumettre le produit</Text>
        </TouchableOpacity>
      )}

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
    </View>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
  },
  imageContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  imageLabel: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 8,
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  button: {
    backgroundColor: '#84CC16',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});