import React, { useCallback, useMemo, useRef } from 'react';
import { Animated as NativeAnimated, FlatList, ScrollView, SectionList, View } from 'react-native';
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

// Reanimated 4 peut parfois ne pas rattacher son gestionnaire de scroll sur
// iOS lorsqu'un ScrollView est monté après un chargement asynchrone. Cette
// variante s'appuie sur Animated.event et son driver natif pour les écrans qui
// ont ce cycle de montage, tout en conservant exactement le même rendu.
export const NativeAnimatedScrollView = NativeAnimated.ScrollView;

export function useNativeCollapsibleHeader() {
  const scrollY = useRef(new NativeAnimated.Value(0)).current;
  const onScroll = useMemo(
    () =>
      NativeAnimated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: true },
      ),
    [scrollY],
  );

  return { scrollY, onScroll };
}

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

export function NativeCollapsibleHeader({
  title,
  scrollY,
  expandedHeight,
  children,
  compactLeft,
  compactRight,
  backgroundColor = colors.bordeaux,
}: Omit<Props, 'scrollY'> & { scrollY: NativeAnimated.Value }) {
  const collapseDistance = Math.max(1, expandedHeight - COMPACT_HEIGHT);
  const expandedHeaderStyle = {
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, collapseDistance],
          outputRange: [0, -collapseDistance],
          extrapolate: 'clamp',
        }),
      },
    ],
  };
  const expandedContentStyle = {
    opacity: scrollY.interpolate({
      inputRange: [0, collapseDistance * 0.7, collapseDistance],
      outputRange: [1, 0.18, 0],
      extrapolate: 'clamp',
    }),
    transform: [
      {
        translateY: scrollY.interpolate({
          inputRange: [0, collapseDistance],
          outputRange: [0, -28],
          extrapolate: 'clamp',
        }),
      },
    ],
  };
  const compactHeaderStyle = {
    opacity: scrollY.interpolate({
      inputRange: [collapseDistance * 0.45, collapseDistance * 0.82],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
  };

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
      <NativeAnimated.View
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
        <NativeAnimated.View style={expandedContentStyle}>
          {children}
        </NativeAnimated.View>
      </NativeAnimated.View>

      <NativeAnimated.View
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
      </NativeAnimated.View>
    </View>
  );
}
