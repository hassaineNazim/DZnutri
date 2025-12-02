import { useRouter } from 'expo-router';
import { Activity, AlertTriangle, ChevronLeft, Flame, Leaf, Plus, Save, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useTranslation } from '../../i18n';
import { api } from '../../services/axios';

const COMMON_ALLERGIES = ['gluten', 'peanuts', 'lactose', 'eggs', 'soy', 'fish', 'shellfish', 'nuts'];
const DIET_TYPES = ['none', 'vegan', 'vegetarian', 'keto', 'paleo'];
const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

export default function HealthProfilePage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        height: '',
        weight: '',
        birth_day: '',
        birth_month: '',
        birth_year: '',
        gender: 'male',
        activity_level: 'sedentary',
        allergies: [] as string[],
        medical_conditions: [] as string[],
        diet_type: 'none',
        disliked_ingredients: [] as string[],
        daily_calories: 0,
        daily_proteins: 0
    });

    const [newDislike, setNewDislike] = useState('');

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/profile');
            const data = response.data;

            let day = '', month = '', year = '';
            if (data.birth_date) {
                const date = new Date(data.birth_date);
                day = date.getDate().toString();
                month = (date.getMonth() + 1).toString();
                year = date.getFullYear().toString();
            }

            setFormData({
                height: data.height?.toString() || '',
                weight: data.weight?.toString() || '',
                birth_day: day,
                birth_month: month,
                birth_year: year,
                gender: data.gender || 'male',
                activity_level: data.activity_level || 'sedentary',
                allergies: data.allergies || [],
                medical_conditions: data.medical_conditions || [],
                diet_type: data.diet_type || 'none',
                disliked_ingredients: data.disliked_ingredients || [],
                daily_calories: data.daily_calories || 0,
                daily_proteins: data.daily_proteins || 0
            });
        } catch (error) {
            console.log('Error fetching profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Format date
            let birth_date = null;
            if (formData.birth_day && formData.birth_month && formData.birth_year) {
                birth_date = `${formData.birth_year}-${formData.birth_month.padStart(2, '0')}-${formData.birth_day.padStart(2, '0')}`;
            }

            const payload = {
                height: parseFloat(formData.height.replace(',', '.')) || null,
                weight: parseFloat(formData.weight.replace(',', '.')) || null,
                birth_date,
                gender: formData.gender,
                activity_level: formData.activity_level,
                allergies: formData.allergies,
                medical_conditions: formData.medical_conditions,
                diet_type: formData.diet_type,
                disliked_ingredients: formData.disliked_ingredients
            };

            const response = await api.put('/profile', payload);

            // Update local state with returned calculated values
            setFormData(prev => ({
                ...prev,
                daily_calories: response.data.daily_calories,
                daily_proteins: response.data.daily_proteins
            }));

            Alert.alert(t('success_title') || 'Succès', 'Profil mis à jour avec succès');
        } catch (error) {
            console.log('Error saving profile:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
        } finally {
            setSaving(false);
        }
    };

    const toggleAllergy = (allergy: string) => {
        setFormData(prev => {
            const exists = prev.allergies.includes(allergy);
            return {
                ...prev,
                allergies: exists
                    ? prev.allergies.filter(a => a !== allergy)
                    : [...prev.allergies, allergy]
            };
        });
    };

    const addDislike = () => {
        if (newDislike.trim()) {
            setFormData(prev => ({
                ...prev,
                disliked_ingredients: [...prev.disliked_ingredients, newDislike.trim()]
            }));
            setNewDislike('');
        }
    };

    const removeDislike = (item: string) => {
        setFormData(prev => ({
            ...prev,
            disliked_ingredients: prev.disliked_ingredients.filter(i => i !== item)
        }));
    };

    if (loading) {
        return (
            <View className="flex-1 bg-gray-50 dark:bg-[#181A20] items-center justify-center">
                <ActivityIndicator size="large" color="#22C55E" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50 dark:bg-[#181A20]">
            {/* Header */}
            <View className="bg-white dark:bg-[#1F222A] px-4 pt-12 pb-4 flex-row items-center justify-between shadow-sm z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 items-center justify-center"
                >
                    <ChevronLeft size={24} color="#374151" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 dark:text-white">
                    {t('health_profile')}
                </Text>
                <TouchableOpacity
                    onPress={handleSave}
                    disabled={saving}
                    className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 items-center justify-center"
                >
                    {saving ? <ActivityIndicator size="small" color="#22C55E" /> : <Save size={20} color="#22C55E" />}
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >

                <ScrollView
                    className="flex-1 px-4 py-6"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 100 }}
                >

                    {/* Smart Alerts Card */}
                    <Animated.View entering={FadeInDown.delay(100).springify()} className="bg-blue-500 rounded-2xl p-4 mb-6 flex-row items-center shadow-lg shadow-blue-500/30">
                        <View className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-4">
                            <AlertTriangle size={24} color="white" />
                        </View>
                        <View className="flex-1">
                            <Text className="text-white font-bold text-lg">{t('smart_alerts')}</Text>
                            <Text className="text-blue-100 text-sm">{t('smart_alerts_desc')}</Text>
                        </View>
                    </Animated.View>

                    {/* Daily Goals Preview */}
                    {(formData.daily_calories > 0) && (
                        <Animated.View entering={FadeInDown.delay(200).springify()} className="flex-row mb-6" style={{ gap: 16 }}>
                            <View className="flex-1 bg-white dark:bg-[#1F222A] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 items-center">
                                <View className="mb-2">
                                    <Flame size={24} color="#F59E0B" />
                                </View>
                                <Text className="text-2xl font-bold text-gray-900 dark:text-white">{formData.daily_calories}</Text>
                                <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('calories')}</Text>
                            </View>
                            <View className="flex-1 bg-white dark:bg-[#1F222A] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 items-center">
                                <View className="mb-2">
                                    <Activity size={24} color="#3B82F6" />
                                </View>
                                <Text className="text-2xl font-bold text-gray-900 dark:text-white">{formData.daily_proteins}g</Text>
                                <Text className="text-xs text-gray-500 dark:text-gray-400 uppercase">{t('proteins')}</Text>
                            </View>
                        </Animated.View>
                    )}

                    {/* Physical Stats */}
                    <View className="mb-6">
                        <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">{t('physical_stats')}</Text>
                        <View className="bg-white dark:bg-[#1F222A] rounded-2xl p-4 shadow-sm">
                            <View className="flex-row mb-4" style={{ gap: 16 }}>
                                <View className="flex-1">
                                    <Text className="text-gray-500 dark:text-gray-400 mb-1 text-xs">{t('height')}</Text>
                                    <TextInput
                                        className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-gray-900 dark:text-white font-bold text-center"
                                        placeholder="175"
                                        keyboardType="numeric"
                                        value={formData.height}
                                        onChangeText={(t) => setFormData(prev => ({ ...prev, height: t }))}
                                    />
                                </View>
                                <View className="flex-1">
                                    <Text className="text-gray-500 dark:text-gray-400 mb-1 text-xs">{t('weight')}</Text>
                                    <TextInput
                                        className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-gray-900 dark:text-white font-bold text-center"
                                        placeholder="70"
                                        keyboardType="numeric"
                                        value={formData.weight}
                                        onChangeText={(t) => setFormData(prev => ({ ...prev, weight: t }))}
                                    />
                                </View>
                            </View >

                            <Text className="text-gray-500 dark:text-gray-400 mb-1 text-xs">{t('birth_date')}</Text>
                            <View className="flex-row mb-4" style={{ gap: 8 }}>
                                <TextInput
                                    className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-gray-900 dark:text-white text-center"
                                    placeholder="JJ"
                                    keyboardType="numeric"
                                    maxLength={2}
                                    value={formData.birth_day}
                                    onChangeText={(t) => setFormData(prev => ({ ...prev, birth_day: t }))}
                                />
                                <TextInput
                                    className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-gray-900 dark:text-white text-center"
                                    placeholder="MM"
                                    keyboardType="numeric"
                                    maxLength={2}
                                    value={formData.birth_month}
                                    onChangeText={(t) => setFormData(prev => ({ ...prev, birth_month: t }))}
                                />
                                <TextInput
                                    className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-gray-900 dark:text-white text-center"
                                    placeholder="AAAA"
                                    keyboardType="numeric"
                                    maxLength={4}
                                    value={formData.birth_year}
                                    onChangeText={(t) => setFormData(prev => ({ ...prev, birth_year: t }))}
                                />
                            </View>

                            <Text className="text-gray-500 dark:text-gray-400 mb-2 text-xs">{t('gender')}</Text>
                            <View className="flex-row bg-gray-50 dark:bg-gray-800 p-1 rounded-xl mb-4">
                                {['male', 'female'].map((g) => (
                                    <TouchableOpacity
                                        key={g}
                                        onPress={() => setFormData(prev => ({ ...prev, gender: g }))}
                                        className={`flex-1 py-2 rounded-lg items-center ${formData.gender === g ? 'bg-white dark:bg-gray-700 ' : ''}`}
                                    >
                                        <Text className={`font-medium ${formData.gender === g ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                            {t(g)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text className="text-gray-500 dark:text-gray-400 mb-2 text-xs">{t('activity_level')}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                                {ACTIVITY_LEVELS.map((level) => (
                                    <TouchableOpacity
                                        key={level}
                                        onPress={() => setFormData(prev => ({ ...prev, activity_level: level }))}
                                        className={`mr-2 px-4 py-2 rounded-full border ${formData.activity_level === level
                                            ? 'bg-green-500 border-green-500'
                                            : 'bg-transparent border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        <Text className={formData.activity_level === level ? 'text-white font-medium' : 'text-gray-500 dark:text-gray-400'}>
                                            {t(level)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    </View>

                    {/* Diet & Allergies */}
                    <View className="mb-6">
                        <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">{t('diet_type')}</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
                            {DIET_TYPES.map((type) => (
                                <TouchableOpacity
                                    key={type}
                                    onPress={() => setFormData(prev => ({ ...prev, diet_type: type }))}
                                    className={`mr-3 items-center`}
                                >
                                    <View className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${formData.diet_type === type
                                        ? 'bg-green-500 '
                                        : 'bg-white dark:bg-[#1F222A] border border-gray-100 dark:border-gray-800'
                                        }`}>
                                        <Leaf size={24} color={formData.diet_type === type ? 'white' : '#9CA3AF'} />
                                    </View>
                                    <Text className={`text-xs font-medium ${formData.diet_type === type ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                                        {t(type)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>

                        <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">{t('allergies')}</Text>
                        <View className="flex-row flex-wrap">
                            {COMMON_ALLERGIES.map((allergy) => (
                                <TouchableOpacity
                                    key={allergy}
                                    onPress={() => toggleAllergy(allergy)}
                                    className={`mr-2 mb-2 px-4 py-2 rounded-xl flex-row items-center ${formData.allergies.includes(allergy)
                                        ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                        : 'bg-white dark:bg-[#1F222A] border border-gray-100 dark:border-gray-800'
                                        }`}
                                >
                                    {formData.allergies.includes(allergy) && <AlertTriangle size={14} color="#EF4444" />}
                                    <Text className={formData.allergies.includes(allergy) ? 'text-red-600 dark:text-red-400 font-medium' : 'text-gray-600 dark:text-gray-300'}>
                                        {t(allergy)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Dislikes */}
                    <View className="mb-12">
                        <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">{t('disliked_ingredients')}</Text>
                        <View className="bg-white dark:bg-[#1F222A] rounded-2xl p-4 shadow-sm">
                            <View className="flex-row mb-4" style={{ gap: 8 }}>
                                <TextInput
                                    className="flex-1 bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-gray-900 dark:text-white"
                                    placeholder={t('dislike_placeholder')}
                                    placeholderTextColor="#9CA3AF"
                                    value={newDislike}
                                    onChangeText={setNewDislike}
                                    onSubmitEditing={addDislike}
                                />
                                <TouchableOpacity
                                    onPress={addDislike}
                                    className="bg-gray-900 dark:bg-white w-12 rounded-xl items-center justify-center"
                                >
                                    <Plus size={24} color={Platform.OS === 'ios' ? 'white' : 'black'} />
                                </TouchableOpacity>
                            </View>

                            <View className="flex-row flex-wrap">
                                {formData.disliked_ingredients.map((item, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        onPress={() => removeDislike(item)}
                                        className="mr-2 mb-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg flex-row items-center"
                                    >
                                        <Text className="text-gray-700 dark:text-gray-300 mr-2">{item}</Text>
                                        <X size={14} color="#6B7280" />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
