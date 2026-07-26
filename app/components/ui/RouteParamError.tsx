import { AlertCircle } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useTranslation } from '../../i18n';
import { colors, radius } from '../../theme/tokens';
import Txt from './Txt';

export default function RouteParamError({ onBack }: { onBack: () => void }) {
  const { t } = useTranslation();

  return (
    <View style={{ flex: 1, backgroundColor: colors.sheet, alignItems: 'center', justifyContent: 'center', padding: 28 }}>
      <AlertCircle size={48} color={colors.red} />
      <Txt variant="displayXBold" size={21} color={colors.ink} style={{ marginTop: 16, textAlign: 'center' }}>
        {t('invalid_product_link')}
      </Txt>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('back')}
        onPress={onBack}
        style={{ marginTop: 20, backgroundColor: colors.yellow, borderRadius: radius.pill, paddingHorizontal: 22, paddingVertical: 13 }}
      >
        <Txt variant="bold" size={15} color={colors.inkOnYellow}>{t('back')}</Txt>
      </Pressable>
    </View>
  );
}
