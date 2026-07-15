import { useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronDown } from 'lucide-react-native';
import React, { useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import StepHeader from '../components/StepHeader';
import Txt from '../components/ui/Txt';
import { useTranslation } from '../i18n';
import { colors, fonts, radius, shadows } from '../theme/tokens';

const TECHNICAL_CATEGORIES = [
  { label: 'Solide (Standard)', value: 'solid' },
  { label: 'Boissons / Liquides', value: 'boissons' },
  { label: 'Matières Grasses / Huiles', value: 'matières grasses' },
  { label: 'Fromages', value: 'fromages' },
  { label: 'Eau', value: 'eau' },
];

export default function AjouterProduitInfoPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const { barcode } = useLocalSearchParams<{ barcode: string }>();
  const { type } = useLocalSearchParams<{ type: string }>();

  const [productName, setProductName] = useState('');
  const [brand, setBrand] = useState('');
  const [typeSpecifique, settypeSpecifique] = useState(TECHNICAL_CATEGORIES[0]);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const [nameError, setNameError] = useState('');
  const [brandError, setBrandError] = useState('');

  const handleNext = () => {
    let isValid = true;
    if (!productName.trim()) { setNameError(t('fill_all_fields')); isValid = false; } else setNameError('');
    if (!brand.trim()) { setBrandError(t('fill_all_fields')); isValid = false; } else setBrandError('');
    if (!isValid) return;

    router.push({
      pathname: './ajouterProdPhoto',
      params: { barcode, type, typeSpecifique: typeSpecifique.value, productName, brand },
    });
  };

  const inputStyle = (error?: string) => ({
    backgroundColor: '#f6efe0',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: error ? colors.red : '#e7ddc9',
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: colors.ink,
    fontFamily: fonts.sans,
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1, backgroundColor: colors.cream }}>
      <ScrollView contentContainerStyle={{ padding: 24, paddingTop: 16 }} showsVerticalScrollIndicator={false}>
        <StepHeader step={2} title={t('step_2_title')} />

        <Animated.View entering={FadeInDown.delay(80).springify()} style={[{ backgroundColor: colors.white, padding: 20, borderRadius: radius.card }, shadows.listCard]}>
          <Txt variant="displayXBold" size={18} color={colors.ink} style={{ marginBottom: 18 }}>{t('product_details')}</Txt>

          {/* Code-barres (lecture seule) */}
          <View style={{ marginBottom: 16 }}>
            <Txt variant="medium" size={13} color={colors.inkSoft} style={{ marginBottom: 8, marginLeft: 2 }}>{t('barcode')}</Txt>
            <View style={{ backgroundColor: '#efe6d3', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12 }}>
              <Txt variant="medium" size={14} color={colors.inkSoft}>{barcode}</Txt>
            </View>
          </View>

          {/* Nom du produit */}
          <View style={{ marginBottom: 16 }}>
            <Txt variant="medium" size={13} color={colors.inkSoft} style={{ marginBottom: 8, marginLeft: 2 }}>{t('product_name')}</Txt>
            <TextInput
              style={inputStyle(nameError)}
              placeholder={t('product_name_placeholder')}
              placeholderTextColor={colors.inkMeta}
              value={productName}
              onChangeText={(text) => { setProductName(text); if (text.trim()) setNameError(''); }}
            />
            {nameError ? <Txt variant="medium" size={12} color={colors.red} style={{ marginTop: 4, marginLeft: 2 }}>{nameError}</Txt> : null}
          </View>

          {/* Marque */}
          <View style={{ marginBottom: 16 }}>
            <Txt variant="medium" size={13} color={colors.inkSoft} style={{ marginBottom: 8, marginLeft: 2 }}>{t('brand')}</Txt>
            <TextInput
              style={inputStyle(brandError)}
              placeholder={t('brand_placeholder')}
              placeholderTextColor={colors.inkMeta}
              value={brand}
              onChangeText={(text) => { setBrand(text); if (text.trim()) setBrandError(''); }}
            />
            {brandError ? <Txt variant="medium" size={12} color={colors.red} style={{ marginTop: 4, marginLeft: 2 }}>{brandError}</Txt> : null}
          </View>

          {/* Type spécifique (dropdown) */}
          <View style={{ marginBottom: 22 }}>
            <Txt variant="medium" size={13} color={colors.inkSoft} style={{ marginBottom: 8, marginLeft: 2 }}>
              Type spécifique (pour le calcul du score)
            </Txt>
            <TouchableOpacity
              onPress={() => setDropdownVisible(true)}
              style={{ backgroundColor: '#f6efe0', paddingHorizontal: 14, paddingVertical: 13, borderRadius: 12, borderWidth: 1.5, borderColor: '#e7ddc9', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
            >
              <Txt variant="semibold" size={15} color={colors.ink}>{typeSpecifique.label}</Txt>
              <ChevronDown size={20} color={colors.inkSoft} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleNext} activeOpacity={0.85} style={{ backgroundColor: colors.yellow, paddingVertical: 16, borderRadius: radius.cta, alignItems: 'center' }}>
            <Txt variant="bold" size={16} color={colors.inkOnYellow}>{t('next')}</Txt>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Modal dropdown */}
      <Modal visible={dropdownVisible} transparent animationType="fade" onRequestClose={() => setDropdownVisible(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(30,18,12,0.55)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setDropdownVisible(false)}>
          <Pressable style={[{ backgroundColor: colors.cream, width: '82%', borderRadius: 22, overflow: 'hidden' }, shadows.resultCard]} onPress={(e) => e.stopPropagation()}>
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#e7ddc9' }}>
              <Txt variant="displayXBold" size={18} color={colors.ink} style={{ textAlign: 'center' }}>Choisir un type</Txt>
            </View>
            <FlatList
              data={TECHNICAL_CATEGORIES}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => {
                const active = item.value === typeSpecifique.value;
                return (
                  <TouchableOpacity
                    style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#efe6d3', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: active ? 'rgba(89,18,31,0.06)' : 'transparent' }}
                    onPress={() => { settypeSpecifique(item); setDropdownVisible(false); }}
                  >
                    <Txt variant={active ? 'bold' : 'medium'} size={15} color={active ? colors.bordeaux : colors.ink}>{item.label}</Txt>
                    {active && <Check size={20} color={colors.bordeaux} />}
                  </TouchableOpacity>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </KeyboardAvoidingView>
  );
}
