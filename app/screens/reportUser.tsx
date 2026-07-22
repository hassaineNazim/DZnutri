import { Stack, useRouter } from 'expo-router';
import { ChevronRight, HelpCircle, ScanLine, XCircle } from 'lucide-react-native';
import React from 'react';
import { ScrollView, TouchableOpacity, View } from 'react-native';
import { BackButton } from '../components/ui/FormKit';
import Txt from '../components/ui/Txt';
import { useTranslation } from '../i18n';
import { colors, radius, shadows } from '../theme/tokens';

export default function ReportUserPage() {
    const router = useRouter();
    const { t } = useTranslation();

    const handleProblemPress = (_problemType: string) => {
        router.push('/screens/autreProbleme');
    };

    const openFAQ = (question: string) => {
        console.log(`Ouverture FAQ : ${question}`);
    };

    return (
        <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* ---- Entête bordeaux ---- */}
            <View style={{ paddingHorizontal: 26, paddingTop: 18, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <BackButton onPress={() => router.back()} />
                <Txt variant="display" size={26} color={colors.creamTitle} style={{ flex: 1, letterSpacing: -0.5 }} numberOfLines={1}>
                    {t('a_problem') || 'Signaler un problème'}
                </Txt>
            </View>

            {/* ---- Feuille crème ---- */}
            <View style={{ flex: 1, backgroundColor: colors.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
                <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                    <SectionLabel>Problèmes généraux</SectionLabel>
                    <Card>
                        <Row icon={<ScanLine size={19} color={colors.red} />} tint="rgba(210,75,51,0.14)" label="Le scan ne fonctionne pas" onPress={() => handleProblemPress('scan_broken')} />
                        <Row icon={<XCircle size={19} color={colors.orange} />} tint="rgba(240,138,60,0.16)" label="Le produit n'a pas de code-barres" onPress={() => handleProblemPress('no_barcode')} />
                        <Row icon={<HelpCircle size={19} color={colors.inkSoft} />} tint="rgba(139,128,115,0.16)" label="Autre problème" onPress={() => handleProblemPress('other')} last />
                    </Card>

                    <View style={{ height: 24 }} />
                    <SectionLabel>À propos de Remo Scan</SectionLabel>
                    <Card>
                        <Row label="Quelle est la mission de Remo Scan ?" onPress={() => openFAQ('mission')} />
                        <Row label="Remo Scan est-il indépendant ?" onPress={() => openFAQ('independant')} />
                        <Row label="Comment est financée l'application ?" onPress={() => openFAQ('finance')} />
                        <Row label="Comment sont notés les produits ?" onPress={() => openFAQ('scoring')} />
                        <Row label="Qui est derrière Remo Scan ?" onPress={() => openFAQ('team')} />
                        <Row label="Autres questions" onPress={() => openFAQ('other_faq')} last />
                    </Card>
                </ScrollView>
            </View>
        </View>
    );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
    return (
        <Txt variant="bold" size={11.5} color={colors.inkSoft} style={{ letterSpacing: 1.5, marginBottom: 12 }}>
            {String(children).toUpperCase()}
        </Txt>
    );
}
function Card({ children }: { children: React.ReactNode }) {
    return (
        <View style={[{ backgroundColor: colors.card, borderRadius: radius.card, overflow: 'hidden' }, shadows.listCard]}>
            {children}
        </View>
    );
}
function Row({ icon, tint, label, onPress, last = false }: { icon?: React.ReactNode; tint?: string; label: string; onPress: () => void; last?: boolean }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            activeOpacity={0.65}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.separator }}
        >
            {icon ? (
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>{icon}</View>
            ) : null}
            <Txt variant="semibold" size={15} color={colors.ink} style={{ flex: 1 }}>{label}</Txt>
            <ChevronRight size={20} color={colors.chevron} />
        </TouchableOpacity>
    );
}
