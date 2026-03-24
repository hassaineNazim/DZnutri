import React, { useState } from 'react';
import { ActivityIndicator, Alert, Text, TextInput, TouchableOpacity, View, Dimensions, StyleSheet } from 'react-native';
import { reportProduct } from '../services/report';

type Props = {
    visible: boolean;
    onClose: () => void;
    barcode: string;
};

const { width, height } = Dimensions.get('window');

export default function ReportModal({ visible, onClose, barcode }: Props) {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    if (!visible) return null;

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert("Erreur", "Veuillez décrire le problème.");
            return;
        }

        setLoading(true);
        try {
            await reportProduct(barcode, description);
            Alert.alert("Merci !", "Votre signalement a été envoyé à l'équipe.");
            setDescription(''); // Reset
            onClose();
        } catch (error) {
            console.error("Erreur detaillée :", error);
            Alert.alert("Oups", "Impossible d'envoyer le signalement.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View 
            style={{ 
                position: 'absolute', 
                top: 0, left: 0, right: 0, bottom: 0, 
                width: width, 
                height: height,
                backgroundColor: 'rgba(0,0,0,0.6)', 
                justifyContent: 'center', 
                alignItems: 'center', 
                padding: 20,
                zIndex: 9999,
                elevation: 9999
            }}
            pointerEvents="auto"
        >
            <TouchableOpacity 
                style={StyleSheet.absoluteFillObject} 
                activeOpacity={1} 
                onPress={onClose} 
            />
            
            <View 
                style={{ 
                    width: '100%', 
                    maxWidth: 400, 
                    minHeight: 320, 
                    backgroundColor: 'white', 
                    borderRadius: 12, 
                    padding: 24, 
                    elevation: 10000,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 5,
                    zIndex: 10000 
                }}
                pointerEvents="auto"
            >
                {/* Header Text */}
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 8, textAlign: 'center' }}>
                    Signaler une erreur
                </Text>

                <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 20, textAlign: 'center' }}>
                    Pourquoi le score de ce produit ({barcode}) vous semble-t-il incorrect ?
                </Text>

                {/* Zone de texte */}
                <TextInput
                    style={{ borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, height: 120, marginBottom: 20, backgroundColor: '#F9FAFB', color: '#111827', textAlignVertical: 'top', fontSize: 16 }}
                    placeholder="Ex: Les calories sont fausses..."
                    placeholderTextColor="#9ca3af"
                    multiline
                    value={description}
                    onChangeText={setDescription}
                />

                {/* Boutons (Natifs pour être sûr que ça marche à 100%) */}
                {loading ? (
                    <ActivityIndicator size="large" color="#EF4444" style={{ marginVertical: 10 }} />
                ) : (
                    <View style={{ gap: 12 }}>
                        <TouchableOpacity 
                            onPress={handleSubmit} 
                            style={{ backgroundColor: '#EF4444', paddingVertical: 14, borderRadius: 8, alignItems: 'center', zIndex: 10001 }}
                        >
                            <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>Envoyer le signalement</Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            onPress={onClose} 
                            style={{ backgroundColor: '#E5E7EB', paddingVertical: 14, borderRadius: 8, alignItems: 'center', zIndex: 10001 }}
                        >
                            <Text style={{ color: '#374151', fontWeight: 'bold', fontSize: 16 }}>Fermer / Annuler</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        </View>
    );
}