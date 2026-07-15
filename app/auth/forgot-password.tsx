import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton, Field, FormError, FormSuccess, LinkButton, PrimaryButton } from '../components/ui/FormKit';
import Txt from '../components/ui/Txt';
import { API_URL } from '../config/api';
import { useTranslation } from '../i18n';
import { colors } from '../theme/tokens';

export default function ForgotPassword() {
    const router = useRouter();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleResetRequest = async () => {
        if (!email) {
            setError('Veuillez entrer votre email');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setMessage(null);

            const response = await fetch(`${API_URL}/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'Si cet email existe, un lien a été envoyé.');
                setTimeout(() => {
                    router.push({ pathname: '/auth/reset-password', params: { email } });
                }, 3000);
            } else {
                setError(data?.detail || 'Une erreur est survenue');
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
                            {t('forgot_password') || 'Mot de passe oublié'}
                        </Txt>
                        <Txt variant="body" size={14} color={colors.rose} style={{ marginTop: 8, lineHeight: 21 }}>
                            {t('enter_email_reset') || 'Entrez votre email pour recevoir un lien de réinitialisation.'}
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
                        />
                        {message ? <FormSuccess>{message}</FormSuccess> : null}
                        {error ? <FormError>{error}</FormError> : null}
                        <PrimaryButton label={t('send_link') || 'Envoyer le lien'} loading={loading} onPress={handleResetRequest} style={{ marginTop: 8 }} />
                        <LinkButton label={t('cancel') || 'Annuler'} onPress={() => router.back()} />
                        <LinkButton
                            label={t('have_code') || "J'ai déjà un code"}
                            color={colors.yellow}
                            onPress={() => router.push({ pathname: '/auth/reset-password', params: { email } })}
                        />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
