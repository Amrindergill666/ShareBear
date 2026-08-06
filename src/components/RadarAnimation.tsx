import React, { useEffect, useRef } from 'react';
import { StyleSheet, View, Animated } from 'react-native';

interface RadarAnimationProps {
  active: boolean;
}

export function RadarAnimation({ active }: RadarAnimationProps) {
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
        <View style={[styles.center, styles.inactiveCenter]} />
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
      <Animated.View style={[styles.circle, getAnimatedStyle(anim1)]} />
      <Animated.View style={[styles.circle, getAnimatedStyle(anim2)]} />
      <View style={styles.center} />
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
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  center: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  inactiveCenter: {
    backgroundColor: '#64748B',
    borderColor: '#94A3B8',
    shadowColor: '#000000',
  },
});
