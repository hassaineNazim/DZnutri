import { ShieldCheck, Sprout } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { ScrollView, StatusBar, View } from 'react-native';
import { BackButton } from '../../components/ui/FormKit';
import Txt from '../../components/ui/Txt';
import { useTranslation } from '../../i18n';
import { colors, radius, shadows } from '../../theme/tokens';

export default function AproposPage() {
  const router = useRouter();
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}>
        <BackButton onPress={() => router.back()} />
        <Txt variant="display" size={38} color={colors.creamTitle} style={{ marginTop: 20 }}>
          {t('who_are_we')}
        </Txt>
      </View>

      <View style={{ flex: 1, backgroundColor: colors.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 48 }}>
          <AboutCard
            icon={<Sprout size={23} color={colors.green} />}
            title={t('about_mission_title')}
            body={t('about_mission_body')}
          />
          <AboutCard
            icon={<ShieldCheck size={23} color={colors.accent} />}
            title={t('about_independence_title')}
            body={t('about_independence_body')}
          />
          <Txt variant="body" size={12.5} color={colors.inkSoft} style={{ textAlign: 'center', marginTop: 8 }}>
            DZnutri · v1.0.0
          </Txt>
        </ScrollView>
      </View>
    </View>
  );
}

function AboutCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <View style={[{ backgroundColor: colors.card, borderRadius: radius.card, padding: 18, marginBottom: 16 }, shadows.listCard]}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </View>
      <Txt variant="displayXBold" size={19} color={colors.ink} style={{ marginTop: 14 }}>
        {title}
      </Txt>
      <Txt variant="body" size={14} color={colors.inkSoft} style={{ lineHeight: 21, marginTop: 7 }}>
        {body}
      </Txt>
    </View>
  );
}
