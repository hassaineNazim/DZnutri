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

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmission = async () => {
    // --- Validation Côté Client ---
    if (!barcode || !imageFrontUrl || !imageIngredientsUrl) {
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
        // Optionnel : rediriger vers la page de login
        // router.push('/auth/login');
        return;
      }

      // On utilise les variables de l'état pour construire les données
      const submissionData = {
        barcode: barcode,
        image_front_url: imageFrontUrl,
        image_ingredients_url: imageIngredientsUrl,
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
        // Vider les champs après succès
        setBarcode('');
        setImageFrontUrl('');
        setImageIngredientsUrl('');
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
        className="bg-gray-100 p-4 rounded-xl mb-8 text-base text-gray-800"
        placeholder="URL de la photo des ingrédients"
        placeholderTextColor="gray"
        value={imageIngredientsUrl}
        onChangeText={setImageIngredientsUrl}
        autoCapitalize="none"
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