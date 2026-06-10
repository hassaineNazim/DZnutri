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
}) => (
  <View
    style={{
      width: '48%',
      backgroundColor: '#F3F4F6',
      borderRadius: 14,
      padding: 12,
      marginBottom: 10,
    }}
  >
    <View style={{ marginBottom: 4 }}>{icon}</View>
    <Text style={{ color: '#9CA3AF', fontSize: 12, marginBottom: 1 }}>{label}</Text>
    <Text style={{ color: '#111827', fontSize: 20, fontWeight: 'bold' }}>{value}</Text>
    <Badge text={badgeText} color={badgeColor} />
  </View>
);

// ─── Simple nutrient row ─────────────────────────────────────────────────────

const NutriRow = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) => (
  <View
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 9,
      borderTopWidth: 1,
      borderTopColor: '#F3F4F6',
    }}
  >
    <View style={{ marginRight: 8 }}>{icon}</View>
    <Text style={{ flex: 1, color: '#374151', fontSize: 14 }}>{label}</Text>
    <Text style={{ color: '#6B7280', fontSize: 14 }}>{value}</Text>
  </View>
);

// ─── Allergen warning ────────────────────────────────────────────────────────

const AllergenWarning = ({ ingredients }: { ingredients?: string }) => {
  const { detectedAllergens, hasAllergies } = useAllergenCheck(ingredients);
  const { t } = useTranslation();
  if (!hasAllergies) return null;
  return (
    <View style={{ marginHorizontal: 16, marginTop: 12 }}>
      <View
        style={{
          backgroundColor: '#FEF2F2',
          borderWidth: 1,
          borderColor: '#FECACA',
          borderRadius: 16,
          padding: 14,
          flexDirection: 'row',
          alignItems: 'flex-start',
        }}
      >
        <View
          style={{
            backgroundColor: '#FEE2E2',
            padding: 8,
            borderRadius: 50,
            marginRight: 12,
            marginTop: 2,
          }}
        >
          <AlertTriangle size={18} color="#EF4444" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ color: '#B91C1C', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>
            {t('allergen_warning_title') || 'Attention : Allergènes détectés'}
          </Text>
          <Text style={{ color: '#DC2626', fontSize: 13, lineHeight: 18 }}>
            {t('allergen_warning_desc') ||
              'Ce produit contient des ingrédients que vous avez signalés dans votre profil santé.'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 8, gap: 6 }}>
            {detectedAllergens.map(a => (
              <View
                key={a}
                style={{
                  backgroundColor: '#FEE2E2',
                  borderWidth: 1,
                  borderColor: '#FECACA',
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: 8,
                }}
              >
                <Text
                  style={{
                    color: '#B91C1C',
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
  const { t } = useTranslation();
  const { product: productJson } = useLocalSearchParams();
  const product: Product | null = productJson ? JSON.parse(productJson as string) : null;
  const insets = useSafeAreaInsets();
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
        } catch (_) {}
      })();
    }
  }, [fullProduct?.barcode]);

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
    <View style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ── Header ── */}
      <View
        style={{
          backgroundColor: '#FFFFFF',
          paddingTop: insets.top,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#F9FAFB',
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ArrowLeft size={22} color="#374151" />
        </TouchableOpacity>

        <Text style={{ fontSize: 17, fontWeight: '700', color: '#111827' }}>remo</Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <TouchableOpacity onPress={() => toggleFavorite()}>
            <Heart
              size={20}
              color={isFavorite ? '#EC4899' : '#374151'}
              fill={isFavorite ? '#EC4899' : 'none'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setReportModalVisible(true)}>
            <MoreHorizontal size={22} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Product card ── */}
        <View
          style={{
            backgroundColor: '#FFFFFF',
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
            style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: '#F9FAFB' }}
            resizeMode="contain"
          />
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text
              style={{ fontSize: 17, fontWeight: 'bold', color: '#111827', lineHeight: 24 }}
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
            backgroundColor: '#FFFFFF',
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
              borderBottomColor: '#F9FAFB',
            }}
          >
            <FlaskConical size={17} color="#6B7280" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>Additives</Text>
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
                    borderBottomColor: '#F9FAFB',
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
                  <Text style={{ flex: 1, fontSize: 14, color: '#374151' }}>
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
            backgroundColor: '#FFFFFF',
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
              borderBottomColor: '#F9FAFB',
            }}
          >
            <Heart size={17} color="#6B7280" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#111827' }}>
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
