import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { API_URL } from '../config/api';
import { useTranslation } from '../i18n';
import { registerForPushAndSendToServer } from '../services/PushNotif';

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
        else requirements.push("au moins 8 caractères");

        if (/[A-Z]/.test(pwd)) strength++;
        else requirements.push("une majuscule");

        if (/[a-z]/.test(pwd)) strength++;
        else requirements.push("une minuscule");

        if (/[0-9]/.test(pwd)) strength++;
        else requirements.push("un chiffre");

        if (/[^A-Za-z0-9]/.test(pwd)) strength++;
        else requirements.push("un caractère spécial");

        const message = requirements.length > 0
            ? `Le mot de passe doit contenir ${requirements.join(', ')}`
            : '';

        return { strength, message };
    };

    const handleRegister = async () => {
        if (!username || !email || !password || !confirmPassword) {

            setError("Veuillez remplir tous les champs");
            return;
        }

        if (!validateEmail(email)) {
            setError("Veuillez entrer une adresse email valide");
            return;
        }

        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas");
            return;
        }

        const { strength, message } = validatePasswordStrength(password);
        if (strength < 3) {
            setError(message || "Le mot de passe est trop faible");
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
                await AsyncStorage.setItem('userToken', data.access_token);
                await registerForPushAndSendToServer();
                router.replace('/(tabs)/historique');
            } else {
                setError(data?.detail || "Erreur lors de l'inscription");
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
                            {t('create_account') || "Créer un compte"}
                        </Text>
                        <Text className="text-gray-500 dark:text-gray-400 text-center">
                            {t('join_community') || "Rejoignez la communauté DZNutri"}
                        </Text>
                    </Animated.View>

                    <Animated.View entering={FadeInDown.delay(200).duration(1000).springify()} className="space-y-4">
                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 ml-1 font-medium">{t('username') || "Nom d'utilisateur"}</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                                placeholder="Nom d'utilisateur"
                                placeholderTextColor="#9CA3AF"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                            />
                        </View>

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
                            <Text className="text-gray-700 dark:text-gray-300 mb-2 ml-1 font-medium">{t('password') || "Mot de passe"}</Text>
                            <TextInput
                                className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                                placeholder="••••••••"
                                placeholderTextColor="#9CA3AF"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                            {password.length > 0 && (
                                <View className="flex-row mt-2 space-x-1">
                                    {[1, 2, 3, 4, 5].map((level) => {
                                        const strength = (password.length > 6 ? 1 : 0) + (password.length > 10 ? 1 : 0) + (/[A-Z]/.test(password) ? 1 : 0) + (/[0-9]/.test(password) ? 1 : 0) + (/[^A-Za-z0-9]/.test(password) ? 1 : 0);
                                        const active = strength >= level;
                                        let color = "bg-gray-200 dark:bg-gray-700";
                                        if (active) {
                                            if (strength <= 2) color = "bg-red-500";
                                            else if (strength <= 3) color = "bg-yellow-500";
                                            else color = "bg-green-500";
                                        }
                                        return (
                                            <View key={level} className={`h-1 flex-1 rounded-full ${color}`} />
                                        );
                                    })}
                                </View>
                            )}

                            <View>
                                <Text className="text-gray-700 dark:text-gray-300 mb-2 ml-1 font-medium">{t('confirm_password') || "Mot de passe"}</Text>
                                <TextInput
                                    className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-4 rounded-xl border border-gray-200 dark:border-gray-700"
                                    placeholder="••••••••"
                                    placeholderTextColor="#9CA3AF"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry
                                />
                            </View>
                        </View>
                        {error && (
                            <Text className="text-red-500 text-center font-medium">{error}</Text>
                        )}

                        <TouchableOpacity
                            disabled={loading}
                            onPress={handleRegister}
                            className="bg-green-500 py-4 rounded-xl items-center shadow-lg shadow-green-500/30 mt-4"
                        >
                            {loading ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white text-lg font-bold">
                                    {t('signup') || "S'inscrire"}
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
