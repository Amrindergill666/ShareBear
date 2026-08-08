import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';
import { useTheme } from '../theme';

interface RadarAnimationProps {
  active: boolean;
  color?: string;
}

export function RadarAnimation({ active, color }: RadarAnimationProps) {
  const { colors } = useTheme();
  const pulseColor = color || colors.primary;

  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (active) {
      const createLoop = (animatedValue: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animatedValue, {
              toValue: 1,
              duration: 2500,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const loop1 = createLoop(anim1, 0);
      const loop2 = createLoop(anim2, 1250);

      loop1.start();
      loop2.start();

      return () => {
        loop1.stop();
        loop2.stop();
        anim1.setValue(0);
        anim2.setValue(0);
      };
    } else {
      anim1.setValue(0);
      anim2.setValue(0);
      return undefined;
    }
  }, [active, anim1, anim2]);

  if (!active) {
    return (
      <View style={styles.container}>
        <View style={[styles.center, { backgroundColor: colors.textMuted, borderColor: colors.outline }]} />
      </View>
    );
  }

  const getAnimatedStyle = (animatedValue: Animated.Value) => {
    const scale = animatedValue.interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 2.5],
    });

    const opacity = animatedValue.interpolate({
      inputRange: [0, 0.8, 1],
      outputRange: [0.6, 0.4, 0],
    });

    return {
      transform: [{ scale }],
      opacity,
    };
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          { borderColor: pulseColor, backgroundColor: `${pulseColor}33` },
          getAnimatedStyle(anim1),
        ]}
      />
      <Animated.View
        style={[
          styles.circle,
          { borderColor: pulseColor, backgroundColor: `${pulseColor}33` },
          getAnimatedStyle(anim2),
        ]}
      />
      <View
        style={[
          styles.center,
          {
            backgroundColor: pulseColor,
            shadowColor: pulseColor,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 140,
    height: 140,
  },
  circle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
  },
  center: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
});
