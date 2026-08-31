import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, CheckCircle2, FlaskConical } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, StatusBar, View } from 'react-native';
import { BackButton } from '../components/ui/FormKit';
import CollapsibleHeader, { AnimatedScrollView, useCollapsibleHeader } from '../components/ui/CollapsibleHeader';
import ProductRatings from '../components/ProductRatings';
import RouteParamError from '../components/ui/RouteParamError';
import ScoreRing from '../components/ui/ScoreRing';
import Txt from '../components/ui/Txt';
import { getCosmeticCategoryLabel } from '../constants/cosmeticCategories';
import { useTranslation } from '../i18n';
import { CosmeticProduct, fetchCosmetic } from '../services/cosmetics';
import { colors, radius, scoreBand, shadows } from '../theme/tokens';
import { parseObjectRouteParam } from '../utils/routeParams';

// 1 = faible, 2 = modéré, 3 = élevé — labelKey est une clé i18n.
const dangerStyle = (level: number) => {
  if (level >= 3) return { color: colors.red, bg: 'rgba(210,75,51,0.14)', labelKey: 'risk_high' };
  if (level === 2) return { color: colors.orange, bg: 'rgba(240,138,60,0.16)', labelKey: 'risk_moderate' };
  return { color: '#b98a09', bg: 'rgba(242,194,46,0.2)', labelKey: 'risk_low' };
};

export default function CosmeticDetail() {
  const router = useRouter();
  const { lang, t } = useTranslation();
  const { product: productJson } = useLocalSearchParams();
  const initial = parseObjectRouteParam<CosmeticProduct>(productJson);
  const [product, setProduct] = useState<CosmeticProduct | null>(initial);
  const [loading, setLoading] = useState(false);
  const { scrollY, onScroll } = useCollapsibleHeader();

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

  if (!product) return <RouteParamError onBack={() => router.back()} />;

  const risky = product.risky_ingredients ?? [];
  const score = product.cosmetic_score;
  const hasScore = score !== null && score !== undefined;
  const band = scoreBand(hasScore ? score : null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />

      {/* ---- Entête bordeaux ---- */}
      <CollapsibleHeader
        title={product.product_name || t('product_details')}
        scrollY={scrollY}
        expandedHeight={224}
        compactLeft={<BackButton onPress={() => router.back()} />}
      >
      <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
        <BackButton onPress={() => router.back()} />

        {/* Bandeau produit */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 4 }}>
          {product.image_url ? (
            <Image source={{ uri: product.image_url }} style={{ width: 94, height: 94, borderRadius: 20, backgroundColor: 'rgba(244,234,214,0.15)' }} resizeMode="contain" />
          ) : (
            <View style={{ width: 94, height: 94, borderRadius: 20, backgroundColor: 'rgba(244,234,214,0.15)', alignItems: 'center', justifyContent: 'center' }}>
              <FlaskConical size={34} color={colors.rose3} />
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            {!!product.category && (
              <Txt variant="bold" size={11} color={colors.rose3} style={{ letterSpacing: 1.2, textTransform: 'uppercase' }} numberOfLines={1}>
                {getCosmeticCategoryLabel(product.category, lang)}
              </Txt>
            )}
            <Txt variant="display" size={23} color={colors.creamTitle} style={{ marginTop: 4, lineHeight: 26 }} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
              {product.product_name || t('no_name')}
            </Txt>
            <Txt variant="body" size={12.5} color={colors.rose2} style={{ marginTop: 5 }} numberOfLines={1}>
              {product.brand || t('brand_unknown')}
            </Txt>
          </View>
          <View style={{ width: 60, alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <ScoreRing score={hasScore ? score : undefined} size={48} discColor={colors.cream} discRatio={0.78} fontSize={15} trackColor="rgba(244,234,214,0.25)" />
            <View style={{ maxWidth: 60, backgroundColor: band.color + '29', borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 4 }}>
              <Txt variant="bold" size={10.5} color={band.color} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.65}>
                {hasScore ? t(band.labelKey) || band.label : t('analysis_unavailable') || 'Non analysé'}
              </Txt>
            </View>
          </View>
        </View>
      </View>
      </CollapsibleHeader>

      {/* ---- Feuille crème ---- */}
      <View style={{ flex: 1, backgroundColor: colors.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
        <AnimatedScrollView contentContainerStyle={{ padding: 22, paddingTop: 246, paddingBottom: 80 }} showsVerticalScrollIndicator={false} onScroll={onScroll} scrollEventThrottle={16}>
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
        </AnimatedScrollView>
      </View>
    </View>
  );
}
