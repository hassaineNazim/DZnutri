/**
 * ProductCard — carte produit du redesign (liste Accueil, aperçus).
 * Fond blanc, vignette (image réelle ou placeholder rayé crème), nom Playfair,
 * marque, pastille de statut colorée + heure relative, et anneau de score.
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AlertTriangle } from 'lucide-react-native';
import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { useAllergenCheck } from '../../hooks/useAllergenCheck';
import { useTranslation } from '../../i18n';
import { colors, radius, scoreBand, shadows } from '../../theme/tokens';
import ScoreRing from './ScoreRing';
import Txt from './Txt';

export type ProductCardItem = {
  id: number;
  item_type?: 'food' | 'cosmetic';
  product_name?: string;
  brand?: string;
  brands?: string;
  image_url?: string;
  custom_score?: number;
  scanned_at?: string | null;
  ingredients_text?: string;
};

type Props = {
  item: ProductCardItem;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
};

// Placeholder rayé crème (façon maquette) quand aucune image produit.
function StripedThumb({ size, isCosmetic }: { size: number; isCosmetic: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 15,
        backgroundColor: colors.thumbBg,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <MaterialIcons
        name={isCosmetic ? 'spa' : 'fastfood'}
        size={size * 0.42}
        color={isCosmetic ? colors.red : colors.inkMeta}
      />
    </View>
  );
}

export default function ProductCard({ item, onPress, onLongPress, selected = false }: Props) {
  const { t } = useTranslation();
  const isCosmetic = item.item_type === 'cosmetic';
  const band = scoreBand(item.custom_score);
  const brand = item.brand || item.brands || t('brand_unknown');
  const THUMB = 56;

  // Alerte allergènes : uniquement pour l'alimentaire (le texte INCI des
  // cosmétiques ferait remonter de faux positifs sur les mots-clés food).
  const { hasAllergies } = useAllergenCheck(isCosmetic ? undefined : item.ingredients_text);

  const relativeTime = (iso?: string | null) => {
    if (!iso) return '';
    try {
      const diff = Date.now() - new Date(iso).getTime();
      const sec = Math.floor(diff / 1000);
      if (sec < 60) return `${sec}${t('s')}`;
      const min = Math.floor(sec / 60);
      if (min < 60) return `${min}${t('m')}`;
      const hr = Math.floor(min / 60);
      if (hr < 24) return `${hr}${t('h')}`;
      return `${Math.floor(hr / 24)}${t('d')}`;
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.product_name || t('product_unknown')}, ${brand}, ${t(band.labelKey) || band.label}${typeof item.custom_score === 'number' ? `, ${t('score')} ${item.custom_score}` : ''}`}
      accessibilityState={{ selected }}
      accessibilityHint={onLongPress ? t('long_press_select') : undefined}
      activeOpacity={0.85}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          backgroundColor: colors.card,
          borderRadius: radius.card,
          padding: 12,
          paddingHorizontal: 14,
          borderWidth: selected ? 2 : 0,
          borderColor: selected ? colors.yellow : 'transparent',
        },
        shadows.listCard,
      ]}
    >
      <View>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            accessible={false}
            style={{ width: THUMB, height: THUMB, borderRadius: 15, backgroundColor: colors.thumbBg }}
            resizeMode="contain"
          />
        ) : (
          <StripedThumb size={THUMB} isCosmetic={isCosmetic} />
        )}
        {hasAllergies && (
          <View
            style={{
              position: 'absolute',
              top: -6,
              right: -6,
              backgroundColor: colors.red,
              width: 22,
              height: 22,
              borderRadius: 11,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 2,
              borderColor: colors.card,
            }}
          >
            <AlertTriangle size={12} color={colors.white} fill={colors.red} />
          </View>
        )}
      </View>

      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Txt variant="displayXBold" size={20} color={colors.ink} numberOfLines={1} style={{ flexShrink: 1 }}>
            {item.product_name || t('product_unknown')}
          </Txt>
          {isCosmetic && (
            <View style={{ backgroundColor: 'rgba(210,75,51,0.12)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}>
              <Txt variant="bold" size={10} color={colors.red}>
                {t('cosmetic').toUpperCase()}
              </Txt>
            </View>
          )}
        </View>

        <Txt variant="body" size={13} color={colors.inkSoft} numberOfLines={1} style={{ marginTop: 3 }}>
          {brand}
        </Txt>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 7 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: band.color }} />
          <Txt variant="semibold" size={12.5} color={band.color}>
            {t(band.labelKey) || band.label}
          </Txt>
          {!!item.scanned_at && (
            <>
              <Txt variant="body" size={12.5} color={colors.inkMeta}>·</Txt>
              <Txt variant="body" size={12.5} color={colors.inkMeta}>{relativeTime(item.scanned_at)}</Txt>
            </>
          )}
        </View>
      </View>

      <ScoreRing score={item.custom_score} size={54} fontSize={17} />
    </TouchableOpacity>
  );
}
