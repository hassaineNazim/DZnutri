import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image,
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { reportProduct } from '../services/report';

export default function AutreProblemePage() {
    const router = useRouter();
    const [description, setDescription] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Fonction pour choisir une image
    const pickImage = async () => {
        // Demander la permission
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
            Alert.alert("Champ vide", "Veuillez décrire le problème.");
            return;
        }

        setLoading(true);

        try {
            let uploadedImageUrl = null;

            // 1. SI UNE IMAGE EST SÉLECTIONNÉE, ON L'UPLOAD D'ABORD
            if (image) {
                const formData = new FormData();
                formData.append('file', {
                    uri: image,
                    type: 'image/jpeg',
                    name: 'report_image.jpg',
                } as any);
                formData.append('upload_preset', 'dznutri_reports');
                formData.append('cloud_name', 'df8kgpe6d');

                // On envoie directement à Cloudinary (pas à votre backend)
                const uploadRes = await fetch('https://api.cloudinary.com/v1_1/df8kgpe6d/image/upload', {
                    method: 'POST',
                    body: formData,
                });

                const uploadData = await uploadRes.json();
                console.log("Réponse Cloudinary :", uploadData); // LOG 2


                if (uploadData.secure_url) {
                    uploadedImageUrl = uploadData.secure_url;
                }
            }

            // 2. ENSUITE, ON APPELLE VOTRE BACKEND AVEC L'URL (TEXTE)
            await reportProduct(
                'GENERAL_ISSUE',
                description,
                'userreportapp',
                uploadedImageUrl // On passe l'URL (ou null)
            );

            Alert.alert("Merci", "Votre signalement a été envoyé.", [
                { text: "OK", onPress: () => router.back() }
            ]);

        } catch (error) {
            Alert.alert("Erreur", "Impossible d'envoyer le signalement.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };


    return (
        <View style={{ flex: 1, backgroundColor: 'white', paddingTop: 50 }}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* HEADER */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <TouchableOpacity 
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.push('/screens/reportUser');
                            }
                        }} 
                        style={{ padding: 10, marginLeft: -8 }}
                    >
                        <X size={24} color="black" />
                    </TouchableOpacity>
                    <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827', marginLeft: 8 }}>Aide</Text>
                </View>

                <TouchableOpacity onPress={handleSubmit} disabled={loading || !description.trim()} style={{ padding: 10 }}>
                    {loading ? (
                        <ActivityIndicator color="#22C55E" />
                    ) : (
                        <Text style={{ fontWeight: 'bold', color: description.trim() ? '#16a34a' : '#d1d5db' }}>
                            ENVOYER
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* CONTENU */}
            <ScrollView 
                contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
                style={{ flex: 1 }}
            >
                <Text style={{ color: '#4b5563', fontSize: 16, marginBottom: 24 }}>
                    Décrivez le problème rencontré :
                </Text>

                {/* Champ Texte (Ligne soulignée comme sur la photo) */}
                <TextInput
                    style={{ fontSize: 18, color: '#111827', borderBottomWidth: 1, borderBottomColor: '#d1d5db', paddingBottom: 8, marginBottom: 32 }}
                    placeholder="Ex: Le code-barres n'est pas reconnu..."
                    multiline
                    value={description}
                    onChangeText={setDescription}
                    autoFocus
                />

                {/* Zone Photo */}
                <View>
                    {image ? (
                        <View style={{ position: 'relative', width: 128, height: 128 }}>
                            <Image source={{ uri: image }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                            <TouchableOpacity
                                onPress={() => setImage(null)}
                                style={{ position: 'absolute', top: -8, right: -8, backgroundColor: '#e5e7eb', borderRadius: 9999, padding: 4, zIndex: 10 }}
                            >
                                <X size={16} color="black" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={pickImage}
                            style={{ width: 128, height: 128, backgroundColor: '#f3f4f6', borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#e5e7eb' }}
                        >
                            <View style={{ alignItems: 'center' }}>
                                <View style={{ borderWidth: 2, borderColor: '#9ca3af', borderRadius: 6, padding: 4, marginBottom: 8 }}>
                                    <View style={{ width: 12, height: 12, backgroundColor: '#9ca3af', borderRadius: 2 }} />
                                    <Text style={{ color: '#6b7280', fontWeight: 'bold', fontSize: 18, position: 'absolute', top: -4, left: 6 }}>+</Text>
                                </View>
                                <Text style={{ fontSize: 12, color: '#6b7280', fontWeight: 'bold', textAlign: 'center', paddingHorizontal: 8 }}>
                                    AJOUTER UNE PHOTO
                                </Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}