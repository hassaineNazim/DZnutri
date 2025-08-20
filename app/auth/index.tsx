import AsyncStorage from '@react-native-async-storage/async-storage';

import * as AuthSession from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import { useRouter } from 'expo-router';
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import {
  AccessToken,
  LoginManager,
  Profile,
  Settings
} from "react-native-fbsdk-next";
import { API_URL } from '../config/api';

import * as WebBrowser from "expo-web-browser";
WebBrowser.maybeCompleteAuthSession();

export default function Login() {
  const router = useRouter();

  const redirectUri = Platform.select({
 
    default: AuthSession.makeRedirectUri(),
  }) as string;

console.log('Redirect URI:', redirectUri);
  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    iosClientId: '899058288095-sav0ru4ncgbluoj3juvsk7bproklf21h.apps.googleusercontent.com',
    androidClientId: '899058288095-f6dhdtvfo45vqg2ffveqk584li5ilq2e.apps.googleusercontent.com',
    webClientId: '899058288095-137a1fct9pf5hql01n3ofqaa25dirnst.apps.googleusercontent.com',
    redirectUri,
  });

  // Facebook Auth
  
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



   useEffect(() => {
    const requestTracking = async () => {
      const { status } = await requestTrackingPermissionsAsync();

      Settings.initializeSDK();

      if (status === "granted") {
        await Settings.setAdvertiserTrackingEnabled(true);
      }
    };

    requestTracking();
  }, []);

  
  /* Trigger the below function on your custom button press */
  const loginWithFacebook = () => {
    LoginManager.logInWithPermissions(["public_profile", "email"]).then(
      function (result) {
        if (result.isCancelled) {
          console.log("==> Login cancelled");
        } else {
          console.log(result);
          AccessToken.getCurrentAccessToken().then((data) => {
            console.log(data);
            getUserFBData();
            if(data?.accessToken)
            handleFacebookResponse(data.accessToken);
          });
        }
      },
      function (error) {
        console.log("==> Login fail with error: " + error);
      }
    );
  };
  
  const handleFacebookResponse = async (accessToken: string) => {
    try {
      const backendResponse = await fetch(`${API_URL}/auth/facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
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
  };

  const getUserFBData = () => {
    Profile.getCurrentProfile().then((currentProfile) => {
      console.log(currentProfile);
    });
  };

  return (
    <View className="flex-1 justify-center bg-white p-6">
      <Text className="text-4xl font-bold text-gray-800 mb-4 text-center">Bienvenue</Text>
      <Text className="text-lg text-gray-500 mb-12 text-center">Connectez-vous pour commencer</Text>
      
      <TouchableOpacity
        disabled={!request || loading}
        onPress={() => {
          promptAsync();
        }}
        className="bg-cyan-500 py-4 rounded-xl flex-row justify-center items-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">Se connecter avec Google</Text>
        )}
      </TouchableOpacity>

      <View className="h-4" />

      <TouchableOpacity
        
        onPress={() => {
         
          loginWithFacebook();
        }}
        className="bg-blue-600 py-4 rounded-xl flex-row justify-center items-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">Se connecter avec Facebook</Text>
        )}
      </TouchableOpacity>

      {error && <Text className="text-center text-red-500 mt-4">{error}</Text>}
    </View>
  );
}