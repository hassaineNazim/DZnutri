/**
 * ScoreRing — anneau de score façon « conic-gradient » du redesign.
 * Reproduit en SVG : une piste crème (#ece2cc) + un arc coloré proportionnel au
 * score, avec un disque central affichant le chiffre. Bord franc (butt) pour
 * coller au rendu conique de la maquette.
 */
import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { colors, fonts, scoreColor } from '../../theme/tokens';
import Txt from './Txt';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type Props = {
  score?: number | null;
  size?: number; // diamètre extérieur
  discRatio?: number; // diamètre du disque central / size (défaut 0.76)
  discColor?: string; // couleur du disque central (défaut blanc)
  trackColor?: string; // couleur de la piste vide
  animated?: boolean;
  fontSize?: number;
};

export default function ScoreRing({
  score,
  size = 50,
  discRatio = 0.76,
  discColor = colors.card,
  trackColor = colors.ringTrack,
  animated = true,
  fontSize,
}: Props) {
  const hasScore = typeof score === 'number';
  const value = hasScore ? Math.max(0, Math.min(100, score as number)) : 0;
  const color = scoreColor(hasScore ? value : null);

  const discSize = size * discRatio;
  const strokeWidth = (size - discSize) / 2;
  const radius = (size - strokeWidth) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const progress = useSharedValue(animated ? 0 : value / 100);

  useEffect(() => {
    if (animated) {
      progress.value = withDelay(200, withTiming(value / 100, { duration: 1100 }));
    } else {
      progress.value = value / 100;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, animated]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Piste (vide) */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Arc coloré proportionnel au score */}
        {hasScore && (
          <AnimatedCircle
            cx={center}
            cy={center}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            animatedProps={animatedProps}
            strokeLinecap="butt"
            rotation="-90"
            origin={`${center}, ${center}`}
          />
        )}
      </Svg>
      {/* Disque central + chiffre */}
      <View
        style={{
          position: 'absolute',
          width: discSize,
          height: discSize,
          borderRadius: discSize / 2,
          backgroundColor: discColor,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Txt
          color={color}
          size={fontSize ?? size * 0.32}
          style={{ fontFamily: fonts.displayBlack }}
        >
          {hasScore ? value : '–'}
        </Txt>
      </View>
    </View>
  );
}
