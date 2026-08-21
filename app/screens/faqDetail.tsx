import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { BadgeCheck, BarChart3, GraduationCap, HeartHandshake, Scale } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StatusBar, View } from 'react-native';
import { BackButton } from '../components/ui/FormKit';
import Txt from '../components/ui/Txt';
import { useTranslation } from '../i18n';
import { colors, radius, shadows } from '../theme/tokens';

const TOPICS = {
  mission: { titleKey: 'faq_mission_title', bodyKey: 'faq_mission_body', Icon: HeartHandshake },
  independant: { titleKey: 'faq_independent_title', bodyKey: 'faq_independent_body', Icon: BadgeCheck },
  finance: { titleKey: 'faq_funding_title', bodyKey: 'faq_funding_body', Icon: Scale },
  scoring: { titleKey: 'faq_scoring_title', bodyKey: 'faq_scoring_body', Icon: BarChart3 },
  team: { titleKey: 'faq_team_title', bodyKey: 'faq_team_body', Icon: GraduationCap },
} as const;

type Topic = keyof typeof TOPICS;

export default function FaqDetailPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const params = useLocalSearchParams<{ topic?: string }>();
  const topic = (params.topic && params.topic in TOPICS ? params.topic : 'mission') as Topic;
  const entry = TOPICS[topic];
  const Icon = entry.Icon;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />

      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 22 }}>
        <BackButton onPress={() => router.back()} />
        <Txt variant="display" size={32} color={colors.creamTitle} style={{ marginTop: 18, lineHeight: 38 }}>
          {t(entry.titleKey)}
        </Txt>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 50 }} showsVerticalScrollIndicator={false}>
          <View style={[{ backgroundColor: colors.card, borderRadius: radius.card, padding: 20 }, shadows.listCard]}>
            <View style={{ width: 50, height: 50, borderRadius: 16, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={25} color={colors.accent} />
            </View>
            <Txt variant="body" size={15} color={colors.inkSoft} style={{ lineHeight: 24, marginTop: 18 }}>
              {t(entry.bodyKey)}
            </Txt>
          </View>

          <View style={{ backgroundColor: 'rgba(242,194,46,0.16)', borderRadius: radius.cardSm, padding: 16, marginTop: 18 }}>
            <Txt variant="bold" size={13} color={colors.ink}>{t('faq_transparency_title')}</Txt>
            <Txt variant="body" size={13} color={colors.inkSoft} style={{ lineHeight: 20, marginTop: 5 }}>
              {t('faq_transparency_body')}
            </Txt>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}
