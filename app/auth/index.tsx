import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from "@react-native-google-signin/google-signin";
import { useRouter } from 'expo-router';
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import React, { useEffect, useState } from 'react';

import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import {
  AccessToken,
  LoginManager,
  Profile,
  Settings
} from "react-native-fbsdk-next";
import { API_URL } from '../config/api';
import { useTranslation } from '../i18n';
import { registerForPushAndSendToServer } from '../services/PushNotif';

export default function Login() {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Initialize GoogleSignin and request tracking on component mount
    const initializeAuth = async () => {
      try {
        console.log('[auth] Configuring GoogleSignin...');
        await GoogleSignin.configure({
          iosClientId: '899058288095-sav0ru4ncgbluoj3juvsk7bproklf21h.apps.googleusercontent.com',
          webClientId: '899058288095-137a1fct9pf5hql01n3ofqaa25dirnst.apps.googleusercontent.com',
          offlineAccess: true,
          forceCodeForRefreshToken: true,
        });
        console.log('[auth] GoogleSignin configured successfully');
      } catch (e) {
        console.error('[auth] Failed to configure GoogleSignin:', e);
      }

      try {
        const { status } = await requestTrackingPermissionsAsync();
        Settings.initializeSDK();
        if (status === "granted") {
          await Settings.setAdvertiserTrackingEnabled(true);
        }
      } catch (e) {
        console.warn('[auth] Tracking permission error:', e);
      }
    };

    initializeAuth();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
    
      await GoogleSignin.hasPlayServices();
      
      
      const userInfo = await GoogleSignin.signIn();
     
      
      if (isSuccessResponse(userInfo)) {
        // idToken is in user field for GoogleSignin library
        const idToken = (userInfo as any).data?.idToken;
        console.log('[auth] Extracted idToken:', idToken);
        if (!idToken) {
          console.error('[auth] No idToken found in userInfo');
          setError('Erreur : Token non trouvé');
          setLoading(false);
          return;
        }
        
        try {
          console.log('[auth] attempting POST to', `${API_URL}/auth/google`);
          const backendResponse = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: idToken }),
          });
          
          let data;
          try {
            data = await backendResponse.json();
          } catch (jsonErr) {
            console.warn('[auth] failed to parse JSON from /auth/google', jsonErr);
            data = null;
          }

          console.log('[auth] /auth/google status=', backendResponse.status, 'body=', data);

          if (backendResponse.ok && data?.access_token) {
            await AsyncStorage.setItem('userToken', data.access_token);
            console.log('[auth] Token stored, registering for push...');
            await registerForPushAndSendToServer();
            console.log('[auth] Push registered, navigating...');
            router.replace('/(tabs)/historique');
          } else {
            setError(`Erreur du serveur : ${data?.detail || 'Authentification échouée'}`);
          }
        } catch (e) {
          console.error('[auth] Google auth error:', e);
          setError("Erreur : Impossible de contacter le backend.");
        }
      }
    } catch (error) {
      console.error('[auth] Full error object:', error);
      console.error('[auth] Error type:', typeof error);
      console.error('[auth] Error constructor:', (error as any)?.constructor?.name);
      
      if (isErrorWithCode(error)) {
        const code = (error as any).code;
        console.log('[auth] Error has code:', code);
        switch (code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log('User cancelled the login flow');
            setError('Connexion annulée');
            break;
          case statusCodes.IN_PROGRESS:
            console.log('Sign in is in progress already');
            setError('Connexion en cours...');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            console.error('Google Play Services not available');
            setError('Google Play Services non disponibles');
            break;
          case statusCodes.SIGN_IN_REQUIRED:
            console.error('Sign in required');
            setError('Connexion requise');
            break;
          default:
            console.log('[auth] Unknown error code:', code);
            setError(`Erreur Google: ${code}`);
        }
      } else if (error instanceof Error) {
        console.error('[auth] Google Sign-In error message:', error.message);
        setError(error.message || 'Erreur lors de la connexion Google');
      } else {
        console.error('[auth] Unknown error type:', JSON.stringify(error));
        setError('Erreur inconnue lors de la connexion Google');
      }
    } finally {
      setLoading(false);
    }
  };

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
      setLoading(true);
      setError(null);
      console.log('[auth] attempting POST to', `${API_URL}/auth/facebook`);
      const backendResponse = await fetch(`${API_URL}/auth/facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      });

      let data;
      try {
        data = await backendResponse.json();
      } catch (jsonErr) {
        console.warn('[auth] failed to parse JSON from /auth/facebook', jsonErr);
        data = null;
      }

      console.log('[auth] /auth/facebook status=', backendResponse.status, 'body=', data);

      if (backendResponse.ok && data?.access_token) {
        await AsyncStorage.setItem('userToken', data.access_token);
        console.log('[auth] Token stored, registering for push...');
        await registerForPushAndSendToServer();
        console.log('[auth] Push registered, navigating...');
        router.replace('/(tabs)/historique');
      } else {
        setError(`Erreur du serveur : ${data?.detail || 'Authentification échouée'}`);
      }
    } catch (e) {
      console.error('[auth] Facebook auth error:', e);
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
      <Text className="text-4xl font-bold text-gray-800 mb-4 text-center">{t('welcome')}</Text>
      <Text className="text-lg text-gray-500 mb-12 text-center">{t('connect')}</Text>
      
      <TouchableOpacity
        disabled={loading}
        onPress={handleGoogleSignIn}
        className="bg-cyan-500 py-4 rounded-xl flex-row justify-center items-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">{t('signin_google')}</Text>
        )}
      </TouchableOpacity>

      <View className="h-4" />

      <TouchableOpacity
        disabled={loading}
        onPress={loginWithFacebook}
        className="bg-blue-600 py-4 rounded-xl flex-row justify-center items-center"
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text className="text-white text-lg font-bold">{t('signin_facebook')}</Text>
        )}
      </TouchableOpacity>

      {error && <Text className="text-center text-red-500 mt-4">{error}</Text>}
    </View>
  );
}