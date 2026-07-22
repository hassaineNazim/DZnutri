import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { ImagePlus, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StatusBar, TextInput, TouchableOpacity, View } from 'react-native';
import Txt from '../components/ui/Txt';
import { useTranslation } from '../i18n';
import { reportProduct } from '../services/report';
import { colors, fonts, getThemeScheme, shadows } from '../theme/tokens';

export default function AutreProblemePage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission refusée', 'Nous avons besoin de la permission pour accéder à vos photos.');
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert('Champ vide', 'Veuillez décrire le problème.');
            return;
        }
        setLoading(true);
        try {
            let uploadedImageUrl = null;
            if (image) {
                const formData = new FormData();
                formData.append('file', { uri: image, type: 'image/jpeg', name: 'report_image.jpg' } as any);
                formData.append('upload_preset', 'dznutri_reports');
                formData.append('cloud_name', 'df8kgpe6d');
                const uploadRes = await fetch('https://api.cloudinary.com/v1_1/df8kgpe6d/image/upload', { method: 'POST', body: formData });
                const uploadData = await uploadRes.json();
                if (uploadData.secure_url) uploadedImageUrl = uploadData.secure_url;
            }

            await reportProduct('GENERAL_ISSUE', description, 'userreportapp', uploadedImageUrl);

            Alert.alert('Merci', 'Votre signalement a été envoyé.', [{ text: 'OK', onPress: () => router.back() }]);
        } catch (error) {
            Alert.alert('Erreur', "Impossible d'envoyer le signalement.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const canSend = description.trim().length > 0;

    return (
        <View style={{ flex: 1, backgroundColor: colors.sheet }}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle={getThemeScheme() === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.sheet} />

            {/* Entête */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 14, paddingBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Pressable
                        onPress={() => {
                            if (router.canGoBack()) router.back();
                            else router.push('/screens/reportUser');
                        }}
                        style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }, shadows.listCard]}
                    >
                        <X size={20} color={colors.accent} />
                    </Pressable>
                    <Txt variant="displayXBold" size={20} color={colors.ink}>{t('help') || 'Aide'}</Txt>
                </View>

                <TouchableOpacity onPress={handleSubmit} disabled={loading || !canSend} style={{ paddingHorizontal: 8, paddingVertical: 8 }}>
                    {loading ? (
                        <ActivityIndicator color={colors.accent} />
                    ) : (
                        <Txt variant="bold" size={14} color={canSend ? colors.accent : colors.inkMeta} style={{ letterSpacing: 0.5 }}>
                            {(t('send') || 'Envoyer').toUpperCase()}
                        </Txt>
                    )}
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 100 }} keyboardShouldPersistTaps="handled" style={{ flex: 1 }}>
                <Txt variant="body" size={15} color={colors.inkSoft} style={{ marginBottom: 20, lineHeight: 22 }}>
                    Décrivez le problème rencontré :
                </Txt>

                <TextInput
                    style={{ fontSize: 17, color: colors.ink, fontFamily: fonts.sans, borderBottomWidth: 1.5, borderBottomColor: colors.handle, paddingBottom: 10, marginBottom: 32 }}
                    placeholder="Ex : le code-barres n'est pas reconnu…"
                    placeholderTextColor={colors.inkMeta}
                    multiline
                    value={description}
                    onChangeText={setDescription}
                    autoFocus
                />

                {/* Zone photo */}
                {image ? (
                    <View style={{ position: 'relative', width: 128, height: 128 }}>
                        <Image source={{ uri: image }} style={{ width: '100%', height: '100%', borderRadius: 14 }} />
                        <TouchableOpacity
                            onPress={() => setImage(null)}
                            style={{ position: 'absolute', top: -8, right: -8, backgroundColor: colors.ink, borderRadius: 14, padding: 5, zIndex: 10 }}
                        >
                            <X size={16} color={colors.cream} />
                        </TouchableOpacity>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={pickImage}
                        activeOpacity={0.75}
                        style={{ width: 128, height: 128, backgroundColor: colors.card, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border }}
                    >
                        <ImagePlus size={26} color={colors.inkSoft} />
                        <Txt variant="bold" size={11} color={colors.inkSoft} style={{ marginTop: 8, letterSpacing: 0.5, textAlign: 'center', paddingHorizontal: 8 }}>
                            AJOUTER UNE PHOTO
                        </Txt>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </View>
    );
}
