import axios from 'axios';
import { useRouter } from 'expo-router';
import { Search, SlidersHorizontal, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StatusBar, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import FilterModal from '../components/FilterModal';
import ProductCard from '../components/ui/ProductCard';
import CollapsibleHeader, { useCollapsibleHeader } from '../components/ui/CollapsibleHeader';
import Txt from '../components/ui/Txt';
import { useTranslation } from '../i18n';
import { api } from '../services/axios';
import { colors, fonts, radius, shadows } from '../theme/tokens';

type Product = {
  id: string;
  barcode: string;
  product_name?: string;
  brands?: string;
  brand?: string;
  image_url?: string;
  grade?: string;
  nutriscore_grade?: string;
  custom_score?: number;
};

type SearchFilters = {
  category?: string;
  subcategory?: string;
  minScore?: number;
  verifiedOnly: boolean;
};

export default function Rech() {
  const { t } = useTranslation();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    verifiedOnly: false,
  });
  const [searchError, setSearchError] = useState(false);
  const { scrollY, onScroll } = useCollapsibleHeader();

  const inputRef = useRef<TextInput | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const requestSequence = useRef(0);
  const filtersActive = Object.keys(filters).length > 1 || filters.verifiedOnly;
  const searchHeaderHeight = filtersActive ? 310 : 250;

  const runSearch = useCallback(async (searchQuery: string, searchFilters: SearchFilters) => {
    if (!searchQuery.trim() && Object.keys(searchFilters).length === 1 && !searchFilters.verifiedOnly) {
      abortRef.current?.abort();
      abortRef.current = null;
      requestSequence.current += 1;
      setLoading(false);
      setSearchError(false);
      setHasSearched(false);
      setResults([]);
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = ++requestSequence.current;
    setLoading(true);
    setHasSearched(true);
    setSearchError(false);
    try {
      const params = new URLSearchParams();
      if (searchQuery.trim()) params.append('q', searchQuery.trim());
      if (searchFilters.category) params.append('category', searchFilters.category);
      if (searchFilters.subcategory) params.append('subcategory', searchFilters.subcategory);
      if (searchFilters.minScore !== undefined) params.append('min_score', searchFilters.minScore.toString());
      if (searchFilters.verifiedOnly) params.append('verified_only', 'true');

      const response = await api.get(`/api/search?${params.toString()}`, {
        signal: controller.signal,
      });
      if (requestId === requestSequence.current) setResults(response.data || []);
    } catch (error: unknown) {
      if (axios.isCancel(error) || controller.signal.aborted) return;
      console.error('Search error:', error);
      if (requestId === requestSequence.current) setSearchError(true);
    } finally {
      if (requestId === requestSequence.current) setLoading(false);
    }
  }, []);

  const searchProducts = () => runSearch(query, filters);

  // Relance la recherche quand les filtres changent.
  useEffect(() => {
    if (hasSearched) {
      runSearch(query, filters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  // Recherche « live » : 400 ms après la fin de saisie (dès 2 caractères).
  useEffect(() => {
    const trimmedQuery = query.trim();
    if (trimmedQuery.length === 0) {
      runSearch('', filters);
      return;
    }
    if (trimmedQuery.length < 2) {
      abortRef.current?.abort();
      abortRef.current = null;
      requestSequence.current += 1;
      setLoading(false);
      return;
    }
    const timer = setTimeout(() => {
      runSearch(query, filters);
    }, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(
    () => () => {
      abortRef.current?.abort();
    },
    [],
  );

  const clearFilter = (patch: Partial<typeof filters>) => setFilters((prev) => ({ ...prev, ...patch }));

  return (
    <View style={{ flex: 1, backgroundColor: colors.bordeaux }}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bordeaux} />
      {/* ---- Entête bordeaux ---- */}
      <CollapsibleHeader title={t('rech') || t('search')} scrollY={scrollY} expandedHeight={searchHeaderHeight}>
      <View style={{ paddingHorizontal: 26, paddingTop: 18, paddingBottom: 18 }}>
        <Txt variant="bold" size={12} color={colors.yellow} style={{ letterSpacing: 1.2 }}>
          {(t('search_subtitle') || 'Trouvez des produits sains').toUpperCase()}
        </Txt>
        <Txt variant="display" size={46} color={colors.creamTitle} style={{ marginTop: 4, letterSpacing: -0.5 }}>
          {t('search') || 'Recherche'}
        </Txt>

        {/* Barre de recherche + filtre */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}>
          <View style={[{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.cardSm, paddingHorizontal: 14, paddingVertical: 12 }, shadows.listCard]}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={t('search')}
              onPress={searchProducts}
            >
              <Search size={20} color={colors.inkSoft} />
            </TouchableOpacity>
            <TextInput
              ref={inputRef}
              accessibilityLabel={t('search_products')}
              style={{ marginLeft: 10, flex: 1, fontSize: 15, color: colors.ink, fontFamily: fonts.sans }}
              placeholder={t('search_products')}
              placeholderTextColor={colors.inkMeta}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={searchProducts}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t('clear_search')}
                onPress={() => {
                  setQuery('');
                  inputRef.current?.focus();
                }}
                style={{ padding: 4, backgroundColor: colors.chipBg, borderRadius: 20 }}
              >
                <X size={15} color={colors.inkSoft} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            accessibilityRole="button"
            accessibilityLabel={t('open_filters')}
            accessibilityState={{ selected: filtersActive }}
            style={[
              { width: 48, height: 48, borderRadius: radius.cardSm, alignItems: 'center', justifyContent: 'center', backgroundColor: filtersActive ? colors.yellow : colors.card },
              shadows.listCard,
            ]}
          >
            <SlidersHorizontal size={20} color={filtersActive ? colors.inkOnYellow : colors.inkSoft} />
          </TouchableOpacity>
        </View>

        {/* Chips de filtres actifs */}
        {(filters.category || filters.subcategory || filters.minScore || filters.verifiedOnly) && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {filters.category && (
              <FilterChip label={filters.category} onRemove={() => clearFilter({ category: undefined, subcategory: undefined })} />
            )}
            {filters.subcategory && (
              <FilterChip label={filters.subcategory} onRemove={() => clearFilter({ subcategory: undefined })} />
            )}
            {filters.minScore !== undefined && (
              <FilterChip label={`${t('score') || 'Score'} > ${filters.minScore}`} onRemove={() => clearFilter({ minScore: undefined })} />
            )}
            {filters.verifiedOnly && (
              <FilterChip label={t('verified_only') || 'Vérifiés'} onRemove={() => clearFilter({ verifiedOnly: false })} />
            )}
          </View>
        )}
      </View>
      </CollapsibleHeader>

      {/* ---- Feuille crème : résultats ---- */}
      <View style={{ flex: 1, backgroundColor: colors.sheet, borderTopLeftRadius: radius.sheet, borderTopRightRadius: radius.sheet, overflow: 'hidden' }}>
        {loading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: searchHeaderHeight }}>
            <ActivityIndicator size="large" color={colors.green} />
          </View>
        ) : (
          <Animated.FlatList
            data={results}
            keyExtractor={(item) => item.barcode || item.id}
            contentContainerStyle={{ padding: 22, paddingTop: searchHeaderHeight + 22, paddingBottom: 120 }}
            itemLayoutAnimation={Layout.springify()}
            showsVerticalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
            renderItem={({ item, index }) => (
              <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 45).springify()} style={{ marginBottom: 12 }}>
                <ProductCard
                  item={item as any}
                  onPress={() =>
                    router.push({
                      pathname: '../screens/productDetail',
                      params: { product: JSON.stringify(item) },
                    })
                  }
                />
              </Animated.View>
            )}
            ListEmptyComponent={
              searchError ? (
                <View style={{ marginTop: 50, alignItems: 'center', paddingHorizontal: 20 }}>
                  <Txt variant="medium" size={15} color={colors.red} style={{ textAlign: 'center' }}>
                    {t('search_error')}
                  </Txt>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={t('retry')}
                    onPress={searchProducts}
                    style={{ marginTop: 14, backgroundColor: colors.yellow, borderRadius: radius.pill, paddingHorizontal: 18, paddingVertical: 11 }}
                  >
                    <Txt variant="bold" size={14} color={colors.inkOnYellow}>{t('retry')}</Txt>
                  </TouchableOpacity>
                </View>
              ) : hasSearched ? (
                <View style={{ marginTop: 50, alignItems: 'center' }}>
                  <Txt variant="medium" size={15} color={colors.inkSoft} style={{ textAlign: 'center' }}>
                    {t('no_products_found')}
                  </Txt>
                </View>
              ) : (
                <View style={{ marginTop: 70, alignItems: 'center', opacity: 0.5 }}>
                  <Search size={60} color={colors.inkSoft} />
                  <Txt variant="medium" size={15} color={colors.inkSoft} style={{ textAlign: 'center', marginTop: 16, maxWidth: 220 }}>
                    {t('search_placeholder_text')}
                  </Txt>
                </View>
              )
            }
          />
        )}
      </View>

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        initialFilters={filters}
        onApply={(newFilters) => {
          setFilters(newFilters);
          setFilterModalVisible(false);
        }}
      />
    </View>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(244,234,214,0.16)', paddingLeft: 12, paddingRight: 8, paddingVertical: 6, borderRadius: radius.pill }}>
      <Txt variant="semibold" size={12} color={colors.cream}>{label}</Txt>
      <TouchableOpacity
        onPress={onRemove}
        accessibilityRole="button"
        accessibilityLabel={`${t('delete')} ${label}`}
      >
        <X size={13} color={colors.rose2} />
      </TouchableOpacity>
    </View>
  );
}
