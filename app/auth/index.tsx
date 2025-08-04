import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../config/api';

import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();
  // La correction est sur la ligne suivante
  const [request, response, promptAsync] = Google.useAuthRequest({
    iosClientId: "899058288095-sav0ru4ncgbluoj3juvsk7bproklf21h.apps.googleusercontent.com",
    androidClientId: "899058288095-f6dhdtvfo45vqg2ffveqk584li5ilq2e.apps.googleusercontent.com",
    webClientId: "899058288095-137a1fct9pf5hql01n3ofqaa25dirnst.apps.googleusercontent.com",
    scopes: ['profile', 'email'],
    responseType: 'id_token',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleAuthResponse = async () => {
      if (response?.type) {
        setLoading(true);
        setError(null);
      }

      if (response?.type === 'success') {
        const { id_token } = response.params;
        // --- AJOUTEZ CETTE LIGNE DE DÉBOGAGE ---
        console.log("Réponse complète de Google:", JSON.stringify(response, null, 2));
        // ------------------------------------
        
        try {
          const backendResponse = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token }),
          });
          
          const data = await backendResponse.json(); 

          if (backendResponse.ok) {
            await AsyncStorage.setItem('userToken', data.access_token);
            router.replace('/(tabs)/historique');
          } else {
            setError(`Erreur du serveur : ${data.detail || 'Authentification échouée'}`);
          }
        } catch (e) {
          setError("Erreur : Impossible de contacter le backend.");
        } finally {
          setLoading(false);
        }
      } else if (response?.type === 'error') {
        setError("La connexion avec Google a échoué.");
        setLoading(false);
      }
    };

    handleAuthResponse();
  }, [response]);

  return (
    <View className="flex-1 justify-center bg-white p-6">
      <Text className="text-4xl font-bold text-gray-800 mb-4 text-center">Bienvenue</Text>
      <Text className="text-lg text-gray-500 mb-12 text-center">Connectez-vous pour commencer</Text>
      
      <TouchableOpacity
        disabled={!request || loading}
        onPress={() => {
          promptAsync();
        }}
        className="bg-lime-500 py-4 rounded-xl flex-row justify-center items-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">Se connecter avec Google</Text>
        )}
      </TouchableOpacity>

      {error && <Text className="text-center text-red-500 mt-4">{error}</Text>}
    </View>
  );
}