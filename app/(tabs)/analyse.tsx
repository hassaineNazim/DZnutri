<<<<<<< HEAD
export default function AnalysePage () {}
=======
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { API_URL } from '../config/api';

export default function SubmissionPage() {
  const [barcode, setBarcode] = useState('');
  const [imageFrontUrl, setImageFrontUrl] = useState('');
  const [imageIngredientsUrl, setImageIngredientsUrl] = useState('');
  const [typeProduct, setTypeProduct] = useState(''); // 1. AJOUT DE L'ÉTAT

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmission = async () => {
    // Validation incluant le nouveau champ
    if (!barcode || !imageFrontUrl || !imageIngredientsUrl || !typeProduct) {
      setMessage('Erreur : Tous les champs sont obligatoires.');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const userToken = await AsyncStorage.getItem('userToken');

      if (!userToken) {
        setMessage('Erreur : Vous devez être connecté pour soumettre un produit.');
        setLoading(false);
        return;
      }

      // 2. AJOUT DU CHAMP DANS LES DONNÉES ENVOYÉES
      const submissionData = {
        barcode: barcode,
        image_front_url: imageFrontUrl,
        image_ingredients_url: imageIngredientsUrl,
        typeProduct: typeProduct,
      };

      const response = await fetch(`${API_URL}/api/submission`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userToken}`,
        },
        body: JSON.stringify(submissionData),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert(
          'Merci !',
          'Produit soumis avec succès pour validation.',
        );
        // Vider tous les champs après succès
        setBarcode('');
        setImageFrontUrl('');
        setImageIngredientsUrl('');
        setTypeProduct('');
      } else {
        setMessage(`Erreur serveur : ${data.detail || 'Une erreur est survenue.'}`);
      }
    } catch (error) {
      setMessage('Erreur : Impossible de contacter le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 justify-center bg-white p-6">
      <Text className="text-3xl font-bold text-gray-800 mb-8">
        Ajouter un produit
      </Text>

      <TextInput
        className="bg-gray-100 p-4 rounded-xl mb-4 text-base text-gray-800"
        placeholder="Code-barres"
        placeholderTextColor="gray"
        value={barcode}
        onChangeText={setBarcode}
        autoCapitalize="none"
        keyboardType="numeric"
      />

      <TextInput
        className="bg-gray-100 p-4 rounded-xl mb-4 text-base text-gray-800"
        placeholder="URL de la photo de l'avant"
        placeholderTextColor="gray"
        value={imageFrontUrl}
        onChangeText={setImageFrontUrl}
        autoCapitalize="none"
      />

      <TextInput
        className="bg-gray-100 p-4 rounded-xl mb-4 text-base text-gray-800"
        placeholder="URL de la photo des ingrédients"
        placeholderTextColor="gray"
        value={imageIngredientsUrl}
        onChangeText={setImageIngredientsUrl}
        autoCapitalize="none"
      />
      
      {/* 3. AJOUT DU CHAMP DE SAISIE */}
      <TextInput
        className="bg-gray-100 p-4 rounded-xl mb-8 text-base text-gray-800"
        placeholder="Type de produit (ex: boisson, biscuit...)"
        placeholderTextColor="gray"
        value={typeProduct}
        onChangeText={setTypeProduct}
        autoCapitalize="sentences"
      />

      {message ? (
        <Text
          className={`text-center mb-4 ${
            message.includes('Erreur') ? 'text-red-500' : 'text-green-500'
          }`}
        >
          {message}
        </Text>
      ) : null}

      <TouchableOpacity
        onPress={handleSubmission}
        disabled={loading}
        className="bg-lime-500 py-4 rounded-xl flex-row justify-center items-center"
      >
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">
            Soumettre le produit
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
>>>>>>> 1548a302fa01d99e5e0bbf3823f52bbce6957942
