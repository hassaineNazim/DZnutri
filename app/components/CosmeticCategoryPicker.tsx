import { Check, ChevronDown, X } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, View } from 'react-native';
import { COSMETIC_CATEGORIES, getCosmeticCategoryLabel } from '../constants/cosmeticCategories';
import { useTranslation } from '../i18n';
import { colors, radius, shadows } from '../theme/tokens';
import Txt from './ui/Txt';

const PINK = '#EC4899';

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function CosmeticCategoryPicker({ value, onChange }: Props) {
  const [visible, setVisible] = useState(false);
  const { lang, t } = useTranslation();
  const selectedLabel = getCosmeticCategoryLabel(value, lang);

  const select = (nextValue: string) => {
    onChange(nextValue);
    setVisible(false);
  };

  return (
    <>
      <Pressable
        onPress={() => setVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={selectedLabel || t('category_optional')}
        accessibilityState={{ expanded: visible }}
        style={({ pressed }) => [{
          minHeight: 54,
          paddingHorizontal: 15,
          borderRadius: 14,
          borderWidth: 1.5,
          borderColor: visible ? PINK : colors.border,
          backgroundColor: colors.card,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          opacity: pressed ? 0.82 : 1,
        }]}
      >
        <Txt variant="body" size={15} color={selectedLabel ? colors.ink : colors.inkMeta} numberOfLines={1} style={{ flex: 1 }}>
          {selectedLabel || t('category_optional')}
        </Txt>
        <ChevronDown size={19} color={colors.inkMeta} />
      </Pressable>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)} statusBarTranslucent>
        <View style={styles.modalRoot}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVisible(false)} accessibilityLabel={t('close')} />
          <View style={[styles.sheet, { backgroundColor: colors.card }, shadows.floatCard]}>
            <View style={[styles.header, { borderBottomColor: colors.separator }]}>
              <View style={{ flex: 1 }}>
                <Txt variant="displayXBold" size={20} color={colors.ink}>{t('select_cosmetic_category')}</Txt>
                <Txt variant="body" size={12.5} color={colors.inkMeta} style={{ marginTop: 3 }}>{COSMETIC_CATEGORIES.length} {t('categories_available')}</Txt>
              </View>
              <Pressable
                onPress={() => setVisible(false)}
                accessibilityRole="button"
                accessibilityLabel={t('close')}
                style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center' }}
              >
                <X size={19} color={colors.ink} />
              </Pressable>
            </View>

            <FlatList
              data={COSMETIC_CATEGORIES}
              keyExtractor={(item) => item.value}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 14, paddingBottom: 28 }}
              ListHeaderComponent={(
                <Pressable
                  onPress={() => select('')}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: !value }}
                  style={[styles.option, { borderBottomColor: colors.separator }]}
                >
                  <Txt variant="body" size={15} color={colors.inkSoft} style={{ flex: 1 }}>{t('category_not_specified')}</Txt>
                  {!value ? <Check size={18} color={PINK} strokeWidth={3} /> : null}
                </Pressable>
              )}
              renderItem={({ item }) => {
                const selected = value === item.value;
                return (
                  <Pressable
                    onPress={() => select(item.value)}
                    accessibilityRole="radio"
                    accessibilityLabel={item.labels[lang]}
                    accessibilityState={{ selected }}
                    style={[styles.option, { borderBottomColor: colors.separator, backgroundColor: selected ? 'rgba(236,72,153,0.10)' : 'transparent' }]}
                  >
                    <Txt variant={selected ? 'semibold' : 'body'} size={15} color={selected ? PINK : colors.ink} style={{ flex: 1 }}>
                      {item.labels[lang]}
                    </Txt>
                    {selected ? <Check size={18} color={PINK} strokeWidth={3} /> : null}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20,17,16,0.54)',
  },
  sheet: {
    maxHeight: '80%',
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 17,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  option: {
    minHeight: 52,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
  },
});
