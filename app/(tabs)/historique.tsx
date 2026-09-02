import { useRouter } from 'expo-router';
import { useFocusEffect, useScrollToTop } from '@react-navigation/native';
import { AlertCircle, HelpCircle, RefreshCw, ScanLine, Trash2, User, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StatusBar,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ConfirmModal from '../components/ConfirmModal';
import AppModal from '../components/ui/AppModal';
import ProductCard, { ProductCardItem } from '../components/ui/ProductCard';
import CollapsibleHeader, { AnimatedFlatList, useCollapsibleHeader } from '../components/ui/CollapsibleHeader';
import Txt from '../components/ui/Txt';
import { useTranslation } from '../i18n';
import { colors, radius, shadows } from '../theme/tokens';
import { deleteCosmeticFromHistory, deleteFromHistory, fetchHistory } from '../services/saveHistorique';

type Product = ProductCardItem & { nutrition_grades?: string };
type HistoryRow =
  | { kind: 'header'; key: string; sectionKey: string; title: string }
  | { kind: 'product'; key: string; item: Product; animationIndex: number };

const HISTORY_HEADER_HEIGHT = 310;
const SELECTION_HEADER_HEIGHT = 94;

// Clé unique par entrée : ids alimentaires et cosmétiques peuvent se chevaucher.
const itemKey = (item: Product) => `${item.item_type || 'food'}-${item.id}`;

// Regroupe l'historique par jour (Aujourd'hui / Hier / Plus tôt).
function buildSections(history: Product[], t: (k: string) => string) {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = startOfDay(new Date());
  const yesterday = today - 86400000;

  const groups: Record<string, Product[]> = { today: [], yesterday: [], earlier: [] };
  for (const item of history) {
    let bucket = 'earlier';
    if (item.scanned_at) {
      const day = startOfDay(new Date(item.scanned_at));
      if (day === today) bucket = 'today';
      else if (day === yesterday) bucket = 'yesterday';
    }
    groups[bucket].push(item);
  }

  const titles: Record<string, string> = {
    today: t('today') || "Aujourd'hui",
    yesterday: t('yesterday') || 'Hier',
    earlier: t('earlier') || 'Plus tôt',
  };
  return (['today', 'yesterday', 'earlier'] as const)
    .filter((k) => groups[k].length > 0)
    .map((k) => ({ key: k, title: titles[k], data: groups[k] }));
}

export default function HistoriquePage() {
  const [history, setHistory] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const { t } = useTranslation();
  const router = useRouter();
  const { scrollY, onScroll, resetScrollY } = useCollapsibleHeader();
  const historyListRef = useRef<FlatList<HistoryRow>>(null);
  const { height: windowHeight } = useWindowDimensions();

  // Les écrans d'onglets restent montés sur iOS. Il faut donc remettre la liste
  // ET la valeur animée au même point à chaque retour, sinon l'une peut rester
  // en haut tandis que l'autre croit encore être défilée.
  const resetHistoryPosition = useCallback((animated = false) => {
    resetScrollY();
    requestAnimationFrame(() => {
      historyListRef.current?.scrollToOffset({ offset: 0, animated });
      resetScrollY();
    });
  }, [resetScrollY]);

  useScrollToTop(historyListRef);

  useFocusEffect(
    useCallback(() => {
      resetHistoryPosition(false);
      return resetScrollY;
    }, [resetHistoryPosition, resetScrollY]),
  );

  const loadHistory = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      setLoadError(false);
      const serverHistory = await fetchHistory();
      setHistory(serverHistory);
    } catch (error) {
      console.error(error);
      setLoadError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadHistory(true);
  }, [loadHistory]);

  // --- Statistiques du bandeau ---
  const stats = useMemo(() => {
    const scored = history.filter((h) => typeof h.custom_score === 'number');
    const avg = scored.length
      ? Math.round(scored.reduce((s, h) => s + (h.custom_score as number), 0) / scored.length)
      : 0;
    const alertes = history.filter((h) => typeof h.custom_score === 'number' && (h.custom_score as number) < 25).length;
    // Mêmes seuils que le reste de l'app (scoreBand : 50 = bon, 25 = médiocre).
    const avgTone: 'yellow' | 'green' | 'red' = !scored.length ? 'yellow' : avg < 25 ? 'red' : avg >= 50 ? 'green' : 'yellow';
    return { scans: history.length, avg, alertes, avgTone };
  }, [history]);

  const sections = useMemo(() => buildSections(history, t), [history, t]);
  const historyRows = useMemo<HistoryRow[]>(() => {
    const rows: HistoryRow[] = [];
    let animationIndex = 0;
    for (const section of sections) {
      rows.push({
        kind: 'header',
        key: `section-${section.key}`,
        sectionKey: section.key,
        title: section.title,
      });
      for (const item of section.data) {
        rows.push({
          kind: 'product',
          key: itemKey(item),
          item,
          animationIndex,
        });
        animationIndex += 1;
      }
    }
    return rows;
  }, [sections]);

  const toggleSelect = (key: string) =>
    setSelectedIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  const clearSelection = useCallback(() => {
    setSelectedIds([]);
    resetHistoryPosition(false);
  }, [resetHistoryPosition]);

  const deleteSelected = async () => {
    try {
      const selectedItems = history.filter((item) => selectedIds.includes(itemKey(item)));
      await Promise.all(
        selectedItems.map((item) =>
          item.item_type === 'cosmetic' ? deleteCosmeticFromHistory(item.id) : deleteFromHistory(item.id),
        ),
      );
      setHistory((prev) => prev.filter((item) => !selectedIds.includes(itemKey(item))));
      clearSelection();
    } catch (e) {
      console.error(e);
    }
  };

  const handleItemPress = (product: Product) => {
    router.push({
      pathname: product.item_type === 'cosmetic' ? '../screens/cosmeticDetail' : '../screens/productDetail',
      params: { product: JSON.stringify(product) },
    });
  };

  const todayLabel = useMemo(
    () =>
      new Date()
        .toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' })
        .toUpperCase()
        .replace('.', ''),
    [],
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bordeaux, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.yellow} />
      </View>
    );
  }

  const selecting = selectedIds.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />
      {/* ---- Entête bordeaux ---- */}
      <CollapsibleHeader
        title={selecting ? `${selectedIds.length} ${t('selected')}` : t('historique')}
        scrollY={scrollY}
        expandedHeight={selecting ? SELECTION_HEADER_HEIGHT : HISTORY_HEADER_HEIGHT}
        compactLeft={
          selecting ? (
            <Pressable onPress={clearSelection} accessibilityRole="button" accessibilityLabel={t('cancel')} style={[styles.roundBtnCream, styles.compactBtn]}>
              <X size={18} color={colors.bordeaux} />
            </Pressable>
          ) : undefined
        }
        compactRight={
          selecting ? (
            <Pressable onPress={() => setConfirmVisible(true)} accessibilityRole="button" accessibilityLabel={t('confirm_delete_title')} style={[styles.roundBtnCream, styles.compactBtn, { backgroundColor: colors.redAlt }]}>
              <Trash2 size={17} color={colors.white} />
            </Pressable>
          ) : (
            <Pressable onPress={() => router.push('/scanner')} accessibilityRole="button" accessibilityLabel={t('scan_product')} style={[styles.roundBtnCream, styles.compactBtn, { backgroundColor: colors.yellow }]}>
              <ScanLine size={18} color={colors.inkOnYellow} />
            </Pressable>
          )
        }
      >
      <View style={{ paddingHorizontal: 26, paddingTop: 18, paddingBottom: 18 }}>
        {selecting ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable
                onPress={clearSelection}
                accessibilityRole="button"
                accessibilityLabel={t('cancel')}
                style={styles.roundBtnCream}
              >
                <X size={20} color={colors.bordeaux} />
              </Pressable>
              <Txt variant="displayXBold" size={22} color={colors.creamTitle}>
                {selectedIds.length} {t('selected') || 'sélectionné(s)'}
              </Txt>
            </View>
            <Pressable
              onPress={() => selectedIds.length && setConfirmVisible(true)}
              accessibilityRole="button"
              accessibilityLabel={t('confirm_delete_title')}
              style={[styles.roundBtnCream, { backgroundColor: colors.redAlt }]}
            >
              <Trash2 size={20} color={colors.white} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Pressable
                onPress={() => setMenuVisible(true)}
                accessibilityRole="button"
                accessibilityLabel={t('account')}
                style={styles.roundBtnCream}
              >
                <User size={22} color={colors.bordeaux} />
              </Pressable>
              <TouchableOpacity
                onPress={() => router.push('/scanner')}
                accessibilityRole="button"
                accessibilityLabel={t('scan_product')}
                activeOpacity={0.85}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                  backgroundColor: colors.yellow,
                  paddingVertical: 11,
                  paddingLeft: 15,
                  paddingRight: 18,
                  borderRadius: radius.pill,
                }}
              >
                <ScanLine size={19} color={colors.inkOnYellow} />
                <Txt variant="bold" size={15} color={colors.inkOnYellow}>
                  {t('scan') || 'Scanner'}
                </Txt>
              </TouchableOpacity>
            </View>

            <Txt variant="bold" size={12} color={colors.yellow} style={{ letterSpacing: 1.2, marginTop: 20 }}>
              {todayLabel}
            </Txt>
            <Txt variant="display" size={46} color={colors.creamTitle} style={{ marginTop: 4, letterSpacing: -0.5 }}>
              {t('historique')}
            </Txt>

            {/* 3 stats */}
            <View style={{ flexDirection: 'row', gap: 11, marginTop: 20 }}>
              <StatCard label={t('scans') || 'SCANS'} value={stats.scans} />
              <StatCard label={t('avg_score') || 'SCORE MOY.'} value={stats.avg} tone={stats.avgTone} />
              <StatCard label={t('alerts') || 'ALERTES'} value={stats.alertes} tone="red" />
            </View>
          </>
        )}
      </View>
      </CollapsibleHeader>

      {/* ---- Feuille crème ---- */}
      <View style={{ flex: 1, backgroundColor: colors.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
        <AnimatedFlatList
          ref={historyListRef}
          data={historyRows}
          keyExtractor={(row) => row.key}
          contentContainerStyle={{
            minHeight: windowHeight + (selecting ? SELECTION_HEADER_HEIGHT : HISTORY_HEADER_HEIGHT),
            padding: 22,
            paddingTop: selecting ? 116 : 332,
            paddingBottom: 120,
          }}
          onScroll={onScroll}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.green]} tintColor={colors.green} />
          }
          renderItem={({ item: row }) =>
            row.kind === 'header' ? (
              <Txt variant="displayXBold" size={20} color={colors.ink} style={{ marginBottom: 12, marginTop: row.sectionKey === 'today' ? 0 : 10 }}>
                {row.title}
              </Txt>
            ) : (
              <Animated.View entering={FadeInDown.delay(Math.min(row.animationIndex, 8) * 45).springify()} style={{ marginBottom: 12 }}>
                <ProductCard
                  item={row.item}
                  selected={selectedIds.includes(itemKey(row.item))}
                  onPress={() => (selecting ? toggleSelect(itemKey(row.item)) : handleItemPress(row.item))}
                  onLongPress={() => toggleSelect(itemKey(row.item))}
                />
              </Animated.View>
            )
          }
          ListEmptyComponent={
            loadError ? (
              <View style={{ alignItems: 'center', marginTop: 70, paddingHorizontal: 24 }}>
                <AlertCircle size={52} color={colors.red} />
                <Txt variant="medium" size={16} color={colors.ink} style={{ marginTop: 16, textAlign: 'center' }}>
                  {t('history_load_error')}
                </Txt>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={t('retry')}
                  onPress={() => loadHistory()}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18, backgroundColor: colors.yellow, paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.pill }}
                >
                  <RefreshCw size={17} color={colors.inkOnYellow} />
                  <Txt variant="bold" size={14} color={colors.inkOnYellow}>{t('retry')}</Txt>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ alignItems: 'center', marginTop: 70, opacity: 0.65 }}>
                <Trash2 size={56} color={colors.inkSoft} />
                <Txt variant="medium" size={16} color={colors.inkSoft} style={{ marginTop: 16, textAlign: 'center' }}>
                  {t('history_empty')}
                </Txt>
              </View>
            )
          }
        />
      </View>

      <ConfirmModal
        visible={confirmVisible}
        title={t('confirm_delete_title') || 'Supprimer ?'}
        message={t('confirm_delete_message') || 'Voulez-vous vraiment supprimer ces éléments ?'}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={async () => {
          setConfirmVisible(false);
          await deleteSelected();
        }}
        confirmLabel={t('confirm') || 'Supprimer'}
        cancelLabel={t('cancel') || 'Annuler'}
      />

      {/* Menu (Compte / Problème) — AppModal : le Modal natif figeait l'app. */}
      <AppModal transparent visible={menuVisible} animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)} accessible={false}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.12)' }}>
            <TouchableWithoutFeedback accessible={false}>
              <View style={[{ position: 'absolute', top: 70, left: 26, backgroundColor: colors.card, borderRadius: 16, width: 200, paddingVertical: 8 }, shadows.listCard]}>
                <TouchableOpacity
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('/reglage/compte');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t('account')}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 }}
                >
                  <User size={18} color={colors.inkSoft} />
                  <Txt variant="semibold" size={15} color={colors.ink}>{t('account') || 'Compte'}</Txt>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('../screens/reportUser');
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t('a_problem')}
                  style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13, gap: 12 }}
                >
                  <HelpCircle size={18} color={colors.inkSoft} />
                  <Txt variant="semibold" size={15} color={colors.ink}>{t('a_problem') || 'Un problème ?'}</Txt>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </AppModal>
    </View>
  );
}

type StatTone = 'yellow' | 'green' | 'red';

const STAT_TONE_STYLES: Record<StatTone, { bg: string; label: string; value: string }> = {
  yellow: { bg: colors.yellow, label: '#8a6b12', value: colors.inkOnYellow },
  green: { bg: colors.green, label: '#d9f0dc', value: colors.white },
  red: { bg: colors.redAlt, label: '#fbd9d1', value: colors.white },
};

function StatCard({ label, value, tone = 'yellow' }: { label: string; value: number; tone?: StatTone }) {
  const s = STAT_TONE_STYLES[tone];
  return (
    <View style={{ flex: 1, backgroundColor: s.bg, borderRadius: radius.cardSm, padding: 14 }}>
      <Txt variant="bold" size={10.5} color={s.label} style={{ letterSpacing: 0.5 }}>
        {label}
      </Txt>
      <Txt variant="display" size={34} color={s.value} style={{ marginTop: 8 }}>
        {String(value).padStart(2, '0')}
      </Txt>
    </View>
  );
}

const styles = {
  roundBtnCream: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.cream,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  compactBtn: {
    width: 38,
    height: 38,
  },
};
