import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton, Field, FormError, FormSuccess, LinkButton, PrimaryButton } from '../components/ui/FormKit';
import Txt from '../components/ui/Txt';
import { API_URL } from '../config/api';
import { useTranslation } from '../i18n';
import { colors } from '../theme/tokens';

export default function ResetPassword() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (params.email) {
            setEmail(params.email as string);
        }
        if (params.token) {
            setToken(params.token as string);
        }
    }, [params]);

    useEffect(() => {
        if (newPassword !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
        } else {
            setError(null);
        }
    }, [newPassword, confirmPassword]);

    const handleReset = async () => {
        if (!email || !token || !newPassword) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        try {
            setLoading(true);
            setError(null);
            setMessage(null);

            const response = await fetch(`${API_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, token, new_password: newPassword }),
            });

            const data = await response.json();

            if (response.ok) {
                setMessage(data.message || 'Mot de passe réinitialisé avec succès');
                setTimeout(() => {
                    router.replace('/auth/login-email');
                }, 2000);
            } else {
                setError(data?.detail || 'Erreur lors de la réinitialisation');
            }
        } catch {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />
            <View style={{ position: 'absolute', top: 14, left: 26, zIndex: 10 }}>
                <BackButton onPress={() => router.back()} />
            </View>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingHorizontal: 26, paddingTop: 80, paddingBottom: 40 }}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View entering={FadeInUp.duration(700).springify()} style={{ marginBottom: 22 }}>
                        <Txt variant="display" size={34} color={colors.creamTitle} style={{ letterSpacing: -0.5 }}>
                            {t('reset_password') || 'Réinitialiser le mot de passe'}
                        </Txt>
                        <Txt variant="body" size={14} color={colors.rose} style={{ marginTop: 8, lineHeight: 21 }}>
                            {t('enter_new_password') || 'Entrez votre code et votre nouveau mot de passe.'}
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
                        <Field
                            label="Code"
                            placeholder="123456"
                            value={token}
                            onChangeText={setToken}
                            autoCapitalize="none"
                            keyboardType="number-pad"
                        />
                        <Field
                            label={t('new_password') || 'Nouveau mot de passe'}
                            placeholder="••••••••"
                            value={newPassword}
                            onChangeText={setNewPassword}
                            secureTextEntry
                        />
                        <Field
                            label={t('confirm_password') || 'Confirmer le mot de passe'}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                        {message ? <FormSuccess>{message}</FormSuccess> : null}
                        {error ? <FormError>{error}</FormError> : null}
                        <PrimaryButton label={t('reset') || 'Réinitialiser'} loading={loading} onPress={handleReset} style={{ marginTop: 8 }} />
                        <LinkButton label={t('cancel') || 'Annuler'} onPress={() => router.back()} />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
