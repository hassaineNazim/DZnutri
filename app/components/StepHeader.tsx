import { useRouter } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from '../i18n';
import { colors, shadows } from '../theme/tokens';
import Txt from './ui/Txt';

type StepHeaderProps = {
    step: number;
    title: string;
    totalSteps?: number;
};

export default function StepHeader({ step, title, totalSteps = 3 }: StepHeaderProps) {
    const { t } = useTranslation();
    const router = useRouter();

    return (
        <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 18, gap: 12 }}>
                <Pressable
                    onPress={() => router.back()}
                    style={[{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' }, shadows.listCard]}
                >
                    <ArrowLeft size={20} color={colors.bordeaux} />
                </Pressable>
                <View style={{ flex: 1 }}>
                    <Txt variant="bold" size={12} color={colors.bordeaux} style={{ letterSpacing: 1.2 }}>
                        {(t('add_product_title') || 'Ajouter un produit').toUpperCase()}
                    </Txt>
                    <Txt variant="display" size={26} color={colors.ink} style={{ marginTop: 2 }}>{title}</Txt>
                </View>
            </View>

            {/* Barre de progression */}
            <View style={{ flexDirection: 'row', height: 6, borderRadius: 3, backgroundColor: '#e6dcc7' }}>
                {[...Array(totalSteps)].map((_, i) => (
                    <View
                        key={i}
                        style={{ flex: 1, backgroundColor: i < step ? colors.bordeaux : 'transparent', marginLeft: i > 0 ? 2 : 0, borderRadius: 3 }}
                    />
                ))}
            </View>
            <Txt variant="medium" size={12} color={colors.inkSoft} style={{ textAlign: 'right', marginTop: 6 }}>
                {step}/{totalSteps}
            </Txt>
        </View>
    );
}
