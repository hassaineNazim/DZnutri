import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StatusBar, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { BackButton, Field, FormError, LinkButton, PrimaryButton } from '../components/ui/FormKit';
import Txt from '../components/ui/Txt';
import { API_URL } from '../config/api';
import { useTranslation } from '../i18n';
import { registerForPushAndSendToServer } from '../services/PushNotif';
import { startSession } from '../services/authSession';
import { colors } from '../theme/tokens';

export default function Register() {
    const router = useRouter();
    const { t } = useTranslation();
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const validateEmail = (email: string): boolean => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validatePasswordStrength = (pwd: string): { strength: number; message: string } => {
        let strength = 0;
        const requirements = [];

        if (pwd.length >= 8) strength++;
        else requirements.push('au moins 8 caractères');

        if (/[A-Z]/.test(pwd)) strength++;
        else requirements.push('une majuscule');

        if (/[a-z]/.test(pwd)) strength++;
        else requirements.push('une minuscule');

        if (/[0-9]/.test(pwd)) strength++;
        else requirements.push('un chiffre');

        if (/[^A-Za-z0-9]/.test(pwd)) strength++;
        else requirements.push('un caractère spécial');

        const message = requirements.length > 0
            ? `Le mot de passe doit contenir ${requirements.join(', ')}`
            : '';

        return { strength, message };
    };

    const handleRegister = async () => {
        if (!username || !email || !password || !confirmPassword) {
            setError('Veuillez remplir tous les champs');
            return;
        }

        if (!validateEmail(email)) {
            setError('Veuillez entrer une adresse email valide');
            return;
        }

        if (password !== confirmPassword) {
            setError('Les mots de passe ne correspondent pas');
            return;
        }

        const { strength, message } = validatePasswordStrength(password);
        if (strength < 3) {
            setError(message || 'Le mot de passe est trop faible');
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password }),
            });

            const data = await response.json();

            if (response.ok && data?.access_token) {
                await startSession(data);
                await registerForPushAndSendToServer();
                router.replace('/(tabs)/historique');
            } else {
                setError(data?.detail || "Erreur lors de l'inscription");
            }
        } catch {
            setError('Erreur de connexion au serveur');
        } finally {
            setLoading(false);
        }
    };

    // Force du mot de passe (0→5) pour la barre de segments.
    const pwdStrength =
        (password.length > 6 ? 1 : 0) +
        (password.length > 10 ? 1 : 0) +
        (/[A-Z]/.test(password) ? 1 : 0) +
        (/[0-9]/.test(password) ? 1 : 0) +
        (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
    const strengthColor = pwdStrength <= 2 ? colors.red : pwdStrength <= 3 ? colors.orange : colors.green;

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
                            {t('create_account') || 'Créer un compte'}
                        </Txt>
                        <Txt variant="body" size={14} color={colors.rose} style={{ marginTop: 8, lineHeight: 21 }}>
                            {t('join_community') || 'Rejoignez la communauté Remo Scan.'}
                        </Txt>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(150).duration(700).springify()}>
                        <Field
                            label={t('username') || "Nom d'utilisateur"}
                            placeholder="Nom d'utilisateur"
                            value={username}
                            onChangeText={setUsername}
                            autoCapitalize="none"
                        />
                        <Field
                            label="Email"
                            placeholder="exemple@email.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />
                        <Field
                            label={t('password') || 'Mot de passe'}
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                            style={password.length > 0 ? { marginBottom: 0 } : undefined}
                        />
                        {password.length > 0 && (
                            <View style={{ flexDirection: 'row', gap: 5, marginTop: 8, marginBottom: 14 }}>
                                {[1, 2, 3, 4, 5].map((level) => (
                                    <View
                                        key={level}
                                        style={{
                                            height: 4,
                                            flex: 1,
                                            borderRadius: 2,
                                            backgroundColor: pwdStrength >= level ? strengthColor : 'rgba(244,234,214,0.25)',
                                        }}
                                    />
                                ))}
                            </View>
                        )}
                        <Field
                            label={t('confirm_password') || 'Confirmer le mot de passe'}
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry
                        />
                        {error ? <FormError>{error}</FormError> : null}
                        <PrimaryButton label={t('signup') || "S'inscrire"} loading={loading} onPress={handleRegister} style={{ marginTop: 8 }} />
                        <LinkButton label={t('cancel') || 'Annuler'} onPress={() => router.back()} />
                    </Animated.View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
