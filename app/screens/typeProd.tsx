import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronRight, Forklift, MoreHorizontal, SprayCan } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import StepHeader from '../components/StepHeader';
import Txt from '../components/ui/Txt';
import { useTranslation } from '../i18n';
import { colors, getThemeScheme, radius, shadows } from '../theme/tokens';

const CategoryItem = ({ icon, tint, title, subtitle, onPress, index }: { icon: React.ReactNode; tint: string; title: string; subtitle: string; onPress: () => void; index: number }) => (
  <Animated.View entering={FadeInDown.delay(index * 100).springify()}>
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
      activeOpacity={0.75}
      style={[{ flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: colors.card, padding: 18, borderRadius: radius.card, marginBottom: 14 }, shadows.listCard]}
    >
      <View style={{ width: 54, height: 54, borderRadius: 15, backgroundColor: tint, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="displayXBold" size={18} color={colors.ink}>{title}</Txt>
        <Txt variant="body" size={13} color={colors.inkSoft} style={{ marginTop: 3 }}>{subtitle}</Txt>
      </View>
      <ChevronRight size={20} color={colors.chevron} />
    </TouchableOpacity>
  </Animated.View>
);

export default function TypeProduitPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { barcode } = useLocalSearchParams();

  return (
    <View style={{ flex: 1, backgroundColor: colors.sheet }}>
      <StatusBar barStyle={getThemeScheme() === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.sheet} />
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
        <StepHeader step={1} title={t('step_1_title')} />

        <Txt variant="displayXBold" size={18} color={colors.ink} style={{ marginBottom: 18 }}>
          {t('what_is_it')}
        </Txt>

        <CategoryItem
          index={0}
          tint="rgba(210,75,51,0.14)"
          icon={<Forklift size={28} color={colors.red} />}
          title={t('food_category')}
          subtitle={t('food_subtitle')}
          onPress={() => router.push({ pathname: './ajouterProdInfo', params: { barcode, type: 'alimentation' } })}
        />

        <CategoryItem
          index={1}
          tint="rgba(240,138,60,0.16)"
          icon={<SprayCan size={28} color={colors.orange} />}
          title={t('cosmetics_category')}
          subtitle={t('cosmetics_subtitle')}
          onPress={() => router.push({ pathname: './ajouterCosmetique', params: { barcode } })}
        />

        <CategoryItem
          index={2}
          tint="rgba(139,128,115,0.16)"
          icon={<MoreHorizontal size={28} color={colors.inkSoft} />}
          title={t('other_category')}
          subtitle={t('other_subtitle')}
          onPress={() => router.push('/screens/unsupportedProduct' as any)}
        />
      </ScrollView>
    </View>
  );
}
