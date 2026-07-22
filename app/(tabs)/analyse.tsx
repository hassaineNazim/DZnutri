import { useFocusEffect } from '@react-navigation/native';
import { Activity } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Txt from '../components/ui/Txt';
import { useTranslation } from '../i18n';
import { fetchHistoryStats } from '../services/saveHistorique';
import { colors, radius, scoreBand, scoreGrade } from '../theme/tokens';

type StatsData = {
  total_scans: number;
  average_score: number;
  distribution: { excellent: number; bon: number; mediocre: number; mauvais: number };
};

const BANDS: { key: keyof StatsData['distribution']; labelKey: string; fallback: string; color: string }[] = [
  { key: 'excellent', labelKey: 'excellent', fallback: 'Excellent', color: colors.greenAlt },
  { key: 'bon', labelKey: 'good', fallback: 'Bon', color: colors.limeB },
  { key: 'mediocre', labelKey: 'mediocre', fallback: 'Moyen', color: colors.orangeAlt },
  { key: 'mauvais', labelKey: 'bad', fallback: 'Mauvais', color: colors.redAlt },
];

export default function AnalysePage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        const data = await fetchHistoryStats();
        setStats(data);
        setLoading(false);
      };
      loadStats();
    }, []),
  );

  const monthLabel = new Date()
    .toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    .toUpperCase();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.yellow} />
      </View>
    );
  }

  if (!stats || stats.total_scans === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.dark, alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Activity size={56} color={colors.inkMeta} />
        <Txt variant="medium" size={16} color={colors.inkMeta} style={{ marginTop: 16, textAlign: 'center' }}>
          {t('scan_stats_empty') || 'Aucune donnée. Scannez des produits pour commencer !'}
        </Txt>
      </View>
    );
  }

  const grade = scoreGrade(stats.average_score);
  const band = scoreBand(stats.average_score);
  const total = stats.total_scans;

  return (
    <View style={{ flex: 1, backgroundColor: colors.sheet }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.dark} />

      {/* Entête sombre */}
      <View style={{ backgroundColor: colors.dark, paddingHorizontal: 26, paddingTop: 18, paddingBottom: 24 }}>
        <Txt variant="bold" size={12} color={colors.yellow} style={{ letterSpacing: 1.2 }}>
          {t('report') || 'BILAN'} · {monthLabel}
        </Txt>
        <Txt variant="display" size={44} color={colors.creamTitle} style={{ marginTop: 4, letterSpacing: -0.5 }}>
          {t('your_report') || 'Votre bilan.'}
        </Txt>

        {/* Carte score bordeaux */}
        <View style={{ backgroundColor: colors.bordeaux, borderRadius: 22, padding: 18, marginTop: 20, flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' }}>
            <Txt variant="display" size={40} color={colors.inkOnYellow} style={{ lineHeight: 44 }}>{stats.average_score}</Txt>
            <Txt variant="bold" size={11} color={colors.inkOnYellow} style={{ marginTop: 2 }}>{t('grade') || 'Note'} {grade}</Txt>
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="body" size={13} color={colors.rose}>
              {total} {t('products_scanned') || 'produits scannés'}
            </Txt>
            <Txt variant="semibold" size={16} color={colors.creamTitle} style={{ marginTop: 6, lineHeight: 22 }}>
              {band.color === colors.greenAlt || band.color === colors.limeB
                ? t('report_good') || 'Continuez comme ça, vos choix sont sains.'
                : t('report_improve') || 'Quelques produits à surveiller ce mois-ci.'}
            </Txt>
          </View>
        </View>
      </View>

      {/* Corps crème */}
      <ScrollView contentContainerStyle={{ padding: 22, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Txt variant="displayXBold" size={24} color={colors.ink}>{t('distribution') || 'Répartition'}</Txt>
        <Txt variant="body" size={13} color={colors.inkSoft} style={{ marginTop: 2 }}>{t('by_quality') || 'par qualité'}</Txt>

        {/* Barre segmentée proportionnelle */}
        <View style={{ flexDirection: 'row', gap: 5, marginTop: 14 }}>
          {BANDS.map((b) => {
            const count = stats.distribution[b.key];
            if (count === 0) return null;
            const pct = Math.round((count / total) * 100);
            return (
              <View key={b.key} style={{ flex: count, backgroundColor: b.color, borderRadius: 8, paddingVertical: 11, alignItems: 'center' }}>
                <Txt variant="bold" size={pct < 12 ? 11 : 13} color={b.color === colors.limeB || b.color === colors.orangeAlt ? colors.inkOnYellow : colors.white}>
                  {pct}%
                </Txt>
              </View>
            );
          })}
        </View>

        {/* Légende détaillée */}
        <View style={{ marginTop: 20, gap: 12 }}>
          {BANDS.map((b, i) => {
            const count = stats.distribution[b.key];
            return (
              <Animated.View key={b.key} entering={FadeInDown.delay(i * 80).springify()} style={{ backgroundColor: colors.card, borderRadius: radius.cardSm, padding: 15, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: b.color }} />
                <Txt variant="semibold" size={16} color={colors.ink} style={{ flex: 1 }}>{t(b.labelKey) || b.fallback}</Txt>
                <Txt variant="displayXBold" size={18} color={colors.ink}>{count}</Txt>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
