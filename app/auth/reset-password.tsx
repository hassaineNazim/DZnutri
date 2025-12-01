import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { API_URL } from '../config/api';
import { useTranslation } from '../i18n';


export default function ResetPassword() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { t } = useTranslation();

    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);



    const [confirmPassword, setConfirmPassword] = useState('');
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
            setError("Les mots de passe ne correspondent pas");
        } else {
            setError(null);
        }
    }, [newPassword, confirmPassword]);

    const handleReset = async () => {
        if (!email || !token || !newPassword) {
            setError("Veuillez remplir tous les champs");
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
                setMessage(data.message || "Mot de passe réinitialisé avec succès");
                setTimeout(() => {
                    router.replace('/auth/login-email');
                }, 2000);
            } else {
                setError(data?.detail || "Erreur lors de la réinitialisation");
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
                            {t('reset_password') || "Réinitialiser le mot de passe"}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-center">
                            {t('enter_new_password') || "Entrez votre code et votre nouveau mot de passe"}
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

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 ml-1 font-medium">Code</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                                placeholder="123456"
                                placeholderTextColor="#9CA3AF"
                                value={token}
                                onChangeText={setToken}
                                autoCapitalize="none"
                                keyboardType="number-pad"
                            />
                        </View>

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 ml-1 font-medium">{t('new_password') || "Nouveau mot de passe"}</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                                placeholder="••••••••"
                                placeholderTextColor="#9CA3AF"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                secureTextEntry
                            />
                        </View>

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 ml-1 font-medium">{t('confirm_password') || "Confirmer le mot de passe"}</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                                placeholder="••••••••"
                                placeholderTextColor="#9CA3AF"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
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
                            onPress={handleReset}
                            className="bg-green-500 py-4 rounded-xl items-center shadow-lg shadow-green-500/30 mt-4"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-lg font-bold">
                                    {t('reset') || "Réinitialiser"}
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
                    </Animated.View>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
