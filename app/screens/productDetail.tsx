import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  Droplets,
  Dumbbell,
  Flame,
  FlaskConical,
  Heart,
  Leaf,
  MoreHorizontal,
  Wheat,
} from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import {
  Image,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AlternativesList from '../components/AlternativesList';
import ProductRatings from '../components/ProductRatings';
import ReportModal from '../components/ReportModal';
import { useAllergenCheck } from '../hooks/useAllergenCheck';
import { useProductFavorite } from '../hooks/useProductFavorite';
import { useTranslation } from '../i18n';

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

// ─── Helpers ────────────────────────────────────────────────────────────────

// Palette claire/sombre partagée par l'écran et ses sous-composants.
// (Les styles de cet écran sont des objets inline : on résout les couleurs ici
// plutôt que via des classes dark: de NativeWind.)
const usePalette = () => {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  return {
    isDark,
    bg: isDark ? '#181A20' : '#F9FAFB',
    card: isDark ? '#1F2937' : '#FFFFFF',
    cardAlt: isDark ? '#374151' : '#F3F4F6',   // tuile nutrition dans la carte
    divider: isDark ? '#374151' : '#F9FAFB',
    textStrong: isDark ? '#F9FAFB' : '#111827',
    textBody: isDark ? '#D1D5DB' : '#374151',
    textMuted: isDark ? '#9CA3AF' : '#6B7280',
    icon: isDark ? '#D1D5DB' : '#374151',
  };
};

const getScoreColor = (score?: number) => {
  if (score === undefined) return '#9CA3AF';
  if (score >= 70) return '#22C55E';  // vert  (≥70)
  if (score >= 35) return '#F97316';  // orange (≥35)
  return '#EF4444';                   // rouge  (<35)
};

const getScoreBgColor = (score?: number) => {
  if (score === undefined) return '#F3F4F6';
  if (score >= 70) return '#DCFCE7';  // green-100
  if (score >= 35) return '#FFEDD5';  // orange-100
  return '#FEE2E2';                   // red-100
};

const getLevelColor = (value: number, high: number, moderate: number) => {
  if (value > high) return '#EF4444';
  if (value > moderate) return '#F97316';
  return '#22C55E';
};

const getPositiveLevelColor = (value: number, high: number, moderate: number) => {
  if (value > high) return '#22C55E';
  if (value > moderate) return '#F97316';
  return '#EF4444';
};

/** "en:e322-lecithins" → { code: "E322", name: "Lecithins" } */
const parseAdditive = (tag: string) => {
  const clean = tag.replace(/^[a-z]{2}:/, '');
  const dash = clean.indexOf('-');
  if (dash === -1) return { code: clean.toUpperCase(), name: '' };
  const code = clean.slice(0, dash).toUpperCase();
  const name = clean
    .slice(dash + 1)
    .split('-')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { code, name };
};

const getAdditiveColor = (index: number, riskLevel?: string) => {
  if (riskLevel === 'high' || riskLevel === 'danger') return '#EF4444';
  if (riskLevel === 'moderate') return '#F97316';
  if (riskLevel === 'low') return '#22C55E';
  return index % 3 === 0 ? '#22C55E' : index % 3 === 1 ? '#F97316' : '#22C55E';
};

// ─── Semi-circle gauge (speedometer style) ──────────────────────────────────

const SemiCircleGauge = ({ score = 0, size = 120 }: { score: number; size?: number }) => {
  const sw = 11; // strokeWidth
  const r = (size - sw) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const color = getScoreColor(score);

  // Convert "math angle" (y-up) to SVG point (y-down)
  const pt = (deg: number) => ({
    x: +(cx + r * Math.cos((deg * Math.PI) / 180)).toFixed(3),
    y: +(cy - r * Math.sin((deg * Math.PI) / 180)).toFixed(3),
  });

  const L = pt(180); // left
  const R = pt(0);   // right
  const scoreAngle = 180 - (score / 100) * 180;
  const S = pt(scoreAngle);

  // sweep=1 (clockwise in SVG, y-down) traces the TOP arc from left → through top → right
  const bgArc = `M ${L.x} ${L.y} A ${r} ${r} 0 0 1 ${R.x} ${R.y}`;
  const scoreArc =
    score > 0 ? `M ${L.x} ${L.y} A ${r} ${r} 0 0 1 ${S.x} ${S.y}` : '';

  // SVG shows only the top half; text is overlaid at the bottom-center of the arc
  const svgH = cy + sw;

  return (
    <View style={{ width: size, height: svgH, alignItems: 'center' }}>
      <Svg width={size} height={svgH}>
        <Path d={bgArc} stroke={getScoreBgColor(score)} strokeWidth={sw} fill="none" strokeLinecap="round" />
        {scoreArc ? (
          <Path d={scoreArc} stroke={color} strokeWidth={sw} fill="none" strokeLinecap="round" />
        ) : null}
      </Svg>
      {/* Overlay score text centered at the bottom of the arc */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          alignItems: 'center',
          paddingBottom: 2,
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: 'bold', color, lineHeight: 28 }}>{score}</Text>
        <Text style={{ fontSize: 10, color: '#9CA3AF', lineHeight: 13 }}>Score : {score}</Text>
      </View>
    </View>
  );
};

// ─── Nutrition badge pill ────────────────────────────────────────────────────

const Badge = ({ text, color }: { text: string; color: string }) => (
  <View
    style={{
      backgroundColor: color,
      borderRadius: 20,
      paddingHorizontal: 8,
      paddingVertical: 2,
      alignSelf: 'flex-start',
      marginTop: 5,
    }}
  >
    <Text style={{ color: '#fff', fontSize: 10, fontWeight: '700' }}>{text}</Text>
  </View>
);

// ─── Nutrition 2×2 card ──────────────────────────────────────────────────────

const NutritionCard = ({
  icon,
  label,
  value,
  badgeText,
  badgeColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  badgeText: string;
  badgeColor: string;
}) => {
  const p = usePalette();
  return (
    <View
      style={{
        width: '48%',
        backgroundColor: p.cardAlt,
        borderRadius: 14,
        padding: 12,
        marginBottom: 10,
      }}
    >
      <View style={{ marginBottom: 4 }}>{icon}</View>
      <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 1 }}>{label}</Text>
      <Text style={{ color: p.textStrong, fontSize: 20, fontWeight: 'bold' }}>{value}</Text>
      <Badge text={badgeText} color={badgeColor} />
    </View>
  );
};

// ─── Simple nutrient row ─────────────────────────────────────────────────────

const NutriRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => {
  const p = usePalette();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 9,
        borderTopWidth: 1,
        borderTopColor: p.cardAlt,
      }}
    >
      <View style={{ marginRight: 8 }}>{icon}</View>
      <Text style={{ flex: 1, color: p.textBody, fontSize: 14 }}>{label}</Text>
      <Text style={{ color: p.textMuted, fontSize: 14 }}>{value}</Text>
    </View>
  );
};

// ─── Allergen warning ────────────────────────────────────────────────────────

const AllergenWarning = ({ ingredients }: { ingredients?: string }) => {
  const { detectedAllergens, hasAllergies } = useAllergenCheck(ingredients);
  const { t } = useTranslation();
  const p = usePalette();
  if (!hasAllergies) return null;
  // Déclinaison sombre du rouge pastel (fond translucide + textes éclaircis).
  const boxBg = p.isDark ? 'rgba(239, 68, 68, 0.12)' : '#FEF2F2';
  const boxBorder = p.isDark ? '#7F1D1D' : '#FECACA';
  const chipBg = p.isDark ? 'rgba(239, 68, 68, 0.18)' : '#FEE2E2';
  const titleColor = p.isDark ? '#FCA5A5' : '#B91C1C';
  const descColor = p.isDark ? '#F87171' : '#DC2626';
  return (
    <View style={{ marginHorizontal: 16, marginTop: 12 }}>
      <View
        style={{
          backgroundColor: boxBg,
          borderWidth: 1,
          borderColor: boxBorder,
          borderRadius: 16,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        <View
          style={{
            backgroundColor: chipBg,
            padding: 8,
            borderRadius: 50,
            marginRight: 12,
            marginTop: 2,
          }}
        >
          <AlertTriangle size={18} color="#EF4444" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: titleColor, fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
            {t('allergen_warning_title') || 'Attention : Allergènes détectés'}
          </Text>
          <Text style={{ color: descColor, fontSize: 13, lineHeight: 18 }}>
            {t('allergen_warning_desc') ||
              'Ce produit contient des ingrédients que vous avez signalés dans votre profil santé.'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 }}>
            {detectedAllergens.map(a => (
              <View
                key={a}
                style={{
                  backgroundColor: chipBg,
                  borderWidth: 1,
                  borderColor: boxBorder,
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: titleColor,
                    fontWeight: 'bold',
                    fontSize: 11,
                    textTransform: 'uppercase',
                  }}
                >
                  {t(a) || a}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
};

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function ProductDetail() {
  const router = useRouter();
  const { product: productJson } = useLocalSearchParams();
  const product: Product | null = productJson ? JSON.parse(productJson as string) : null;
  const insets = useSafeAreaInsets();
  const p = usePalette();
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [fullProduct, setFullProduct] = useState<Product>(product!);

  const barcodeToUse = product?.barcode || product?.id;
  const { isFavorite, toggleFavorite } = useProductFavorite(barcodeToUse || '', product);

  useEffect(() => {
    if (!fullProduct?.ingredients_text && fullProduct?.barcode) {
      (async () => {
        try {
          const { api } = require('../services/axios');
          const res = await api.get(`/api/product/${fullProduct.barcode}`);
          if (res.data?.product) setFullProduct(res.data.product);
        } catch {}
      })();
    }
  }, [fullProduct?.barcode, fullProduct?.ingredients_text]);

  if (!product || !fullProduct) return null;

  const nv = (key: string) =>
    Math.round(Number(fullProduct.nutriments?.[key + '_100g'] ?? 0) * 10) / 10;

  const energy = Math.round(nv('energy-kcal'));
  const proteins = nv('proteins');
  const sugars = nv('sugars');
  const saturatedFat = nv('saturated-fat');
  const fiber = nv('fiber');
  const salt = nv('salt');
  const calcium = (nv('calcium') * 1000).toFixed(1);

  const ic = '#9CA3AF'; // icon color
  const is = 15;        // icon size

  return (
    <View style={{ flex: 1, backgroundColor: p.bg }}>
      <StatusBar barStyle={p.isDark ? 'light-content' : 'dark-content'} backgroundColor={p.card} />

      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: p.card,
          paddingTop: insets.top,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: p.divider,
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color={p.icon} />
        </TouchableOpacity>

        <Text style={{ fontSize: 17, fontWeight: '700', color: p.textStrong }}>remo</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TouchableOpacity onPress={() => toggleFavorite()}>
            <Heart
              size={20}
              color={isFavorite ? '#EC4899' : p.icon}
              fill={isFavorite ? '#EC4899' : 'none'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setReportModalVisible(true)}>
            <MoreHorizontal size={22} color={p.icon} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Product card ── */}
        <View
          style={{
            backgroundColor: p.card,
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 16,
            padding: 16,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Image
            source={{ uri: fullProduct.image_url }}
            style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: p.cardAlt }}
            resizeMode="contain"
          />
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text
              style={{ fontSize: 17, fontWeight: 'bold', color: p.textStrong, lineHeight: 24 }}
              numberOfLines={2}
            >
              {fullProduct.product_name}
            </Text>
            <Text style={{ fontSize: 13, color: '#9CA3AF', marginTop: 2 }}>
              {fullProduct.brand}
            </Text>
          </View>
          <SemiCircleGauge score={fullProduct.custom_score ?? 0} size={110} />
        </View>

        {/* ── Allergen warning ── */}
        <AllergenWarning ingredients={fullProduct.ingredients_text} />

        {/* ── Additives card ── */}
        <View
          style={{
            backgroundColor: p.card,
            marginHorizontal: 16,
            marginTop: 12,
            borderRadius: 16,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {/* Card header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 13,
              borderBottomWidth: 1,
              borderBottomColor: p.divider,
            }}
          >
            <FlaskConical size={17} color={p.textMuted} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: p.textStrong }}>Additives</Text>
          </View>

          {/* Additive rows */}
          {fullProduct.additives_tags && fullProduct.additives_tags.length > 0 ? (
            fullProduct.additives_tags.map((tag, idx) => {
              const info = fullProduct.additives_info?.find(
                a => a.code?.toLowerCase() === tag.replace(/^[a-z]{2}:/, '').split('-')[0],
              );
              const { code, name } = parseAdditive(tag);
              const dotColor = getAdditiveColor(idx, info?.risk_level);
              const isLast = idx === fullProduct.additives_tags!.length - 1;
              return (
                <View
                  key={idx}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 14,
                    paddingVertical: 12,
                    borderBottomWidth: isLast ? 0 : 1,
                    borderBottomColor: p.divider,
                  }}
                >
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: dotColor,
                      marginRight: 10,
                    }}
                  />
                  <Text style={{ flex: 1, fontSize: 14, color: p.textBody }}>
                    {code}
                    {name ? ` (${name})` : ''}
                  </Text>
                  <FlaskConical size={13} color="#C4B5A0" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: '#9CA3AF', marginRight: 2 }}>
                    {info?.function || 'Fonction'}
                  </Text>
                  <ChevronRight size={14} color="#D1D5DB" />
                </View>
              );
            })
          ) : (
            <View style={{ padding: 14 }}>
              <Text style={{ color: '#9CA3AF', fontStyle: 'italic' }}>
                Aucun additif à déclarer.
              </Text>
            </View>
          )}
        </View>

        {/* ── Nutritional Information card ── */}
        <View
          style={{
            backgroundColor: p.card,
            marginHorizontal: 16,
            marginTop: 12,
            borderRadius: 16,
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {/* Card header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
              paddingVertical: 13,
              borderBottomWidth: 1,
              borderBottomColor: p.divider,
            }}
          >
            <Heart size={17} color={p.textMuted} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: p.textStrong }}>
              Nutritional Information
            </Text>
          </View>

          <View style={{ padding: 12 }}>
            {/* 2 × 2 grid */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <NutritionCard
                icon={<Flame size={is} color={ic} />}
                label="Energy"
                value={`${energy} Kcal`}
                badgeText={energy > 300 ? 'Forte teneur' : 'Faible teneur'}
                badgeColor={getLevelColor(energy, 500, 300)}
              />
              <NutritionCard
                icon={<Dumbbell size={is} color={ic} />}
                label="Proteines"
                value={`${proteins} g`}
                badgeText={proteins > 10 ? 'Excellente source' : 'Faible teneur'}
                badgeColor={getPositiveLevelColor(proteins, 10, 5)}
              />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <NutritionCard
                icon={<Wheat size={is} color={ic} />}
                label="Glucides"
                value={`${sugars} g`}
                badgeText="Teneur"
                badgeColor={getLevelColor(sugars, 20, 10)}
              />
              <NutritionCard
                icon={<Droplets size={is} color={ic} />}
                label="Gras saturés"
                value={`${saturatedFat} g`}
                badgeText="Gras saturés"
                badgeColor={getLevelColor(saturatedFat, 5, 1.5)}
              />
            </View>

            {/* Simple rows */}
            <NutriRow icon={<Leaf size={is} color={ic} />} label="Fibre" value={`${fiber} g`} />
            <NutriRow icon={<Flame size={is} color={ic} />} label="Sel" value={`${salt} g`} />
            <NutriRow
              icon={<Droplets size={is} color={ic} />}
              label="Calcium"
              value={`${calcium} mg`}
            />
          </View>
        </View>

        {/* Notes des utilisateurs */}
        <ProductRatings barcode={fullProduct.barcode || fullProduct.id} />
      </ScrollView>

      <AlternativesList
        barcode={fullProduct.barcode || fullProduct.id}
        currentScore={fullProduct.custom_score}
      />

      <ReportModal
        visible={reportModalVisible}
        onClose={() => setReportModalVisible(false)}
        barcode={fullProduct.barcode || fullProduct.id}
      />
    </View>
  );
}
