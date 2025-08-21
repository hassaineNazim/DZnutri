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
import { API_URL } from '../config/api'; // Adaptez le chemin si nécessaire

export default function AjouterProduitPhotoPage() {
  const router = useRouter();
  // On récupère TOUTES les infos des pages précédentes
  const params = useLocalSearchParams<{
    barcode: string;
    type: string;
    productName: string;
    brand: string;
  }>();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fonction pour ouvrir la caméra
  const takePhoto = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("La permission d'utiliser la caméra est requise !");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.7, // Compresse l'image pour un envoi plus rapide
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  // Fonction pour tout envoyer au backend
  const handleSubmission = async () => {
    if (!imageUri) {
      Alert.alert('Erreur', 'Veuillez prendre une photo du produit.');
      return;
    }
    setLoading(true);

    try {
      const userToken = await AsyncStorage.getItem('userToken');
      if (!userToken) {
        throw new Error('Utilisateur non connecté.');
      }

      // On crée un objet FormData pour envoyer le fichier et les données
      const formData = new FormData();

      // On ajoute les données texte reçues en paramètres
      formData.append('barcode', params.barcode as string);
      formData.append('typeProduct', params.type as string);
      formData.append('productName', params.productName as string);
      formData.append('brand', params.brand as string);

      // On ajoute le fichier image
      formData.append('image_front', {
        uri: imageUri,
        name: `photo_${params.barcode}.jpg`,
        type: 'image/jpeg',
      } as any);

      const response = await fetch(`${API_URL}/api/submission`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${userToken}`
          // On ne met PAS 'Content-Type', la bibliothèque s'en charge pour FormData
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erreur du serveur');
      }

      Alert.alert('Succès !', 'Produit soumis pour validation. Merci de votre participation !', [
        {
          text: 'OK',
          // On redirige l'utilisateur vers le scanner après le succès
          onPress: () => router.replace('./app/scanner'),
        },
      ]);
    } catch (error) {
      Alert.alert('Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Photo du produit</Text>
      <Text style={styles.subtitle}>
        Prenez une photo claire de l'avant du produit.
      </Text>

      {/* Affiche le bouton "Prendre une photo" OU l'image et le bouton "Soumettre" */}
      {!imageUri ? (
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Text style={styles.buttonText}>Ouvrir la caméra</Text>
        </TouchableOpacity>
      ) : (
        <>
          <Image source={{ uri: imageUri }} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.button}
            onPress={handleSubmission}
            disabled={loading}
          >
            <Text style={styles.buttonText}>Soumettre le produit</Text>
          </TouchableOpacity>
        </>
      )}

      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
    </View>
  );
}

// Styles pour un design propre
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
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },
  imagePreview: {
    width: 250,
    height: 250,
    borderRadius: 12,
    marginBottom: 32,
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