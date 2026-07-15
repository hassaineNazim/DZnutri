import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton, Field, FormError, LinkButton, PrimaryButton } from '../components/ui/FormKit';
import Txt from '../components/ui/Txt';
import { API_URL } from '../config/api';
import { useTranslation } from '../i18n';
import { registerForPushAndSendToServer } from '../services/PushNotif';
import { saveTokens } from '../services/tokenStore';
import { colors } from '../theme/tokens';

export default function LoginEmail() {
    const router = useRouter();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async () => {
        if (!email || !password) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok && data?.access_token) {
                await saveTokens(data);
                await registerForPushAndSendToServer();
                router.replace('/(tabs)/historique');
            } else {
                setError(data?.detail || 'Email ou mot de passe incorrect');
            }
        } catch {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
            <StatusBar barStyle="light-content" />
            <View style={{ position: 'absolute', top: 14, left: 26, zIndex: 10 }}>
                <BackButton onPress={() => router.back()} />
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingTop: 80, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInUp.duration(700).springify()} style={{ marginBottom: 24 }}>
                        <Txt variant="display" size={34} color={colors.creamTitle} style={{ letterSpacing: -0.5 }}>
                            {t('welcome_back') || 'Bon retour !'}
                        </Txt>
                        <Txt variant="body" size={14} color={colors.rose} style={{ marginTop: 8, lineHeight: 21 }}>
                            {t('enter_credentials') || 'Entrez vos identifiants pour continuer.'}
                        </Txt>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(150).duration(700).springify()}>
                        <Field
                            label="Email"
                            placeholder="exemple@email.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                            autoComplete="email"
                        />
                        <Field
                            label={t('password') || 'Mot de passe'}
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />
                        <View style={{ alignItems: 'flex-end', marginBottom: 4 }}>
                            <LinkButton
                                label={t('forgot_password') || 'Mot de passe oublié ?'}
                                color={colors.yellow}
                                onPress={() => router.push('/auth/forgot-password')}
                            />
                        </View>
                        {error ? <FormError>{error}</FormError> : null}
                        <PrimaryButton label={t('login') || 'Se connecter'} loading={loading} onPress={handleLogin} style={{ marginTop: 8 }} />
                        <LinkButton label={t('cancel') || 'Annuler'} onPress={() => router.back()} />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
