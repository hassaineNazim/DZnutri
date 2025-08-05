import AsyncStorage from '@react-native-async-storage/async-storage';
// 1. On importe la fonction 'makeRedirectUri'
import { makeRedirectUri } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { API_URL } from '../config/api';

import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();

  // 2. On crée l'URL de redirection en activant le proxy.
  // C'est la méthode moderne et recommandée par Expo.
  const redirectUri = makeRedirectUri();

  // 3. On utilise le hook "useIdTokenAuthRequest". Il est fait pour ça.
  // Notez que pour le web, le paramètre s'appelle "clientId" et non "webClientId".
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    clientId: "899058288095-137a1fct9pf5hql01n3ofqaa25dirnst.apps.googleusercontent.com",
    iosClientId: "899058288095-sav0ru4ncgbluoj3juvsk7bproklf21h.apps.googleusercontent.com",
    androidClientId: "899058288095-f6dhdtvfo45vqg2ffveqk584li5ilq2e.apps.googleusercontent.com",
    redirectUri: redirectUri, // On passe l'URL créée juste au-dessus
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
        // Avec useIdTokenAuthRequest, le token est directement dans les params
        const { id_token } = response.params;
        
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
        className="bg-purple-500 py-4 rounded-xl flex-row justify-center items-center"
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