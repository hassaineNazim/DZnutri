import React, { useCallback, useRef } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  SectionList,
  View,
} from 'react-native';
import Reanimated, {
  Extrapolation,
  interpolate,
  type SharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import Txt from './Txt';
import { colors } from '../../theme/tokens';

type Props = {
  title: string;
  scrollY: SharedValue<number>;
  expandedHeight: number;
  children: React.ReactNode;
  compactLeft?: React.ReactNode;
  compactRight?: React.ReactNode;
  backgroundColor?: string;
};

const COMPACT_HEIGHT = 62;

// Reanimated relie directement le geste natif aux styles du bandeau. Ce chemin
// reste sur le thread UI et ne dépend ni de la fréquence du pont JS, ni de la
// hauteur particulière de l'iPhone.
export const AnimatedScrollView = Reanimated.createAnimatedComponent(ScrollView) as unknown as typeof ScrollView;
export const AnimatedFlatList = Reanimated.createAnimatedComponent(FlatList) as unknown as typeof FlatList;
export const AnimatedSectionList = Reanimated.createAnimatedComponent(SectionList) as unknown as typeof SectionList;

export function useCollapsibleHeader() {
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = Math.max(0, event.contentOffset.y);
    },
  });
  const resetScrollY = useCallback(() => {
    scrollY.value = 0;
  }, [scrollY]);

  return { scrollY, onScroll, resetScrollY };
}

// Variante fiable pour les onglets racine. L'événement standard de ScrollView
// évite de dépendre de l'enregistrement implicite d'un observateur Reanimated,
// qui peut manquer son rattachement sur iOS quand les onglets restent montés.
export function useCollapsibleScrollRef() {
  const scrollRef = useRef<ScrollView>(null);
  const scrollY = useSharedValue(0);
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      scrollY.value = Math.max(0, event.nativeEvent.contentOffset.y);
    },
    [scrollY],
  );
  const resetScroll = useCallback(() => {
    scrollRef.current?.scrollTo({ x: 0, y: 0, animated: false });
    scrollY.value = 0;
  }, [scrollY]);

  return { scrollRef, scrollY, onScroll, resetScroll };
}

/**
 * Bandeau superposé au contenu : il glisse hors de l'écran sans modifier la
 * hauteur de la liste pendant le geste, puis conserve un titre compact.
 */
export default function CollapsibleHeader({
  title,
  scrollY,
  expandedHeight,
  children,
  compactLeft,
  compactRight,
  backgroundColor = colors.bordeaux,
}: Props) {
  const collapseDistance = Math.max(1, expandedHeight - COMPACT_HEIGHT);
  const inputRange = [0, collapseDistance * 0.7, collapseDistance];
  const expandedHeaderStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, collapseDistance],
          [0, -collapseDistance],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const expandedContentStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, inputRange, [1, 0.18, 0], Extrapolation.CLAMP),
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [0, collapseDistance],
          [0, -28],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));
  const compactHeaderStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      scrollY.value,
      [collapseDistance * 0.45, collapseDistance * 0.82],
      [0, 1],
      Extrapolation.CLAMP,
    ),
  }));

  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: expandedHeight,
        zIndex: 20,
        elevation: 20,
      }}
    >
      <Reanimated.View
        pointerEvents="box-none"
        style={[
          {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            height: expandedHeight,
            backgroundColor,
            borderBottomLeftRadius: 26,
            borderBottomRightRadius: 26,
            overflow: 'hidden',
          },
          expandedHeaderStyle,
        ]}
      >
        <Reanimated.View style={expandedContentStyle}>
          {children}
        </Reanimated.View>
      </Reanimated.View>

      <Reanimated.View
        pointerEvents="box-none"
        style={[
          {
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            height: COMPACT_HEIGHT,
            paddingHorizontal: 18,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor,
          },
          compactHeaderStyle,
        ]}
      >
        <View style={{ width: 46, alignItems: 'flex-start' }}>{compactLeft}</View>
        <Txt variant="displayXBold" size={20} color={colors.creamTitle} numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
          {title}
        </Txt>
        <View style={{ width: 46, alignItems: 'flex-end' }}>{compactRight}</View>
      </Reanimated.View>
    </View>
  );
}
