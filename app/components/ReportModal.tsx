import React, { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslation } from '../i18n';
import { reportProduct } from '../services/report';
import { colors, radius, shadows } from '../theme/tokens';
import Txt from './ui/Txt';

type Props = {
    visible: boolean;
    onClose: () => void;
    barcode: string;
};

const { width, height } = Dimensions.get('window');

function AlertTriangle() {
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24">
            <Path
                fill={colors.red}
                d="M12 2 1 21h22L12 2zm0 6c.7 0 1.2.6 1.1 1.3l-.4 5a.7.7 0 0 1-1.4 0l-.4-5A1.1 1.1 0 0 1 12 8zm0 9.5a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z"
            />
        </Svg>
    );
}

export default function ReportModal({ visible, onClose, barcode }: Props) {
    const { t } = useTranslation();
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);

    if (!visible) return null;

    const handleSubmit = async () => {
        if (!description.trim()) {
            Alert.alert(t('error') || 'Erreur', t('report_empty') || 'Veuillez décrire le problème.');
            return;
        }

        setLoading(true);
        try {
            await reportProduct(barcode, description);
            Alert.alert(t('report_thanks') || 'Merci !', t('report_sent') || "Votre signalement a été envoyé à l'équipe.");
            setDescription('');
            onClose();
        } catch (error) {
            console.error('Erreur detaillée :', error);
            Alert.alert(t('oops') || 'Oups', t('report_failed') || "Impossible d'envoyer le signalement.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <View
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                width,
                height,
                backgroundColor: 'rgba(30,18,12,0.55)',
                justifyContent: 'flex-end',
                zIndex: 9999,
                elevation: 9999,
            }}
            pointerEvents="auto"
        >
            {/* Voile cliquable pour fermer */}
            <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                pointerEvents="box-none"
                style={{ justifyContent: 'flex-end' }}
            >
                {/* Feuille modale */}
                <View
                    style={[
                        {
                            backgroundColor: colors.cream,
                            borderTopLeftRadius: 28,
                            borderTopRightRadius: 28,
                            paddingHorizontal: 24,
                            paddingTop: 20,
                            paddingBottom: 30,
                        },
                        shadows.resultCard,
                    ]}
                >
                    {/* Poignée */}
                    <View style={{ width: 44, height: 5, borderRadius: 3, backgroundColor: '#d9cdb6', alignSelf: 'center', marginBottom: 20 }} />

                    {/* Titre */}
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 13, backgroundColor: 'rgba(210,75,51,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                            <AlertTriangle />
                        </View>
                        <Txt variant="display" size={24} color={colors.ink} style={{ flex: 1 }}>
                            {t('report_error_title') || 'Signaler une erreur'}
                        </Txt>
                    </View>

                    {/* Explication */}
                    <Txt variant="body" size={13.5} color={colors.inkSoft} style={{ lineHeight: 20, marginTop: 14 }}>
                        {t('report_error_why') || 'Pourquoi le score de ce produit'}{' '}
                        <Txt variant="semibold" size={13.5} color={colors.bordeaux}>({barcode})</Txt>{' '}
                        {t('report_error_why_end') || 'vous semble-t-il incorrect ?'}
                    </Txt>

                    {/* Champ de saisie */}
                    <TextInput
                        style={{
                            backgroundColor: colors.white,
                            borderWidth: 1.5,
                            borderColor: '#e7ddc9',
                            borderRadius: 18,
                            paddingHorizontal: 16,
                            paddingTop: 15,
                            paddingBottom: 15,
                            marginTop: 16,
                            minHeight: 100,
                            fontSize: 14,
                            color: colors.ink,
                            textAlignVertical: 'top',
                        }}
                        placeholder={t('report_placeholder') || 'Ex : les calories sont fausses…'}
                        placeholderTextColor={colors.inkMeta}
                        multiline
                        value={description}
                        onChangeText={setDescription}
                    />

                    {/* Bouton primaire */}
                    <TouchableOpacity
                        onPress={handleSubmit}
                        disabled={loading}
                        activeOpacity={0.85}
                        style={{ marginTop: 18, backgroundColor: colors.yellow, borderRadius: radius.cta, paddingVertical: 17, alignItems: 'center' }}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.inkOnYellow} />
                        ) : (
                            <Txt variant="bold" size={16} color={colors.inkOnYellow}>{t('send_report') || 'Envoyer le signalement'}</Txt>
                        )}
                    </TouchableOpacity>

                    {/* Bouton secondaire */}
                    <TouchableOpacity
                        onPress={onClose}
                        disabled={loading}
                        activeOpacity={0.85}
                        style={{ marginTop: 11, backgroundColor: 'rgba(89,18,31,0.08)', borderRadius: radius.cta, paddingVertical: 15, alignItems: 'center' }}
                    >
                        <Txt variant="bold" size={15} color={colors.bordeaux}>{t('close_cancel') || 'Fermer / Annuler'}</Txt>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}
