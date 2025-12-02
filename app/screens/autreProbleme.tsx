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
        <SafeAreaView className="flex-1 bg-white">
            <Stack.Screen options={{ headerShown: false }} />
            {/* HEADER */}
            <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-100">
                <View className="flex-row items-center">
                    <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                        <X size={24} color="black" />
                    </TouchableOpacity>
                    <Text className="text-xl font-bold text-gray-900 ml-2">Aide</Text>
                </View>

                <TouchableOpacity onPress={handleSubmit} disabled={loading || !description.trim()}>
                    {loading ? (
                        <ActivityIndicator color="#22C55E" />
                    ) : (
                        <Text className={`font-bold ${description.trim() ? 'text-green-600' : 'text-gray-300'}`}>
                            ENVOYER
                        </Text>
                    )}
                </TouchableOpacity>
            </View>

            {/* CONTENU */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                    <ScrollView contentContainerStyle={{ padding: 20 }}>

                        <Text className="text-gray-600 text-base mb-6">
                            Décrivez le problème rencontré :
                        </Text>

                        {/* Champ Texte (Ligne soulignée comme sur la photo) */}
                        <TextInput
                            className="text-lg text-gray-900 border-b border-gray-300 pb-2 mb-8"
                            placeholder=""
                            multiline
                            value={description}
                            onChangeText={setDescription}
                            autoFocus
                        />

                        {/* Zone Photo */}
                        <View>
                            {image ? (
                                <View className="relative w-32 h-32">
                                    <Image source={{ uri: image }} className="w-full h-full rounded-lg" />
                                    <TouchableOpacity
                                        onPress={() => setImage(null)}
                                        className="absolute -top-2 -right-2 bg-gray-200 rounded-full p-1"
                                    >
                                        <X size={16} color="black" />
                                    </TouchableOpacity>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={pickImage}
                                    className="w-32 h-32 bg-gray-100 rounded-lg items-center justify-center border border-gray-200"
                                >
                                    <View className="items-center">
                                        <View className="border-2 border-gray-400 rounded-md p-1 mb-2">
                                            <View className="w-3 h-3 bg-gray-400 rounded-sm" />
                                            {/* Simule l'icône "+" dans un carré */}
                                            <Text className="text-gray-500 font-bold text-lg absolute -top-1 left-1.5">+</Text>
                                        </View>
                                        <Text className="text-xs text-gray-500 font-bold text-center px-2">
                                            AJOUTER UNE PHOTO
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                        </View>

                    </ScrollView>
                </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}