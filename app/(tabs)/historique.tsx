import { useRouter } from 'expo-router';
import { HelpCircle, ScanLine, Trash2, User, X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  SectionList,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import ConfirmModal from '../components/ConfirmModal';
import AppModal from '../components/ui/AppModal';
import ProductCard, { ProductCardItem } from '../components/ui/ProductCard';
import Txt from '../components/ui/Txt';
import { useTranslation } from '../i18n';
import { colors, radius, shadows } from '../theme/tokens';
import { deleteCosmeticFromHistory, deleteFromHistory, fetchHistory } from '../services/saveHistorique';

type Product = ProductCardItem & { nutrition_grades?: string };

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
  const { t } = useTranslation();
  const router = useRouter();

  const loadHistory = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const serverHistory = await fetchHistory();
      setHistory(serverHistory);
    } catch (error) {
      console.error(error);
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
    return { scans: history.length, avg, alertes };
  }, [history]);

  const sections = useMemo(() => buildSections(history, t), [history, t]);

  const toggleSelect = (key: string) =>
    setSelectedIds((prev) => (prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key]));
  const clearSelection = () => setSelectedIds([]);

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
      {/* ---- Entête bordeaux ---- */}
      <View style={{ paddingHorizontal: 26, paddingTop: 18, paddingBottom: 18 }}>
        {selecting ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 46 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Pressable onPress={clearSelection} style={styles.roundBtnCream}>
                <X size={20} color={colors.bordeaux} />
              </Pressable>
              <Txt variant="displayXBold" size={22} color={colors.creamTitle}>
                {selectedIds.length} {t('selected') || 'sélectionné(s)'}
              </Txt>
            </View>
            <Pressable
              onPress={() => selectedIds.length && setConfirmVisible(true)}
              style={[styles.roundBtnCream, { backgroundColor: colors.redAlt }]}
            >
              <Trash2 size={20} color={colors.white} />
            </Pressable>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Pressable onPress={() => setMenuVisible(true)} style={styles.roundBtnCream}>
                <User size={22} color={colors.bordeaux} />
              </Pressable>
              <TouchableOpacity
                onPress={() => router.push('/scanner')}
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
              {t('history') || 'Historique'}
            </Txt>

            {/* 3 stats */}
            <View style={{ flexDirection: 'row', gap: 11, marginTop: 20 }}>
              <StatCard label={t('scans') || 'SCANS'} value={stats.scans} />
              <StatCard label={t('avg_score') || 'SCORE MOY.'} value={stats.avg} />
              <StatCard label={t('alerts') || 'ALERTES'} value={stats.alertes} alert />
            </View>
          </>
        )}
      </View>

      {/* ---- Feuille crème ---- */}
      <View style={{ flex: 1, backgroundColor: colors.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
        <SectionList
          sections={sections}
          keyExtractor={itemKey}
          contentContainerStyle={{ padding: 22, paddingBottom: 120 }}
          stickySectionHeadersEnabled={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.green]} tintColor={colors.green} />
          }
          renderSectionHeader={({ section }) => (
            <Txt variant="displayXBold" size={20} color={colors.ink} style={{ marginBottom: 12, marginTop: section.key === 'today' ? 0 : 10 }}>
              {section.title}
            </Txt>
          )}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).springify()} style={{ marginBottom: 12 }}>
              <ProductCard
                item={item}
                selected={selectedIds.includes(itemKey(item))}
                onPress={() => (selecting ? toggleSelect(itemKey(item)) : handleItemPress(item))}
                onLongPress={() => toggleSelect(itemKey(item))}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', marginTop: 70, opacity: 0.5 }}>
              <Trash2 size={56} color={colors.inkSoft} />
              <Txt variant="medium" size={16} color={colors.inkSoft} style={{ marginTop: 16, textAlign: 'center' }}>
                {t('history_empty')}
              </Txt>
            </View>
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
        <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.12)' }}>
            <TouchableWithoutFeedback>
              <View style={[{ position: 'absolute', top: 70, left: 26, backgroundColor: colors.card, borderRadius: 16, width: 200, paddingVertical: 8 }, shadows.listCard]}>
                <TouchableOpacity
                  onPress={() => {
                    setMenuVisible(false);
                    router.push('/reglage/compte');
                  }}
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

function StatCard({ label, value, alert = false }: { label: string; value: number; alert?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: alert ? colors.redAlt : colors.yellow, borderRadius: radius.cardSm, padding: 14 }}>
      <Txt variant="bold" size={10.5} color={alert ? '#fbd9d1' : '#8a6b12'} style={{ letterSpacing: 0.5 }}>
        {label}
      </Txt>
      <Txt variant="display" size={34} color={alert ? colors.white : colors.inkOnYellow} style={{ marginTop: 8 }}>
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
};
