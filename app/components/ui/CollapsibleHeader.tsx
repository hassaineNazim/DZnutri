import React, { useMemo, useRef } from 'react';
import { Animated, View } from 'react-native';
import Txt from './Txt';
import { colors } from '../../theme/tokens';

type Props = {
  title: string;
  scrollY: Animated.Value;
  expandedHeight: number;
  children: React.ReactNode;
  compactLeft?: React.ReactNode;
  compactRight?: React.ReactNode;
  backgroundColor?: string;
};

const COMPACT_HEIGHT = 62;

export function useCollapsibleHeader() {
  const scrollY = useRef(new Animated.Value(0)).current;
  // Animated.event conserve tous les événements du geste et rend la réduction
  // de l'entête fluide. Le pilote reste volontairement côté JS : brancher le
  // pilote natif sur une SectionList non animée faisait planter Fabric/iOS.
  const onScroll = useMemo(
    () =>
      Animated.event(
        [{ nativeEvent: { contentOffset: { y: scrollY } } }],
        { useNativeDriver: false },
      ),
    [scrollY],
  );

  return { scrollY, onScroll };
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
  const headerTranslateY = scrollY.interpolate({
    inputRange: [0, collapseDistance],
    outputRange: [0, -collapseDistance],
    extrapolate: 'clamp',
  });
  const expandedOpacity = scrollY.interpolate({
    inputRange,
    outputRange: [1, 0.18, 0],
    extrapolate: 'clamp',
  });
  const expandedTranslateY = scrollY.interpolate({
    inputRange: [0, collapseDistance],
    outputRange: [0, -28],
    extrapolate: 'clamp',
  });
  const compactOpacity = scrollY.interpolate({
    inputRange: [collapseDistance * 0.45, collapseDistance * 0.82],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

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
      <Animated.View
        pointerEvents="box-none"
        style={{
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
          transform: [{ translateY: headerTranslateY }],
        }}
      >
        <Animated.View style={{ opacity: expandedOpacity, transform: [{ translateY: expandedTranslateY }] }}>
          {children}
        </Animated.View>
      </Animated.View>

      <Animated.View
        pointerEvents="box-none"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 0,
          height: COMPACT_HEIGHT,
          paddingHorizontal: 18,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor,
          opacity: compactOpacity,
        }}
      >
        <View style={{ width: 46, alignItems: 'flex-start' }}>{compactLeft}</View>
        <Txt variant="displayXBold" size={20} color={colors.creamTitle} numberOfLines={1} style={{ flex: 1, textAlign: 'center' }}>
          {title}
        </Txt>
        <View style={{ width: 46, alignItems: 'flex-end' }}>{compactRight}</View>
      </Animated.View>
    </View>
  );
}
