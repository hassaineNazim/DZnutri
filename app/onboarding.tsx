import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, StatusBar, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ScoreRing from './components/ui/ScoreRing';
import Txt from './components/ui/Txt';
import { useTranslation } from './i18n';
import { colors, radius, scoreBand, shadows } from './theme/tokens';

export const ONBOARDING_KEY = 'hasSeenOnboarding';

// Cartes de démonstration empilées (façon maquette).
const DEMO = [
  { name: 'Selecto Cola', brand: 'Hamoud Boualem', score: 32, rot: '-5deg', top: 6, left: 4 },
  { name: 'Soummam', brand: 'Yaourt · 125 g', score: 82, rot: '4deg', top: 96, left: 40 },
  { name: 'Tchina Orange', brand: 'Ramy', score: 48, rot: '-3deg', top: 186, left: 8 },
  { name: 'El Mordjene', brand: 'Cebon · 700 g', score: 12, rot: '3deg', top: 276, left: 36 },
];

function DemoCard({ item }: { item: (typeof DEMO)[number] }) {
  const band = scoreBand(item.score);
  return (
    <View
      style={[
        {
          position: 'absolute',
          top: item.top,
          left: item.left,
          width: 256,
          transform: [{ rotate: item.rot }],
          backgroundColor: colors.card,
          borderRadius: radius.card,
          padding: 12,
          paddingHorizontal: 14,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 13,
        },
        shadows.floatCard,
      ]}
    >
      <View style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.thumbBg }} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt variant="displayXBold" size={19} color={colors.ink} numberOfLines={1}>{item.name}</Txt>
        <Txt variant="body" size={12.5} color={colors.inkSoft} numberOfLines={1} style={{ marginTop: 3 }}>{item.brand}</Txt>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 7 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: band.color }} />
          <Txt variant="semibold" size={12} color={band.color}>{band.label}</Txt>
        </View>
      </View>
      <ScoreRing score={item.score} size={50} animated={false} fontSize={16} />
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { t } = useTranslation();

  const finish = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, '1');
    } catch {}
    router.replace('/auth');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />

      {/* ScrollView (au lieu d'un View flex fixe) : sur les écrans étroits/
          courts, le titre passe sur plus de lignes et poussait le bouton
          "Commencer" hors de l'écran, sans aucun moyen d'y accéder. */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 26, paddingTop: 16, paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Cartes empilées */}
        <Animated.View entering={FadeInDown.duration(600)} style={{ height: 372, marginTop: 18 }}>
          {DEMO.map((item) => (
            <DemoCard key={item.name} item={item} />
          ))}
        </Animated.View>

        {/* Bloc bas */}
        <View style={{ marginTop: 'auto', paddingTop: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
            <Txt variant="display" size={40} color={colors.creamTitle} style={{ flex: 1, lineHeight: 42, letterSpacing: -0.5 }}>
              {t('onboarding_title_1') || 'Manger mieux, '}
              <Txt variant="displayItalic" size={40} color={colors.yellow}>{t('onboarding_title_2') || 'scan par scan.'}</Txt>
            </Txt>
            <Image
              source={require('../assets/images/mascotte-betterave.png')}
              style={{ width: 110, height: 110, marginTop: -30, resizeMode: 'contain' }}
            />
          </View>

          <Txt variant="body" size={14} color={colors.rose} style={{ marginTop: 14, lineHeight: 21 }}>
            {t('onboarding_subtitle') || "Décryptez les étiquettes des produits algériens en un clin d'œil."}
          </Txt>

          <TouchableOpacity
            onPress={finish}
            activeOpacity={0.85}
            style={{ marginTop: 20, backgroundColor: colors.yellow, borderRadius: radius.cta, paddingVertical: 22, alignItems: 'center' }}
          >
            <Txt variant="bold" size={19} color={colors.inkOnYellow}>{t('start') || 'Commencer'} →</Txt>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
