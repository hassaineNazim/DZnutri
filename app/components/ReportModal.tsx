import { AlertTriangle, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, Modal, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { reportProduct } from '../services/report';

type Props = {
    visible: boolean;
    onClose: () => void;
    barcode: string;
};

export default function ReportModal({ visible, onClose, barcode }: Props) {
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

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
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>

                    {/* Header */}
                    <View style={styles.header}>
                        <View style={styles.titleRow}>
                            <AlertTriangle size={24} color="#EF4444" />
                            <Text style={styles.title}>Signaler une erreur</Text>
                        </View>
                        <TouchableOpacity onPress={onClose}>
                            <X size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>
                        Pourquoi le score de ce produit (Code: {barcode}) vous semble-t-il incorrect ?
                    </Text>

                    {/* Zone de texte */}
                    <TextInput
                        style={styles.input}
                        placeholder="Ex: Les calories sont fausses, il manque un additif..."
                        multiline
                        numberOfLines={4}
                        value={description}
                        onChangeText={setDescription}
                        textAlignVertical="top"
                    />

                    {/* Boutons */}
                    <TouchableOpacity
                        style={styles.submitButton}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={styles.submitText}>Envoyer le signalement</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 20,
    },
    modalContainer: {
        backgroundColor: 'white',
        borderRadius: 15,
        padding: 20,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 15,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        color: '#666',
        marginBottom: 15,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 10,
        height: 100,
        marginBottom: 20,
        backgroundColor: '#F9FAFB',
    },
    submitButton: {
        backgroundColor: '#EF4444',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    submitText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
});