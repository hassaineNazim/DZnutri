import { useFocusEffect } from '@react-navigation/native';
import { Activity, AlertTriangle, Award, Leaf, TrendingUp, XCircle } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, Text, useColorScheme, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { useTranslation } from '../i18n';
import { fetchHistoryStats } from '../services/saveHistorique';

// --- TYPES ---
type StatsData = {
  total_scans: number;
  average_score: number;
  distribution: {
    excellent: number;
    bon: number;
    mediocre: number;
    mauvais: number;
  };
};

// --- CONSTANTS ---
const { width } = Dimensions.get('window');
const CIRCLE_LENGTH = 2 * Math.PI * 70; // Radius = 70
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// --- HELPERS ---
const getScoreColor = (score?: number): string => {
  if (score === undefined) return '#6B7280';
  if (score >= 75) return '#22C55E'; // Green-500
  if (score >= 50) return '#84CC16'; // Lime-500
  if (score >= 25) return '#F97316'; // Orange-500
  return '#EF4444'; // Red-500
};

const getScoreLabel = (score?: number): string => {
  if (score === undefined) return 'Inconnu';
  if (score >= 75) return 'Excellent';
  if (score >= 50) return 'Bon';
  if (score >= 25) return 'Médiocre';
  return 'Mauvais';
};

// --- COMPONENTS ---

const ScoreGauge = ({ score }: { score: number }) => {
  const progress = useSharedValue(0);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    progress.value = withTiming(score / 100, { duration: 1500 });
  }, [score]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRCLE_LENGTH * (1 - progress.value),
  }));

  const color = getScoreColor(score);

  return (
    <View className="items-center justify-center py-6">
      <View className="relative items-center justify-center">
        <Svg width={160} height={160} viewBox="0 0 160 160">
          {/* Background Circle */}
          <Circle
            cx="80"
            cy="80"
            r="70"
            stroke={isDark ? "#374151" : "#E5E7EB"}
            strokeWidth="12"
            fill="transparent"
          />
          {/* Animated Foreground Circle */}
          <AnimatedCircle
            cx="80"
            cy="80"
            r="70"
            stroke={color}
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={CIRCLE_LENGTH}
            strokeLinecap="round"
            rotation="-90"
            origin="80, 80"
            animatedProps={animatedProps}
          />
        </Svg>
        <View className="absolute items-center justify-center">
          <Animated.Text
            entering={FadeIn.delay(500)}
            className="text-4xl font-bold text-gray-900 dark:text-white"
          >
            {score}
          </Animated.Text>
          <Animated.Text
            entering={FadeIn.delay(700)}
            className="text-sm font-medium text-gray-500 dark:text-gray-400"
          >
            / 100
          </Animated.Text>
        </View>
      </View>
      <Animated.Text
        entering={FadeInDown.delay(800)}
        className="mt-4 text-2xl font-bold"
        style={{ color }}
      >
        {getScoreLabel(score)}
      </Animated.Text>
    </View>
  );
};

const StatBar = ({ label, count, total, color, icon: Icon, delay }: { label: string; count: number; total: number; color: string; icon: any, delay: number }) => {
  const widthPercent = total > 0 ? (count / total) * 100 : 0;
  const animatedWidth = useSharedValue(0);

  useEffect(() => {
    animatedWidth.value = withDelay(delay, withTiming(widthPercent, { duration: 1000 }));
  }, [widthPercent]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${animatedWidth.value}%`,
  }));

  return (
    <Animated.View
      entering={FadeInDown.delay(delay).springify()}
      className="flex-row items-center mb-4"
    >
      <View className="w-8 items-center justify-center mr-3">
        <Icon size={20} color={color} />
      </View>
      <View className="flex-1">
        <View className="flex-row justify-between mb-1">
          <Text className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</Text>
          <Text className="text-sm font-bold text-gray-900 dark:text-white">{count}</Text>
        </View>
        <View className="h-2.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <Animated.View
            className="h-full rounded-full"
            style={[{ backgroundColor: color }, animatedStyle]}
          />
        </View>
      </View>
    </Animated.View>
  );
};

const SummaryCard = ({ title, value, icon: Icon, color, delay }: any) => (
  <Animated.View
    entering={FadeInDown.delay(delay).springify()}
    className="flex-1 bg-white dark:bg-[#1F2937] p-4 rounded-2xl shadow-sm mx-1 items-center justify-center"
  >
    <View className="p-3 rounded-full bg-opacity-10 mb-2" style={{ backgroundColor: `${color}20` }}>
      <Icon size={24} color={color} />
    </View>
    <Text className="text-2xl font-bold text-gray-900 dark:text-white">{value}</Text>
    <Text className="text-xs text-gray-500 dark:text-gray-400 text-center">{title}</Text>
  </Animated.View>
);

// --- MAIN PAGE ---
export default function AnalysePage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  useFocusEffect(
    useCallback(() => {
      const loadStats = async () => {
        // Don't set loading true on refresh to avoid flickering if we wanted to support pull-to-refresh
        // But for focus effect, we might want to refresh data.
        // Let's keep it simple.
        const data = await fetchHistoryStats();
        setStats(data);
        setLoading(false);
      };
      loadStats();
    }, [])
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-[#181A20]">
        <ActivityIndicator size="large" color="#84CC16" />
      </View>
    );
  }

  if (!stats || stats.total_scans === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50 dark:bg-[#181A20] p-6">
        <Activity size={64} color="#9CA3AF" />
        <Text className="text-lg text-gray-500 dark:text-gray-400 text-center mt-4">
          {t('scan_stats_empty') || "Aucune donnée d'analyse disponible. Scannez des produits pour commencer !"}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50 dark:bg-[#181A20]"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="px-6 pt-6 pb-2">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('your_analysis') || "Votre Bilan"}
        </Text>
        <Text className="text-base text-gray-500 dark:text-gray-400 mt-1">
          Résumé de vos habitudes alimentaires
        </Text>
      </View>

      {/* Score Gauge Section */}
      <Animated.View
        entering={FadeInDown.duration(600).springify()}
        className="mx-4 mt-6 bg-white dark:bg-[#1F2937] rounded-3xl p-6 shadow-sm"
      >
        <Text className="text-lg font-semibold text-gray-800 dark:text-gray-100 text-center mb-2">
          {t('average_quality') || "Qualité Moyenne"}
        </Text>
        <ScoreGauge score={stats.average_score} />
      </Animated.View>

      {/* Summary Cards */}
      <View className="flex-row mx-3 mt-4">
        <SummaryCard
          title="Produits Scannés"
          value={stats.total_scans}
          icon={Activity}
          color="#3B82F6"
          delay={200}
        />
        <SummaryCard
          title="Score Moyen"
          value={stats.average_score}
          icon={TrendingUp}
          color={getScoreColor(stats.average_score)}
          delay={300}
        />
      </View>

      {/* Distribution Section */}
      <Animated.View
        entering={FadeInDown.delay(400).duration(600).springify()}
        className="mx-4 mt-4 bg-white dark:bg-[#1F2937] rounded-3xl p-6 shadow-sm"
      >
        <Text className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-6">
          {t('distribution') || "Distribution des produits"}
        </Text>

        <StatBar
          label={t('excellent') || "Excellent"}
          count={stats.distribution.excellent}
          total={stats.total_scans}
          color="#22C55E"
          icon={Leaf}
          delay={500}
        />
        <StatBar
          label={t('good') || "Bon"}
          count={stats.distribution.bon}
          total={stats.total_scans}
          color="#84CC16"
          icon={Award}
          delay={600}
        />
        <StatBar
          label={t('mediocre') || "Médiocre"}
          count={stats.distribution.mediocre}
          total={stats.total_scans}
          color="#F97316"
          icon={AlertTriangle}
          delay={700}
        />
        <StatBar
          label={t('bad') || "Mauvais"}
          count={stats.distribution.mauvais}
          total={stats.total_scans}
          color="#EF4444"
          icon={XCircle}
          delay={800}
        />
      </Animated.View>
    </ScrollView>
  );
}