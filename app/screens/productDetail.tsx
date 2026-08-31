import { useLocalSearchParams, useRouter } from 'expo-router';
import { AlertTriangle, ArrowLeft, Heart, MoreHorizontal } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Image, ScrollView, StatusBar, TouchableOpacity, View } from 'react-native';
import AlternativesList from '../components/AlternativesList';
import ProductRatings from '../components/ProductRatings';
import ReportModal from '../components/ReportModal';
import CollapsibleHeader, { AnimatedScrollView, useCollapsibleHeader } from '../components/ui/CollapsibleHeader';
import RouteParamError from '../components/ui/RouteParamError';
import ScoreRing from '../components/ui/ScoreRing';
import Txt from '../components/ui/Txt';
import { useAllergenCheck } from '../hooks/useAllergenCheck';
import { useProductFavorite } from '../hooks/useProductFavorite';
import { useTranslation } from '../i18n';
import { api } from '../services/axios';
import { colors, gradeColors, radius, scoreBand, scoreGrade } from '../theme/tokens';
import { parseObjectRouteParam } from '../utils/routeParams';

type Product = {
  id: string;
  barcode?: string;
  product_name?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  image_url?: string;
  custom_score?: number;
  nutriscore_grade?: string;
  nova_group?: number;
  ecoscore_grade?: string;
  detail_custom_score?: { [key: string]: any };
  nutriments?: { [key: string]: any };
  additives_tags?: string[];
  additives_info?: { code: string; name: string; risk_level?: string; function?: string }[];
  ingredients_text?: string;
};

// "en:e322-lecithins" → { code: "E322", name: "Lecithins" }
const parseAdditive = (tag: string) => {
  const clean = tag.replace(/^[a-z]{2}:/, '');
  const dash = clean.indexOf('-');
  if (dash === -1) return { code: clean.toUpperCase(), name: '' };
  const code = clean.slice(0, dash).toUpperCase();
  const name = clean
    .slice(dash + 1)
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { code, name };
};

const isRisky = (risk?: string) => risk === 'high' || risk === 'danger' || risk === 'moderate';

// Niveau nutritionnel → { label, color } (échelle « négative » : plus c'est haut, pire).
function level(value: number, high: number, moderate: number, positive = false) {
  const bad = colors.redAlt;
  const mid = colors.orangeAlt;
  const good = colors.greenAlt;
  if (positive) {
    if (value > high) return { label: 'Faible', color: good };
    if (value > moderate) return { label: 'Moyen', color: mid };
    return { label: 'Faible', color: good };
  }
  if (value > high) return { label: 'Élevé', color: bad };
  if (value > moderate) return { label: 'Moyen', color: mid };
  return { label: 'Faible', color: good };
}

// ─── Barre de note A→E ───────────────────────────────────────────────────────
function NoteBar({ score }: { score?: number }) {
  const active = scoreGrade(score);
  const grades: ('A' | 'B' | 'C' | 'D' | 'E')[] = ['A', 'B', 'C', 'D', 'E'];
  return (
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end' }}>
      {grades.map((g) => {
        const on = g === active;
        return (
          <View key={g} style={{ flex: on ? 1.15 : 1, alignItems: 'center', gap: 4 }}>
            {on && <Txt variant="display" size={15} color={colors.ink}>{g}</Txt>}
            <View style={{ width: '100%', height: on ? 11 : 9, borderRadius: 6, backgroundColor: gradeColors[g] }} />
          </View>
        );
      })}
    </View>
  );
}

// ─── Carte nutrition ─────────────────────────────────────────────────────────
function NutritionCard({ letter, label, value, lvl }: { letter: string; label: string; value: string; lvl: { label: string; color: string } }) {
  return (
    <View style={{ width: '48%', backgroundColor: colors.card, borderRadius: radius.cardSm, padding: 14 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: lvl.color + '26', alignItems: 'center', justifyContent: 'center' }}>
          <Txt variant="display" size={15} color={lvl.color}>{letter}</Txt>
        </View>
        <Txt variant="body" size={12.5} color={colors.inkSoft}>{label}</Txt>
      </View>
      <Txt variant="displayXBold" size={20} color={colors.ink} style={{ marginTop: 10 }}>{value}</Txt>
      <View style={{ alignSelf: 'flex-start', marginTop: 8, backgroundColor: lvl.color, borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 4 }}>
        <Txt variant="bold" size={11} color={colors.white}>{lvl.label}</Txt>
      </View>
    </View>
  );
}

// ─── Alerte allergènes (version crème) ───────────────────────────────────────
function AllergenWarning({ ingredients }: { ingredients?: string }) {
  const { detectedAllergens, hasAllergies } = useAllergenCheck(ingredients);
  const { t } = useTranslation();
  if (!hasAllergies) return null;
  return (
    <View style={{ backgroundColor: '#FDECEA', borderWidth: 1, borderColor: '#f3c6bf', borderRadius: radius.cardSm, padding: 14, flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 }}>
      <View style={{ backgroundColor: 'rgba(210,75,51,0.14)', padding: 8, borderRadius: 20, marginRight: 12, marginTop: 2 }}>
        <AlertTriangle size={18} color={colors.red} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="bold" size={14} color={colors.red} style={{ marginBottom: 4 }}>
          {t('allergen_warning_title')}
        </Txt>
        <Txt variant="body" size={13} color="#b5503f" style={{ lineHeight: 18 }}>
          {t('allergen_warning_desc')}
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 }}>
          {detectedAllergens.map((a) => (
            <View key={a} style={{ backgroundColor: 'rgba(210,75,51,0.12)', borderWidth: 1, borderColor: '#f3c6bf', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }}>
              <Txt variant="bold" size={11} color={colors.red} style={{ textTransform: 'uppercase' }}>{t(a) || a}</Txt>
            </View>
          ))}
        </View>
        <Txt variant="body" size={11.5} color="#8f3c30" style={{ lineHeight: 16, marginTop: 8 }}>
          {t('allergen_warning_disclaimer')}
        </Txt>
      </View>
    </View>
  );
}

// ─── Écran ───────────────────────────────────────────────────────────────────
export default function ProductDetail() {
  const router = useRouter();
  const { t } = useTranslation();
  const { product: productJson } = useLocalSearchParams();
  const product = parseObjectRouteParam<Product>(productJson);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [fullProduct, setFullProduct] = useState<Product | null>(product);
  const { scrollY, onScroll } = useCollapsibleHeader();
  const scrollViewRef = useRef<ScrollView>(null);

  const barcodeToUse = fullProduct?.barcode || fullProduct?.id || product?.barcode || product?.id;
  const { isFavorite, toggleFavorite } = useProductFavorite(barcodeToUse || '', fullProduct || product);

  const handleSelectAlternative = (altProduct: Product) => {
    setFullProduct(altProduct);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  useEffect(() => {
    const nextProduct = parseObjectRouteParam<Product>(productJson);
    if (nextProduct) {
      setFullProduct(nextProduct);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    }
  }, [productJson]);

  useEffect(() => {
    const targetBarcode = fullProduct?.barcode || fullProduct?.id;
    if (targetBarcode && (!fullProduct?.ingredients_text || !fullProduct?.nutriments)) {
      (async () => {
        try {
          const res = await api.get(`/api/product/${targetBarcode}`);
          if (res.data?.product) setFullProduct(res.data.product);
        } catch (e) {
          if (__DEV__) console.log('[productDetail] Error fetching full product', e);
        }
      })();
    }
  }, [fullProduct?.barcode, fullProduct?.id, fullProduct?.ingredients_text, fullProduct?.nutriments]);

  if (!product || !fullProduct) return <RouteParamError onBack={() => router.back()} />;

  const nv = (key: string) => Math.round(Number(fullProduct.nutriments?.[key + '_100g'] ?? 0) * 10) / 10;
  const energy = Math.round(nv('energy-kcal'));
  const proteins = nv('proteins');
  const sugars = nv('sugars');
  const saturatedFat = nv('saturated-fat');
  const fiber = nv('fiber');
  const salt = nv('salt');

  const band = scoreBand(fullProduct.custom_score);
  const additives = fullProduct.additives_tags || [];
  const riskyCount = additives.filter((tag) => {
    const info = fullProduct.additives_info?.find((a) => a.code?.toLowerCase() === tag.replace(/^[a-z]{2}:/, '').split('-')[0]);
    return isRisky(info?.risk_level);
  }).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />

      {/* Entête bordeaux */}
      <CollapsibleHeader
        title={fullProduct.product_name || t('product_details')}
        scrollY={scrollY}
        expandedHeight={224}
        compactLeft={
          <RoundBtn onPress={() => router.back()} label={t('back')} compact>
            <ArrowLeft size={18} color={colors.bordeaux} />
          </RoundBtn>
        }
        compactRight={
          <RoundBtn onPress={() => setReportModalVisible(true)} label={t('report_error_title')} compact>
            <MoreHorizontal size={18} color={colors.bordeaux} />
          </RoundBtn>
        }
      >
      <View style={{ paddingHorizontal: 22, paddingTop: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <RoundBtn onPress={() => router.back()} label={t('back')}>
            <ArrowLeft size={20} color={colors.bordeaux} />
          </RoundBtn>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <RoundBtn onPress={() => toggleFavorite()} label={t('favorites')} selected={isFavorite}>
              <Heart size={20} color={isFavorite ? colors.red : colors.bordeaux} fill={isFavorite ? colors.red : 'none'} />
            </RoundBtn>
            <RoundBtn onPress={() => setReportModalVisible(true)} label={t('report_error_title')}>
              <MoreHorizontal size={20} color={colors.bordeaux} />
            </RoundBtn>
          </View>
        </View>

        {/* Bandeau produit */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 18, marginBottom: 4 }}>
          {fullProduct.image_url ? (
            <Image source={{ uri: fullProduct.image_url }} accessible={false} style={{ width: 94, height: 94, borderRadius: 20, backgroundColor: 'rgba(244,234,214,0.15)' }} resizeMode="contain" />
          ) : (
            <View style={{ width: 94, height: 94, borderRadius: 20, backgroundColor: 'rgba(244,234,214,0.15)' }} />
          )}
          <View style={{ flex: 1, minWidth: 0 }}>
            {!!(fullProduct.category || fullProduct.subcategory) && (
              <Txt variant="bold" size={11} color={colors.rose3} style={{ letterSpacing: 1.2, textTransform: 'uppercase' }} numberOfLines={1}>
                {fullProduct.subcategory || fullProduct.category}
              </Txt>
            )}
            <Txt variant="display" size={24} color={colors.creamTitle} style={{ marginTop: 4, lineHeight: 27 }} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.78}>
              {fullProduct.product_name}
            </Txt>
            <Txt variant="body" size={12.5} color={colors.rose2} style={{ marginTop: 5 }} numberOfLines={1}>
              {fullProduct.brand}
            </Txt>
          </View>
          <View style={{ width: 60, alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <ScoreRing score={fullProduct.custom_score} size={48} discColor={colors.cream} discRatio={0.78} fontSize={15} trackColor="rgba(244,234,214,0.25)" />
            <View style={{ maxWidth: 60, backgroundColor: band.color + '29', borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 4 }}>
              <Txt variant="bold" size={10.5} color={band.color} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
                {t(band.labelKey) || band.label}
              </Txt>
            </View>
          </View>
        </View>
      </View>
      </CollapsibleHeader>

      {/* Feuille crème */}
      <View style={{ flex: 1, backgroundColor: colors.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
        <AnimatedScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ padding: 22, paddingTop: 246, paddingBottom: 120 }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
        >
          {/* Barre de note A→E */}
          <NoteBar score={fullProduct.custom_score} />

          {/* Allergènes */}
          <AllergenWarning ingredients={fullProduct.ingredients_text} />

          {/* Additifs */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 24 }}>
            <Txt variant="displayXBold" size={22} color={colors.ink}>{t('additives') || 'Additifs'}</Txt>
            <Txt variant="bold" size={12.5} color={riskyCount > 0 ? colors.redAlt : colors.inkSoft}>
              {additives.length > 0 ? `${riskyCount} ${t('detected') || 'détectés'}` : t('none') || 'Aucun'}
            </Txt>
          </View>
          <View style={{ gap: 10, marginTop: 12 }}>
            {additives.length > 0 ? (
              additives.map((tag, idx) => {
                const info = fullProduct.additives_info?.find((a) => a.code?.toLowerCase() === tag.replace(/^[a-z]{2}:/, '').split('-')[0]);
                const { code, name } = parseAdditive(tag);
                const risky = isRisky(info?.risk_level);
                return (
                  <View key={idx} style={{ backgroundColor: colors.card, borderRadius: radius.cardSm, padding: 13, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={{ backgroundColor: risky ? colors.redAlt : colors.greenAlt, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 6 }}>
                      <Txt variant="bold" size={12.5} color={colors.white}>{code}</Txt>
                    </View>
                    <Txt variant="semibold" size={14.5} color={colors.ink} style={{ flex: 1 }} numberOfLines={1}>
                      {name || info?.name || info?.function || '—'}
                    </Txt>
                    <Txt variant="bold" size={12} color={risky ? colors.redAlt : colors.greenAlt}>
                      {risky ? t('risk') || 'Risque' : t('safe') || 'Sûr'}
                    </Txt>
                  </View>
                );
              })
            ) : (
              <View style={{ backgroundColor: colors.card, borderRadius: radius.cardSm, padding: 16 }}>
                <Txt variant="body" size={13} color={colors.inkSoft} style={{ fontStyle: 'italic' }}>
                  {t('no_additives') || 'Aucun additif à déclarer.'}
                </Txt>
              </View>
            )}
          </View>

          {/* Nutrition */}
          <Txt variant="displayXBold" size={22} color={colors.ink} style={{ marginTop: 24 }}>
            {t('nutritional_info') || 'Informations nutritionnelles'}
          </Txt>
          {/* rowGap (pas gap) : justifyContent:'space-between' gère déjà l'écart
              horizontal. Un gap général s'ajoutait à 48.5%+48.5%, dépassant
              100% sur les écrans étroits et forçant les cartes en 1 colonne. */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10, marginTop: 12 }}>
            <NutritionCard letter="É" label={t('energy') || 'Énergie'} value={`${energy} kcal`} lvl={level(energy, 500, 300)} />
            <NutritionCard letter="G" label={t('carbs') || 'Glucides'} value={`${sugars} g`} lvl={level(sugars, 20, 10)} />
            <NutritionCard letter="P" label={t('proteins') || 'Protéines'} value={`${proteins} g`} lvl={level(proteins, 10, 5, true)} />
            <NutritionCard letter="L" label={t('sat_fat') || 'Gras saturés'} value={`${saturatedFat} g`} lvl={level(saturatedFat, 5, 1.5)} />
          </View>
          <View style={{ backgroundColor: colors.card, borderRadius: radius.cardSm, marginTop: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: colors.separator }}>
              <Txt variant="semibold" size={14.5} color={colors.ink}>{t('fiber') || 'Fibres'}</Txt>
              <Txt variant="displayXBold" size={14.5} color={colors.ink}>{fiber} g</Txt>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 14, paddingHorizontal: 16 }}>
              <Txt variant="semibold" size={14.5} color={colors.ink}>{t('salt') || 'Sel'}</Txt>
              <Txt variant="displayXBold" size={14.5} color={colors.ink}>{salt} g</Txt>
            </View>
          </View>

          {/* Notes utilisateurs */}
          <ProductRatings barcode={fullProduct.barcode || fullProduct.id} />

          {/* Dans le flux, sous la notation : cette section ne recouvre plus la fiche. */}
          <AlternativesList
            barcode={fullProduct.barcode || fullProduct.id}
            currentScore={fullProduct.custom_score}
            onSelectProduct={handleSelectAlternative}
          />
        </AnimatedScrollView>
      </View>

      <ReportModal visible={reportModalVisible} onClose={() => setReportModalVisible(false)} barcode={fullProduct.barcode || fullProduct.id} />
    </View>
  );
}

function RoundBtn({ children, onPress, label, selected, compact = false }: { children: React.ReactNode; onPress: () => void; label: string; selected?: boolean; compact?: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      activeOpacity={0.75}
      style={{ width: compact ? 38 : 46, height: compact ? 38 : 46, borderRadius: 23, backgroundColor: colors.cream, alignItems: 'center', justifyContent: 'center' }}
    >
      {children}
    </TouchableOpacity>
  );
}
