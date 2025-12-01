import { FontAwesome } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from "@react-native-google-signin/google-signin";
import { useRouter } from 'expo-router';
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import { AccessToken, LoginManager, Settings } from "react-native-fbsdk-next";
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { API_URL } from '../config/api';
import { useTranslation } from '../i18n';
import { registerForPushAndSendToServer } from '../services/PushNotif';

const { width } = Dimensions.get('window');

export default function Login() {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await GoogleSignin.configure({
          iosClientId: '899058288095-sav0ru4ncgbluoj3juvsk7bproklf21h.apps.googleusercontent.com',
          webClientId: '899058288095-137a1fct9pf5hql01n3ofqaa25dirnst.apps.googleusercontent.com',
          offlineAccess: true,
          forceCodeForRefreshToken: true,
        });
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
        const idToken = (userInfo as any).data?.idToken;
        if (!idToken) {
          setError('Erreur : Token non trouvé');
          setLoading(false);
          return;
        }

        try {
          const backendResponse = await fetch(`${API_URL}/auth/google`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_token: idToken }),
          });

          const data = await backendResponse.json();

          if (backendResponse.ok && data?.access_token) {
            await AsyncStorage.setItem('userToken', data.access_token);
            await registerForPushAndSendToServer();
            router.replace('/(tabs)/historique');
          } else {
            setError(`Erreur du serveur : ${data?.detail || 'Authentification échouée'}`);
          }
        } catch (e) {
          setError("Erreur : Impossible de contacter le backend.");
        }
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        const code = (error as any).code;
        switch (code) {
          case statusCodes.SIGN_IN_CANCELLED:
            setError('Connexion annulée');
            break;
          case statusCodes.IN_PROGRESS:
            setError('Connexion en cours...');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setError('Google Play Services non disponibles');
            break;
          default:
            setError(`Erreur Google: ${code}`);
        }
      } else if (error instanceof Error) {
        setError(error.message || 'Erreur lors de la connexion Google');
      } else {
        setError('Erreur inconnue lors de la connexion Google');
      }
    } finally {
      setLoading(false);
    }
  };

  const loginWithFacebook = () => {
    LoginManager.logInWithPermissions(["public_profile", "email"]).then(
      function (result) {
        if (!result.isCancelled) {
          AccessToken.getCurrentAccessToken().then((data) => {
            if (data?.accessToken) handleFacebookResponse(data.accessToken);
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
      const backendResponse = await fetch(`${API_URL}/auth/facebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token: accessToken }),
      });

      const data = await backendResponse.json();

      if (backendResponse.ok && data?.access_token) {
        await AsyncStorage.setItem('userToken', data.access_token);
        await registerForPushAndSendToServer();
        router.replace('/(tabs)/historique');
      } else {
        setError(`Erreur du serveur : ${data?.detail || 'Authentification échouée'}`);
      }
    } catch (e) {
      setError("Erreur : Impossible de contacter le backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-white dark:bg-[#181A20]">
      {/* Decorative Background Elements */}
      <View className="absolute top-0 left-0 right-0 h-1/2 bg-green-500 rounded-b-[40px] opacity-10 dark:opacity-5" />
      <View className="absolute -top-20 -right-20 w-64 h-64 bg-green-400 rounded-full opacity-20 blur-3xl" />
      <View className="absolute top-40 -left-20 w-48 h-48 bg-blue-400 rounded-full opacity-20 blur-3xl" />

      <View className="flex-1 justify-center px-8">
        <Animated.View entering={FadeInUp.duration(1000).springify()} className="items-center mb-12">
          <View className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-3xl items-center justify-center mb-6 shadow-sm">
            <Image className='w-full h-full' source={require('../../assets/images/bet_default_logo_V2.png')} />
          </View>

          <Text className="text-4xl font-bold text-gray-900 dark:text-white text-center mb-2">
            Remo Scan
          </Text>
          <Text className="text-lg text-gray-500 dark:text-gray-400 text-center">
            {t('connect')}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()} className="space-y-4">
          <TouchableOpacity
            disabled={loading}
            onPress={handleGoogleSignIn}
            className="bg-white dark:bg-[#2A2D35] py-4 px-6 rounded-2xl flex-row justify-center items-center shadow-sm border border-gray-100 dark:border-gray-700 mb-4"
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#22C55E" />
            ) : (
              <>
                <FontAwesome name="google" size={24} color="#DB4437" style={{ marginRight: 12 }} />
                <Text className="text-gray-700 dark:text-white text-lg font-semibold">
                  {t('signin_google')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading}
            onPress={loginWithFacebook}
            className="bg-[#1877F2] py-4 px-6 rounded-2xl flex-row justify-center items-center shadow-sm"
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <FontAwesome name="facebook" size={24} color="white" style={{ marginRight: 12 }} />
                <Text className="text-white text-lg font-semibold">
                  {t('signin_facebook')}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading}
            onPress={() => router.push('/auth/login-email')}
            className="bg-gray-100 dark:bg-gray-800 py-4 px-6 rounded-2xl flex-row justify-center items-center shadow-sm border border-gray-200 dark:border-gray-700 mt-4"
            activeOpacity={0.8}
          >
            <FontAwesome name="envelope" size={20} color="#6B7280" style={{ marginRight: 12 }} />
            <Text className="text-gray-700 dark:text-white text-lg font-semibold">
              {t('signin_email') || "Se connecter avec Email"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={loading}
            onPress={() => router.push('/auth/register')}
            className="mt-4 py-2"
            activeOpacity={0.8}
          >
            <Text className="text-center text-green-600 dark:text-green-400 font-semibold text-base">
              {t('create_account') || "Créer un compte"}
            </Text>
          </TouchableOpacity>
        </Animated.View>

        {error && (
          <Animated.View entering={FadeInDown.delay(400)} className="mt-6 bg-red-50 dark:bg-red-900/20 p-4 rounded-xl">
            <Text className="text-center text-red-500 dark:text-red-400 font-medium">
              {error}
            </Text>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(600)} className="mt-12">
          <Text className="text-center text-gray-400 text-sm">
            {t('terms_privacy')}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}