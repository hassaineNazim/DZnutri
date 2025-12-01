import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ScoreGaugeProps = {
    score?: number;
    size?: number;
    strokeWidth?: number;
};

export default function ScoreGauge({
    score = 0,
    size = 80,
    strokeWidth = 8,
}: ScoreGaugeProps) {
    const center = size / 2;
    const radius = center - strokeWidth / 2;
    const circumference = 2 * Math.PI * radius;

    const progress = useSharedValue(0);

    useEffect(() => {
        progress.value = withDelay(300, withTiming(score / 100, { duration: 1500 }));
    }, [score]);

    const animatedProps = useAnimatedProps(() => {
        return {
            strokeDashoffset: circumference * (1 - progress.value),
        };
    });

    const getScoreColor = (s: number) => {
        if (s >= 75) return { main: '#22C55E', bg: '#DCFCE7' }; // Green-500, Green-100
        if (s >= 50) return { main: '#84CC16', bg: '#ECFCCB' }; // Lime-500, Lime-100
        if (s >= 25) return { main: '#F97316', bg: '#FFEDD5' }; // Orange-500, Orange-100
        return { main: '#EF4444', bg: '#FEE2E2' }; // Red-500, Red-100
    };

    const colors = getScoreColor(score);

    return (
        <View className="items-center justify-center" style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                {/* Background Circle (Filled) */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={colors.bg}
                    strokeWidth={strokeWidth}
                    fill={colors.bg} // Fill with light color
                />
                {/* Progress Circle */}
                <AnimatedCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={colors.main}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${center}, ${center}`}
                />
            </Svg>
            <View className="absolute items-center justify-center">
                <Text
                    className="font-bold"
                    style={{
                        fontSize: size * 0.4,
                        color: colors.main
                    }}
                >
                    {score}
                </Text>
            </View>
        </View>
    );
}
