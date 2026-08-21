import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, PackageOpen, ScanLine } from 'lucide-react-native';
import React from 'react';
import { StatusBar, TouchableOpacity, View } from 'react-native';
import Txt from '../components/ui/Txt';
import { useTranslation } from '../i18n';
import { colors, getThemeScheme, radius, shadows } from '../theme/tokens';

export default function UnsupportedProductPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: colors.sheet, paddingHorizontal: 24 }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle={getThemeScheme() === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={colors.sheet} />

      <TouchableOpacity
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel={t('back')}
        style={[{ marginTop: 16, width: 46, height: 46, borderRadius: 23, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }, shadows.listCard]}
      >
        <ArrowLeft size={20} color={colors.accent} />
      </TouchableOpacity>

      <View style={{ flex: 1, justifyContent: 'center', paddingBottom: 48 }}>
        <View style={{ alignSelf: 'center', width: 92, height: 92, borderRadius: 30, backgroundColor: 'rgba(89,18,31,0.1)', alignItems: 'center', justifyContent: 'center' }}>
          <PackageOpen size={44} color={colors.accent} />
        </View>
        <Txt variant="display" size={34} color={colors.ink} style={{ textAlign: 'center', marginTop: 24, lineHeight: 40 }}>
          {t('unsupported_product_title')}
        </Txt>
        <Txt variant="body" size={15} color={colors.inkSoft} style={{ textAlign: 'center', marginTop: 14, lineHeight: 23 }}>
          {t('unsupported_product_body')}
        </Txt>
        <View style={{ backgroundColor: colors.card, borderRadius: radius.card, padding: 17, marginTop: 24, flexDirection: 'row', gap: 13, alignItems: 'center' }}>
          <ScanLine size={23} color={colors.green} />
          <Txt variant="medium" size={13.5} color={colors.inkSoft} style={{ flex: 1, lineHeight: 20 }}>
            {t('unsupported_product_hint')}
          </Txt>
        </View>
        <TouchableOpacity
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={t('understood')}
          activeOpacity={0.85}
          style={{ backgroundColor: colors.yellow, borderRadius: radius.cta, paddingVertical: 16, alignItems: 'center', marginTop: 22 }}
        >
          <Txt variant="bold" size={16} color={colors.inkOnYellow}>{t('understood')}</Txt>
        </TouchableOpacity>
      </View>
    </View>
  );
}
