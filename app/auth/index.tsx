import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from "@react-native-google-signin/google-signin";
import * as AppleAuthentication from 'expo-apple-authentication';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Platform, StatusBar, TouchableOpacity, View } from 'react-native';
import { AccessToken, LoginManager, Settings } from "react-native-fbsdk-next";
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';
import Txt from '../components/ui/Txt';
import { API_URL } from '../config/api';
import { useTranslation } from '../i18n';
import { registerForPushAndSendToServer } from '../services/PushNotif';
import { startSession } from '../services/authSession';
import { colors, radius } from '../theme/tokens';

// --- Icônes monochromes (fidèles au handoff) --------------------------------
function GoogleIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path fill={colors.inkOnYellow} d="M21.6 12.2c0-.6-.1-1.2-.2-1.8H12v3.5h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2z" />
      <Path fill={colors.inkOnYellow} d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
      <Path fill={colors.inkOnYellow} d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9z" />
      <Path fill={colors.inkOnYellow} d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1z" />
    </Svg>
  );
}

function FacebookIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24">
      <Path fill={colors.bordeaux} d="M14 8.5V6.8c0-.8.2-1.2 1.3-1.2H17V2.6h-2.7c-2.9 0-4.1 1.5-4.1 3.9v2H8v3.1h2.2V22H14v-10.4h2.7l.4-3.1z" />
    </Svg>
  );
}

function MailIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={5} width={18} height={14} rx={3} stroke={colors.cream} strokeWidth={1.8} />
      <Path d="m4 7 8 6 8-6" stroke={colors.cream} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function Login() {
  const router = useRouter();
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    const extra = Constants.expoConfig?.extra;
    GoogleSignin.configure({
      iosClientId: extra?.googleIosClientId,
      webClientId: extra?.googleWebClientId,
      offlineAccess: true,
      forceCodeForRefreshToken: true,
    });
    // Le module Facebook est temporairement exclu du build iOS par
    // withExcludeFacebookIOS ; Android peut toujours initialiser le SDK sans
    // déclencher de demande de suivi publicitaire.
    if (Platform.OS !== 'ios') Settings.initializeSDK();
    if (Platform.OS === 'ios') {
      AppleAuthentication.isAvailableAsync().then(setAppleAvailable).catch(() => setAppleAvailable(false));
    }
  }, []);

  const handleAppleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      if (!credential.identityToken) throw new Error("Apple n'a pas transmis de jeton d'identité.");
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName]
        .filter(Boolean)
        .join(' ') || null;
      const backendResponse = await fetch(`${API_URL}/auth/apple`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity_token: credential.identityToken, full_name: fullName }),
      });
      const data = await backendResponse.json();
      if (!backendResponse.ok || !data?.access_token) {
        throw new Error(data?.detail || 'Authentification Apple échouée');
      }
      await startSession(data);
      await registerForPushAndSendToServer();
      router.replace('/(tabs)/historique');
    } catch (error: any) {
      if (error?.code !== 'ERR_REQUEST_CANCELED') {
        setError(error?.message || 'Erreur lors de la connexion Apple');
      }
    } finally {
      setLoading(false);
    }
  };

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
            await startSession(data);
            await registerForPushAndSendToServer();
            router.replace('/(tabs)/historique');
          } else {
            setError(`Erreur du serveur : ${data?.detail || 'Authentification échouée'}`);
          }
        } catch {
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

  const loginWithFacebook = async () => {
    // Module natif temporairement exclu sur iOS (bug d'incompatibilité de
    // react-native-fbsdk-next avec l'API FBSDKCoreKit actuelle — voir
    // plugins/withExcludeFacebookIOS.js). Android n'est pas concerné.
    if (Platform.OS === 'ios') {
      setError('Connexion Facebook temporairement indisponible sur iOS. Utilisez Google ou e-mail.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const result = await LoginManager.logInWithPermissions(["public_profile", "email"]);
      if (result.isCancelled) {
        setError('Connexion Facebook annulée.');
        setLoading(false);
        return;
      }
      const data = await AccessToken.getCurrentAccessToken();
      if (!data?.accessToken) {
        setError("Facebook : jeton d'accès introuvable (vérifiez la config de l'app Facebook).");
        setLoading(false);
        return;
      }
      await handleFacebookResponse(data.accessToken);
    } catch (e) {
      console.log('==> Facebook login error:', e);
      setError('Erreur Facebook : ' + (e instanceof Error ? e.message : String(e)));
      setLoading(false);
    }
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
        await startSession(data);
        await registerForPushAndSendToServer();
        router.replace('/(tabs)/historique');
      } else {
        setError(`Erreur du serveur : ${data?.detail || 'Authentification échouée'}`);
      }
    } catch {
      setError("Erreur : Impossible de contacter le backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />

      {/* Cercles décoratifs */}
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: -70, right: -80, width: 280, height: 280, borderRadius: 140, backgroundColor: 'rgba(242,194,46,0.12)' }}
      />
      <View
        pointerEvents="none"
        style={{ position: 'absolute', top: 170, left: -110, width: 230, height: 230, borderRadius: 115, backgroundColor: 'rgba(255,255,255,0.05)' }}
      />

      <View style={{ flex: 1, paddingHorizontal: 30, paddingBottom: 40 }}>
        {/* Bloc central : mascotte + titre */}
        <Animated.View
          entering={FadeInUp.duration(800).springify()}
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
        >
          <Image
            source={require('../../assets/images/mascotte-betterave.png')}
            style={{ width: 150, height: 150, resizeMode: 'contain' }}
          />
          <Txt variant="bold" size={12} color={colors.yellow} style={{ letterSpacing: 3, marginTop: 18 }}>
            REMO SCAN
          </Txt>
          <Txt
            variant="display"
            size={38}
            color={colors.creamTitle}
            style={{ textAlign: 'center', lineHeight: 40, letterSpacing: -0.5, marginTop: 8 }}
          >
            {t('signin_title')}{' '}
            <Txt variant="displayItalic" size={38} color={colors.yellow}>
              {t('signin_accent')}
            </Txt>
          </Txt>
          <Txt variant="body" size={14} color={colors.rose} style={{ textAlign: 'center', lineHeight: 21, marginTop: 14 }}>
            {t('signin_subtitle')}
          </Txt>
        </Animated.View>

        {/* Boutons */}
        <Animated.View entering={FadeInDown.delay(200).duration(800).springify()} style={{ gap: 12 }}>
          {appleAvailable ? (
            <View pointerEvents={loading ? 'none' : 'auto'} style={{ opacity: loading ? 0.65 : 1 }}>
              <AppleAuthentication.AppleAuthenticationButton
                buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE}
                cornerRadius={radius.cta}
                style={{ width: '100%', height: 56 }}
                onPress={handleAppleSignIn}
              />
            </View>
          ) : null}

          <TouchableOpacity
            disabled={loading}
            onPress={handleGoogleSignIn}
            accessibilityRole="button"
            accessibilityLabel={t('continue_google')}
            accessibilityState={{ disabled: loading, busy: loading }}
            activeOpacity={0.85}
            style={[styles.btn, { backgroundColor: colors.yellow }]}
          >
            {loading ? (
              <ActivityIndicator color={colors.inkOnYellow} />
            ) : (
              <>
                <GoogleIcon />
                <Txt variant="bold" size={16} color={colors.inkOnYellow}>{t('continue_google')}</Txt>
              </>
            )}
          </TouchableOpacity>

          {Platform.OS !== 'ios' ? (
            <TouchableOpacity
              disabled={loading}
              onPress={loginWithFacebook}
              accessibilityRole="button"
              accessibilityLabel={t('continue_facebook')}
              accessibilityState={{ disabled: loading, busy: loading }}
              activeOpacity={0.85}
              style={[styles.btn, { backgroundColor: colors.cream }]}
            >
              {loading ? (
                <ActivityIndicator color={colors.bordeaux} />
              ) : (
                <>
                  <FacebookIcon />
                  <Txt variant="bold" size={16} color={colors.bordeaux}>{t('continue_facebook')}</Txt>
                </>
              )}
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity
            disabled={loading}
            onPress={() => router.push('/auth/login-email')}
            accessibilityRole="button"
            accessibilityLabel={t('continue_email')}
            accessibilityState={{ disabled: loading }}
            activeOpacity={0.85}
            style={[styles.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: 'rgba(244,234,214,0.35)', paddingVertical: 16 }]}
          >
            <MailIcon />
            <Txt variant="bold" size={16} color={colors.cream}>{t('continue_email')}</Txt>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
            <Txt variant="body" size={14} color={colors.rose}>{t('no_account')} </Txt>
            <TouchableOpacity
              disabled={loading}
              onPress={() => router.push('/auth/register')}
              accessibilityRole="link"
              accessibilityLabel={t('create_account')}
              accessibilityState={{ disabled: loading }}
              activeOpacity={0.7}
            >
              <Txt variant="bold" size={14} color={colors.yellow}>{t('create_account')}</Txt>
            </TouchableOpacity>
          </View>

          {error ? (
            <Animated.View entering={FadeInDown} style={{ marginTop: 4, backgroundColor: 'rgba(210,75,51,0.16)', borderRadius: radius.cardSm, padding: 12 }}>
              <Txt variant="medium" size={13} color="#f7c9c1" style={{ textAlign: 'center' }}>{error}</Txt>
            </Animated.View>
          ) : null}

          <Txt variant="body" size={11.5} color="#a37780" style={{ textAlign: 'center', lineHeight: 17, marginTop: 6 }}>
            {t('terms_privacy')}
          </Txt>
          <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 6 }}>
            <TouchableOpacity
              onPress={() => Linking.openURL(`${API_URL}/legal/privacy`)}
              accessibilityRole="link"
              accessibilityLabel={t('privacy_policy')}
            >
              <Txt variant="bold" size={11.5} color={colors.rose}>{t('privacy_policy')}</Txt>
            </TouchableOpacity>
            <Txt variant="body" size={11.5} color="#a37780">·</Txt>
            <TouchableOpacity
              onPress={() => Linking.openURL(`${API_URL}/legal/terms`)}
              accessibilityRole="link"
              accessibilityLabel={t('terms_of_service')}
            >
              <Txt variant="bold" size={11.5} color={colors.rose}>{t('terms_of_service')}</Txt>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = {
  btn: {
    width: '100%' as const,
    borderRadius: radius.cta,
    paddingVertical: 18,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 12,
  },
};
