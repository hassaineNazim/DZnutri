import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, ChevronRight, HelpCircle, ScanLine, XCircle } from 'lucide-react-native';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReportUserPage() {
    const router = useRouter();

    // Fonction générique pour gérer le clic sur un problème
    const handleProblemPress = (problemType: string) => {
        router.push('./autreProbleme');
    };

    const openFAQ = (question: string) => {
        console.log(`Ouverture FAQ : ${question}`);
        // router.push('/faq/detail');
    };

    return (
        <SafeAreaView className="flex-1 bg-white dark:bg-[#181A20]">
            <Stack.Screen options={{ headerShown: false }} />

            {/* --- HEADER --- */}
            <View className="flex-row items-center p-4 border-b border-gray-100 dark:border-gray-800">
                <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
                    <ArrowLeft size={24} color="#374151" className="dark:text-white" />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 dark:text-white ml-2">
                    Signaler un problème
                </Text>
            </View>

            <ScrollView className="flex-1">

                {/* --- SECTION 1 : PROBLÈMES GÉNÉRAUX --- */}
                <View className="mt-6 mb-2 px-4">
                    <Text className="text-sm font-semibold text-gray-500 uppercase dark:text-gray-400">
                        Problèmes généraux
                    </Text>
                </View>

                <View className="bg-white dark:bg-[#1F2937] border-y border-gray-100 dark:border-gray-800">
                    <ListItem
                        icon={<ScanLine size={20} color="#EF4444" />}
                        label="Le scan ne fonctionne pas"
                        onPress={() => handleProblemPress("scan_broken")}
                    />
                    <ListItem
                        icon={<XCircle size={20} color="#F59E0B" />}
                        label="Le produit n'a pas de code-barres"
                        onPress={() => handleProblemPress("no_barcode")}
                    />
                    <ListItem
                        icon={<HelpCircle size={20} color="#6B7280" />}
                        label="Autre problème"
                        onPress={() => handleProblemPress("other")}
                        isLast
                    />
                </View>

                {/* --- SECTION 2 : À PROPOS (FAQ) --- */}
                <View className="mt-8 mb-2 px-4">
                    <Text className="text-sm font-semibold text-gray-500 uppercase dark:text-gray-400">
                        À propos de DZnutri
                    </Text>
                </View>

                <View className="bg-white dark:bg-[#1F2937] border-y border-gray-100 dark:border-gray-800 mb-10">
                    <ListItem label="Quelle est la mission de Remo Scan ?" onPress={() => openFAQ("mission")} />
                    <ListItem label="Remo Scan est-il indépendant ?" onPress={() => openFAQ("independant")} />
                    <ListItem label="Comment est financée l'application ?" onPress={() => openFAQ("finance")} />
                    <ListItem label="Comment sont notés les produits ?" onPress={() => openFAQ("scoring")} />
                    <ListItem label="Qui est derrière Remo Scan ?" onPress={() => openFAQ("team")} />
                    <ListItem label="Autres questions" onPress={() => openFAQ("other_faq")} isLast />
                </View>

            </ScrollView>
        </SafeAreaView>
    );
}

// --- COMPOSANT REUTILISABLE POUR LES LIGNES ---
const ListItem = ({ label, onPress, isLast, icon }: { label: string, onPress: () => void, isLast?: boolean, icon?: React.ReactNode }) => (
    <TouchableOpacity
        onPress={onPress}
        className={`flex-row items-center justify-between p-4 bg-white dark:bg-[#1F2937] active:bg-gray-50 dark:active:bg-gray-800 ${!isLast ? 'border-b border-gray-100 dark:border-gray-700' : ''}`}
    >
        <View className="flex-row items-center">
            {/* On affiche l'icône seulement si elle est fournie */}
            {icon && <View className="mr-3">{icon}</View>}
            <Text className="text-base text-gray-900 dark:text-white font-medium">{label}</Text>
        </View>
        <ChevronRight size={20} color="#9CA3AF" />
    </TouchableOpacity>
);