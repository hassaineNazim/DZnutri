import { useRouter } from 'expo-router';
import { Activity, AlertTriangle, ArrowLeft, Flame, Leaf, Plus, Save, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StatusBar, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Txt from '../../components/ui/Txt';
import { useUserProfile } from '../../hooks/useUserProfile';
import { useTranslation } from '../../i18n';
import { colors, fonts, radius, shadows } from '../../theme/tokens';

const COMMON_ALLERGIES = ['gluten', 'peanuts', 'lactose', 'eggs', 'soy', 'fish', 'shellfish', 'nuts'];
const DIET_TYPES = ['none', 'vegan', 'vegetarian', 'keto', 'paleo'];
const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active', 'very_active'];

// --- petits helpers d'affichage -------------------------------------------
function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <Txt variant="bold" size={11.5} color={colors.inkSoft} style={{ letterSpacing: 1.5, marginBottom: 12 }}>
            {String(children).toUpperCase()}
        </Txt>
    );
}
function Card({ children }: { children: React.ReactNode }) {
    return (
        <View style={[{ backgroundColor: colors.card, borderRadius: radius.card, padding: 16 }, shadows.listCard]}>
            {children}
        </View>
    );
}
export default function HealthProfilePage() {
    const router = useRouter();
    const { t } = useTranslation();
    const { data: profile, isLoading, updateProfile, isUpdating } = useUserProfile();

    // Défini AU RENDU (pas au chargement du module) pour suivre la bascule de thème.
    const numInputStyle = {
        backgroundColor: colors.inputBg,
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 12,
        fontSize: 15,
        color: colors.ink,
        fontFamily: fonts.sansBold,
        textAlign: 'center' as const,
    };

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
        daily_proteins: 0,
    });

    const [newDislike, setNewDislike] = useState('');

    useEffect(() => {
        if (profile) {
            let day = '', month = '', year = '';
            if (profile.birth_date) {
                const date = new Date(profile.birth_date);
                day = date.getDate().toString();
                month = (date.getMonth() + 1).toString();
                year = date.getFullYear().toString();
            }
            setFormData({
                height: profile.height?.toString() || '',
                weight: profile.weight?.toString() || '',
                birth_day: day,
                birth_month: month,
                birth_year: year,
                gender: profile.gender || 'male',
                activity_level: profile.activity_level || 'sedentary',
                allergies: profile.allergies || [],
                medical_conditions: profile.medical_conditions || [],
                diet_type: profile.diet_type || 'none',
                disliked_ingredients: profile.disliked_ingredients || [],
                daily_calories: profile.daily_calories || 0,
                daily_proteins: profile.daily_proteins || 0,
            });
        }
    }, [profile]);

    const handleSave = async () => {
        try {
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
                disliked_ingredients: formData.disliked_ingredients,
            };
            const updatedData = await updateProfile(payload);
            setFormData((prev) => ({ ...prev, daily_calories: updatedData.daily_calories, daily_proteins: updatedData.daily_proteins }));
            Alert.alert(t('success_title') || 'Succès', 'Profil mis à jour avec succès');
        } catch (error) {
            console.log('Error saving profile:', error);
            Alert.alert('Erreur', 'Impossible de sauvegarder le profil');
        }
    };

    const toggleAllergy = (allergy: string) => {
        setFormData((prev) => {
            const exists = prev.allergies.includes(allergy);
            return { ...prev, allergies: exists ? prev.allergies.filter((a) => a !== allergy) : [...prev.allergies, allergy] };
        });
    };

    const addDislike = () => {
        if (newDislike.trim()) {
            setFormData((prev) => ({ ...prev, disliked_ingredients: [...prev.disliked_ingredients, newDislike.trim()] }));
            setNewDislike('');
        }
    };

    const removeDislike = (item: string) => {
        setFormData((prev) => ({ ...prev, disliked_ingredients: prev.disliked_ingredients.filter((i) => i !== item) }));
    };

    if (isLoading) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.bordeaux, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color={colors.yellow} />
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
            <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />
            {/* ---- Entête bordeaux ---- */}
            <View style={{ paddingHorizontal: 22, paddingTop: 16, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Pressable onPress={() => router.back()} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeft size={20} color={colors.bordeaux} />
                </Pressable>
                <Txt variant="displayXBold" size={20} color={colors.creamTitle}>{t('health_profile')}</Txt>
                <Pressable
                    onPress={handleSave}
                    disabled={isUpdating}
                    style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' }}
                >
                    {isUpdating ? <ActivityIndicator size="small" color={colors.inkOnYellow} /> : <Save size={20} color={colors.inkOnYellow} />}
                </Pressable>
            </View>

            {/* ---- Feuille crème ---- */}
            <View style={{ flex: 1, backgroundColor: colors.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 22, paddingBottom: 120 }}>
                        {/* Alertes intelligentes */}
                        <Animated.View entering={FadeInDown.delay(80).springify()} style={{ backgroundColor: colors.bordeaux, borderRadius: radius.card, padding: 16, marginBottom: 22, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(242,194,46,0.2)', alignItems: 'center', justifyContent: 'center' }}>
                                <AlertTriangle size={24} color={colors.yellow} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Txt variant="displayXBold" size={17} color={colors.creamTitle}>{t('smart_alerts')}</Txt>
                                <Txt variant="body" size={12.5} color={colors.rose} style={{ marginTop: 3, lineHeight: 18 }}>{t('smart_alerts_desc')}</Txt>
                            </View>
                        </Animated.View>

                        {/* Objectifs journaliers */}
                        {formData.daily_calories > 0 && (
                            <Animated.View entering={FadeInDown.delay(140).springify()} style={{ flexDirection: 'row', gap: 12, marginBottom: 22 }}>
                                <View style={[{ flex: 1, backgroundColor: colors.card, borderRadius: radius.card, padding: 16, alignItems: 'center' }, shadows.listCard]}>
                                    <Flame size={24} color={colors.orange} />
                                    <Txt variant="display" size={26} color={colors.ink} style={{ marginTop: 8 }}>{formData.daily_calories}</Txt>
                                    <Txt variant="bold" size={10.5} color={colors.inkSoft} style={{ letterSpacing: 0.5, marginTop: 2 }}>{(t('calories') || 'Calories').toUpperCase()}</Txt>
                                </View>
                                <View style={[{ flex: 1, backgroundColor: colors.card, borderRadius: radius.card, padding: 16, alignItems: 'center' }, shadows.listCard]}>
                                    <Activity size={24} color={colors.green} />
                                    <Txt variant="display" size={26} color={colors.ink} style={{ marginTop: 8 }}>{formData.daily_proteins}g</Txt>
                                    <Txt variant="bold" size={10.5} color={colors.inkSoft} style={{ letterSpacing: 0.5, marginTop: 2 }}>{(t('proteins') || 'Protéines').toUpperCase()}</Txt>
                                </View>
                            </Animated.View>
                        )}

                        {/* Statistiques physiques */}
                        <SectionLabel>{t('physical_stats')}</SectionLabel>
                        <Card>
                            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 14 }}>
                                <View style={{ flex: 1 }}>
                                    <Txt variant="medium" size={12} color={colors.inkSoft} style={{ marginBottom: 6 }}>{t('height')}</Txt>
                                    <TextInput style={numInputStyle} placeholder="175" placeholderTextColor={colors.inkMeta} keyboardType="numeric" value={formData.height} onChangeText={(v) => setFormData((prev) => ({ ...prev, height: v }))} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Txt variant="medium" size={12} color={colors.inkSoft} style={{ marginBottom: 6 }}>{t('weight')}</Txt>
                                    <TextInput style={numInputStyle} placeholder="70" placeholderTextColor={colors.inkMeta} keyboardType="numeric" value={formData.weight} onChangeText={(v) => setFormData((prev) => ({ ...prev, weight: v }))} />
                                </View>
                            </View>

                            <Txt variant="medium" size={12} color={colors.inkSoft} style={{ marginBottom: 6 }}>{t('birth_date')}</Txt>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
                                <TextInput style={[numInputStyle, { flex: 1 }]} placeholder="JJ" placeholderTextColor={colors.inkMeta} keyboardType="numeric" maxLength={2} value={formData.birth_day} onChangeText={(v) => setFormData((prev) => ({ ...prev, birth_day: v }))} />
                                <TextInput style={[numInputStyle, { flex: 1 }]} placeholder="MM" placeholderTextColor={colors.inkMeta} keyboardType="numeric" maxLength={2} value={formData.birth_month} onChangeText={(v) => setFormData((prev) => ({ ...prev, birth_month: v }))} />
                                <TextInput style={[numInputStyle, { flex: 1.4 }]} placeholder="AAAA" placeholderTextColor={colors.inkMeta} keyboardType="numeric" maxLength={4} value={formData.birth_year} onChangeText={(v) => setFormData((prev) => ({ ...prev, birth_year: v }))} />
                            </View>

                            <Txt variant="medium" size={12} color={colors.inkSoft} style={{ marginBottom: 8 }}>{t('gender')}</Txt>
                            <View style={{ flexDirection: 'row', backgroundColor: colors.inputBg, padding: 4, borderRadius: 12, marginBottom: 14 }}>
                                {['male', 'female'].map((g) => {
                                    const active = formData.gender === g;
                                    return (
                                        <TouchableOpacity key={g} onPress={() => setFormData((prev) => ({ ...prev, gender: g }))} style={{ flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center', backgroundColor: active ? colors.card : 'transparent' }}>
                                            <Txt variant="semibold" size={14} color={active ? colors.accent : colors.inkSoft}>{t(g)}</Txt>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>

                            <Txt variant="medium" size={12} color={colors.inkSoft} style={{ marginBottom: 8 }}>{t('activity_level')}</Txt>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {ACTIVITY_LEVELS.map((level) => {
                                    const active = formData.activity_level === level;
                                    return (
                                        <TouchableOpacity
                                            key={level}
                                            onPress={() => setFormData((prev) => ({ ...prev, activity_level: level }))}
                                            style={{ marginRight: 8, paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1.5, backgroundColor: active ? colors.bordeaux : 'transparent', borderColor: active ? colors.bordeaux : colors.border }}
                                        >
                                            <Txt variant="semibold" size={13} color={active ? colors.cream : colors.inkSoft}>{t(level)}</Txt>
                                        </TouchableOpacity>
                                    );
                                })}
                            </ScrollView>
                        </Card>

                        {/* Régime */}
                        <View style={{ height: 22 }} />
                        <SectionLabel>{t('diet_type')}</SectionLabel>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 22 }}>
                            {DIET_TYPES.map((type) => {
                                const active = formData.diet_type === type;
                                return (
                                    <TouchableOpacity key={type} onPress={() => setFormData((prev) => ({ ...prev, diet_type: type }))} style={{ marginRight: 12, alignItems: 'center' }}>
                                        <View style={{ width: 64, height: 64, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: 6, backgroundColor: active ? colors.bordeaux : colors.card, borderWidth: active ? 0 : 1.5, borderColor: colors.border }}>
                                            <Leaf size={24} color={active ? colors.cream : colors.inkMeta} />
                                        </View>
                                        <Txt variant="semibold" size={12} color={active ? colors.accent : colors.inkSoft}>{t(type)}</Txt>
                                    </TouchableOpacity>
                                );
                            })}
                        </ScrollView>

                        {/* Allergies */}
                        <SectionLabel>{t('allergies')}</SectionLabel>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 22 }}>
                            {COMMON_ALLERGIES.map((allergy) => {
                                const active = formData.allergies.includes(allergy);
                                return (
                                    <TouchableOpacity
                                        key={allergy}
                                        onPress={() => toggleAllergy(allergy)}
                                        style={{ marginRight: 8, marginBottom: 8, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.cardSm, flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, backgroundColor: active ? 'rgba(210,75,51,0.1)' : colors.card, borderColor: active ? colors.red : colors.border }}
                                    >
                                        {active && <AlertTriangle size={14} color={colors.red} />}
                                        <Txt variant="semibold" size={13.5} color={active ? colors.red : colors.inkSoft}>{t(allergy)}</Txt>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Ingrédients non désirés */}
                        <SectionLabel>{t('disliked_ingredients')}</SectionLabel>
                        <Card>
                            <View style={{ flexDirection: 'row', gap: 8, marginBottom: formData.disliked_ingredients.length > 0 ? 14 : 0 }}>
                                <TextInput
                                    style={{ flex: 1, backgroundColor: colors.inputBg, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: colors.ink, fontFamily: fonts.sans }}
                                    placeholder={t('dislike_placeholder')}
                                    placeholderTextColor={colors.inkMeta}
                                    value={newDislike}
                                    onChangeText={setNewDislike}
                                    onSubmitEditing={addDislike}
                                />
                                <TouchableOpacity onPress={addDislike} style={{ backgroundColor: colors.bordeaux, width: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
                                    <Plus size={24} color={colors.cream} />
                                </TouchableOpacity>
                            </View>
                            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                                {formData.disliked_ingredients.map((item, index) => (
                                    <TouchableOpacity key={index} onPress={() => removeDislike(item)} style={{ marginRight: 8, marginBottom: 8, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: colors.chipBg, borderRadius: 10, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                        <Txt variant="medium" size={13} color={colors.ink}>{item}</Txt>
                                        <X size={14} color={colors.inkSoft} />
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </Card>
                    </ScrollView>
                </KeyboardAvoidingView>
            </View>
        </View>
    );
}
