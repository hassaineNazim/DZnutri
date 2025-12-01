import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { API_URL } from '../config/api';
import { useTranslation } from '../i18n';

export default function ForgotPassword() {
    const router = useRouter();
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleResetRequest = async () => {
        if (!email) {
            setError("Veuillez entrer votre email");
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
                setMessage(data.message || "Si cet email existe, un lien a été envoyé.");
                // Optionnel : rediriger vers l'écran de reset après un délai
                setTimeout(() => {
                    router.push({ pathname: '/auth/reset-password', params: { email } });
                }, 3000);
            } else {
                setError(data?.detail || "Une erreur est survenue");
            }
        } catch (e) {
            setError("Erreur de connexion au serveur");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-[#181A20]">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1 justify-center px-8">
                    <Animated.View entering={FadeInUp.duration(1000).springify()} className="items-center mb-8">
                        <Text className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-2">
                            {t('forgot_password') || "Mot de passe oublié"}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-center">
                            {t('enter_email_reset') || "Entrez votre email pour recevoir un lien de réinitialisation"}
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()} className="space-y-4">
                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 ml-1 font-medium">Email</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                                placeholder="exemple@email.com"
                                placeholderTextColor="#9CA3AF"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        {message && (
                            <Text className="text-green-500 text-center font-medium">{message}</Text>
                        )}

                        {error && (
                            <Text className="text-red-500 text-center font-medium">{error}</Text>
                        )}

                        <TouchableOpacity
                            disabled={loading}
                            onPress={handleResetRequest}
                            className="bg-green-500 py-4 rounded-xl items-center shadow-lg shadow-green-500/30 mt-4"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-lg font-bold">
                                    {t('send_link') || "Envoyer le lien"}
                                </Text>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.back()}
                            className="py-4 items-center"
                        >
                            <Text className="text-gray-500 dark:text-gray-400 font-medium">
                                {t('cancel') || "Annuler"}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => router.push({ pathname: '/auth/reset-password', params: { email } })}
                            className="py-2 items-center"
                        >
                            <Text className="text-green-600 dark:text-green-400 font-medium text-sm">
                                {t('have_code') || "J'ai déjà un code"}
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
