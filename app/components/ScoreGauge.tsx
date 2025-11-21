import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type ScoreGaugeProps = {
    score?: number;
    size?: number;
    strokeWidth?: number;
    showText?: boolean;
};

export default function ScoreGauge({
    score = 0,
    size = 120,
    strokeWidth = 10,
    showText = true
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
        if (s >= 75) return '#22C55E'; // Green-500
        if (s >= 50) return '#84CC16'; // Lime-500
        if (s >= 25) return '#F97316'; // Orange-500
        return '#EF4444'; // Red-500
    };

    const color = getScoreColor(score);

    return (
        <View className="items-center justify-center" style={{ width: size, height: size }}>
            <Svg width={size} height={size}>
                {/* Background Circle */}
                <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke="#E5E7EB" // Gray-200
                    strokeWidth={strokeWidth}
                    fill="transparent"
                />
                {/* Progress Circle */}
                <AnimatedCircle
                    cx={center}
                    cy={center}
                    r={radius}
                    stroke={color}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    strokeDasharray={circumference}
                    animatedProps={animatedProps}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${center}, ${center}`}
                />
            </Svg>
            {showText && (
                <View className="absolute items-center justify-center">
                    <Text
                        className="font-bold text-gray-900 dark:text-white"
                        style={{ fontSize: size * 0.35 }}
                    >
                        {score}
                    </Text>
                    <Text
                        className="text-gray-500 dark:text-gray-400 font-medium"
                        style={{ fontSize: size * 0.15 }}
                    >
                        /100
                    </Text>
                </View>
            )}
        </View>
    );
}
