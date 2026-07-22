import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, CheckCircle2, FlaskConical } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ScrollView, StatusBar, View } from 'react-native';
import { BackButton } from '../components/ui/FormKit';
import ProductRatings from '../components/ProductRatings';
import ScoreRing from '../components/ui/ScoreRing';
import Txt from '../components/ui/Txt';
import { useTranslation } from '../i18n';
import { CosmeticProduct, fetchCosmetic } from '../services/cosmetics';
import { colors, radius, scoreBand, shadows } from '../theme/tokens';

// 1 = faible, 2 = modéré, 3 = élevé — labelKey est une clé i18n.
const dangerStyle = (level: number) => {
  if (level >= 3) return { color: colors.red, bg: 'rgba(210,75,51,0.14)', labelKey: 'risk_high' };
  if (level === 2) return { color: colors.orange, bg: 'rgba(240,138,60,0.16)', labelKey: 'risk_moderate' };
  return { color: '#b98a09', bg: 'rgba(242,194,46,0.2)', labelKey: 'risk_low' };
};

export default function CosmeticDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { product: productJson } = useLocalSearchParams();
  const initial: CosmeticProduct | null = productJson ? JSON.parse(productJson as string) : null;
  const [product, setProduct] = useState<CosmeticProduct | null>(initial);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product && !product.risky_ingredients && product.barcode) {
      setLoading(true);
      fetchCosmetic(product.barcode)
        .then((full) => full && setProduct(full))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.barcode]);

  if (!product) return null;

  const risky = product.risky_ingredients ?? [];
  const score = product.cosmetic_score;
  const hasScore = score !== null && score !== undefined;
  const band = scoreBand(hasScore ? score : null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />

      {/* ---- Entête bordeaux ---- */}
      <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
        <BackButton onPress={() => router.back()} />

        {/* Bandeau produit */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 20, marginBottom: 4 }}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={{ width: 104, height: 104, borderRadius: 20, backgroundColor: 'rgba(244,234,214,0.15)' }} resizeMode="contain" />
          ) : (
            <View style={{ width: 104, height: 104, borderRadius: 20, backgroundColor: 'rgba(244,234,214,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical size={34} color={colors.rose3} />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            {!!product.category && (
              <Txt variant="bold" size={11} color={colors.rose3} style={{ letterSpacing: 1.2, textTransform: 'uppercase' }} numberOfLines={1}>
                {product.category}
              </Txt>
            )}
            <Txt variant="display" size={24} color={colors.creamTitle} style={{ marginTop: 4, lineHeight: 28 }} numberOfLines={2}>
              {product.product_name || t('no_name')}
            </Txt>
            <Txt variant="body" size={12.5} color={colors.rose2} style={{ marginTop: 5 }} numberOfLines={1}>
              {product.brand || t('brand_unknown')}
            </Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 }}>
              <ScoreRing score={hasScore ? score : undefined} size={38} discColor={colors.cream} discRatio={0.78} fontSize={13} trackColor="rgba(244,234,214,0.25)" />
              <View style={{ backgroundColor: band.color + '29', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5 }}>
                <Txt variant="bold" size={12} color={band.color}>
                  {hasScore ? t(band.labelKey) || band.label : t('analysis_unavailable') || 'Non analysé'}
                </Txt>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* ---- Feuille crème ---- */}
      <View style={{ flex: 1, backgroundColor: colors.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, marginTop: 16, overflow: 'hidden' }}>
        <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
          {/* Ingrédients à risque */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={18} color={colors.red} />
            <Txt variant="displayXBold" size={20} color={colors.ink}>
              {t('risky_ingredients')} {risky.length > 0 ? `(${risky.length})` : ''}
            </Txt>
          </View>

          {risky.length === 0 ? (
            <View style={[{ backgroundColor: colors.card, borderRadius: radius.cardSm, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }, shadows.listCard]}>
              <CheckCircle2 size={22} color={colors.green} />
              <Txt variant="medium" size={14} color={colors.inkSoft} style={{ flex: 1 }}>
                {hasScore ? t('no_risky_ingredients') : t('composition_not_analyzed')}
              </Txt>
            </View>
          ) : (
            <View style={{ gap: 10 }}>
              {risky.map((ing, idx) => {
                const st = dangerStyle(ing.danger_level);
                return (
                  <View key={idx} style={[{ backgroundColor: colors.card, borderRadius: radius.cardSm, padding: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12 }, shadows.listCard]}>
                    <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: st.bg, alignItems: 'center', justifyContent: 'center' }}>
                      <FlaskConical size={20} color={st.color} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt variant="semibold" size={14.5} color={colors.ink} numberOfLines={1} style={{ textTransform: 'capitalize' }}>{ing.name}</Txt>
                      {ing.concern ? <Txt variant="body" size={12} color={colors.inkSoft} style={{ marginTop: 2 }} numberOfLines={2}>{ing.concern}</Txt> : null}
                    </View>
                    <View style={{ backgroundColor: st.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.pill }}>
                      <Txt variant="bold" size={11} color={st.color}>{t(st.labelKey)}</Txt>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* Composition INCI */}
          {product.ingredients_text ? (
            <>
              <Txt variant="displayXBold" size={20} color={colors.ink} style={{ marginTop: 24, marginBottom: 12 }}>{t('composition_inci')}</Txt>
              <View style={[{ backgroundColor: colors.card, borderRadius: radius.cardSm, padding: 16 }, shadows.listCard]}>
                <Txt variant="body" size={13.5} color={colors.inkSoft} style={{ lineHeight: 20 }}>{product.ingredients_text}</Txt>
              </View>
            </>
          ) : null}

          {loading ? (
            <View style={{ alignItems: 'center', marginTop: 24 }}>
              <ActivityIndicator color="#EC4899" />
            </View>
          ) : null}

          {/* Notes utilisateurs */}
          <ProductRatings barcode={product.barcode} />
        </ScrollView>
      </View>
    </View>
  );
}
