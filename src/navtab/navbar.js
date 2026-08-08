import { View, StyleSheet, useWindowDimensions, Text, TouchableOpacity, Animated, PanResponder } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { useUiStore } from '../store/uiStore';
import { useTheme } from '../theme';
import {
  House,
  Clock,
  MonitorSpeaker,
  Radio
} from 'lucide-react-native';

const TAB_WIDTH = 86;
const PADDING_HORIZONTAL = 0;
const CAPSULE_WIDTH = 80;
const CAPSULE_HEIGHT = 58;
const NAVBAR_HEIGHT = 64;

const Navbar = ({ safeAreaInsets }) => {
  const { width } = useWindowDimensions();
  const { activeScreen, setActiveScreen } = useUiStore();
  const { colors } = useTheme();

  const activeIconColor = colors.navActiveIcon;
  const iconColor = colors.navInactiveIcon;

  const bars = [
    {
      name: 'Home',
      screen: 'Home',
      icon: House,
    },
    {
      name: 'History',
      screen: 'Transfers',
      icon: Clock,
    },
    {
      name: 'Nearby',
      screen: 'Nearby',
      icon: Radio,
    },
    {
      name: 'Devices',
      screen: 'Settings',
      icon: MonitorSpeaker,
    },
  ];

  // Find the index of the active screen
  const activeIndex = bars.findIndex(item => item.screen === activeScreen);
  const safeActiveIndex = activeIndex === -1 ? 0 : activeIndex;

  // Animation for the sliding / dragging active capsule background (hardware accelerated)
  const slideAnim = useRef(new Animated.Value(safeActiveIndex)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dragStartIndex = useRef(safeActiveIndex);
  const isDragging = useRef(false);

  useEffect(() => {
    dragStartIndex.current = safeActiveIndex;
    if (!isDragging.current) {
      Animated.spring(slideAnim, {
        toValue: safeActiveIndex,
        useNativeDriver: true,
        tension: 85,
        friction: 11,
      }).start();
    }
  }, [safeActiveIndex]);

  // PanResponder to make the navbar draggable with release-to-switch & drag-scale effect
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 6;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        slideAnim.stopAnimation();

        // Scale up the capsule slightly during drag for a tactile, elevated feel
        Animated.spring(scaleAnim, {
          toValue: 1.1,
          useNativeDriver: true,
          tension: 140,
          friction: 8,
        }).start();
      },
      onPanResponderMove: (_, gestureState) => {
        const deltaIndex = gestureState.dx / TAB_WIDTH;
        const rawIndex = dragStartIndex.current + deltaIndex;
        const clampedIndex = Math.max(0, Math.min(bars.length - 1, rawIndex));
        slideAnim.setValue(clampedIndex);
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        const deltaIndex = gestureState.dx / TAB_WIDTH;
        let targetIndex = dragStartIndex.current + deltaIndex;

        // Account for flick velocity
        if (gestureState.vx > 0.35) {
          targetIndex = Math.ceil(targetIndex);
        } else if (gestureState.vx < -0.35) {
          targetIndex = Math.floor(targetIndex);
        } else {
          targetIndex = Math.round(targetIndex);
        }

        targetIndex = Math.max(0, Math.min(bars.length - 1, targetIndex));
        dragStartIndex.current = targetIndex;

        // Snap animation
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: targetIndex,
            useNativeDriver: true,
            tension: 90,
            friction: 11,
            velocity: gestureState.vx,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 110,
            friction: 9,
          }),
        ]).start();

        // Switch screen to the dropped tab
        setActiveScreen(bars[targetIndex].screen);
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: dragStartIndex.current,
            useNativeDriver: true,
            tension: 90,
            friction: 11,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 110,
            friction: 9,
          }),
        ]).start();
      },
    })
  ).current;

  // Interpolate translateX for GPU-accelerated 60/120fps motion
  const translateX = slideAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: [0, TAB_WIDTH, TAB_WIDTH * 2, TAB_WIDTH * 3],
  });

  const totalNavWidth = TAB_WIDTH * bars.length + PADDING_HORIZONTAL * 2;
  const capsuleLeftOffset = PADDING_HORIZONTAL + (TAB_WIDTH - CAPSULE_WIDTH) / 2;

  const handleTabPress = (screenName) => {
    setActiveScreen(screenName);
  };

  return (
    <View
      style={[
        styles.main,
        {
          width: width,
          bottom: Math.max(safeAreaInsets?.bottom || 0, 30),
        },
      ]}
      pointerEvents="box-none"
    >
      <View
        style={[
          styles.inner,
          {
            width: totalNavWidth,
            height: NAVBAR_HEIGHT,
            backgroundColor: colors.navBg,
            borderColor: colors.cardBorder,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Hardware-accelerated Full-Capsule Spotlight behind active icon + text */}
        <Animated.View
          style={[
            styles.activeCapsule,
            {
              left: capsuleLeftOffset,
              transform: [
                { translateX },
                { scale: scaleAnim },
              ],
              width: CAPSULE_WIDTH,
              height: CAPSULE_HEIGHT,
              borderRadius: CAPSULE_HEIGHT / 2,
              backgroundColor: colors.navActiveBg,
              borderColor: `${colors.primary}33`,
            },
          ]}
        />

        {bars.map((item, index) => {
          const isActive = activeScreen === item.screen;
          const IconComponent = item.icon;

          return (
            <TouchableOpacity
              key={index}
              style={[styles.tab, { width: TAB_WIDTH }]}
              activeOpacity={0.7}
              onPress={() => handleTabPress(item.screen)}
            >
              <View style={styles.tabContent}>
                <View style={styles.iconContainer}>
                  <IconComponent
                    size={21}
                    color={isActive ? activeIconColor : iconColor}
                    strokeWidth={isActive ? 2.4 : 1.9}
                  />
                </View>
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: isActive ? colors.textPrimary : colors.textSecondary,
                      fontWeight: isActive ? '700' : '500',
                      opacity: isActive ? 1 : 0.85,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  main: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    left: 0,
    right: 0,
    zIndex: 99,
  },
  inner: {
    borderRadius: 32,
    borderWidth: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
    paddingHorizontal: PADDING_HORIZONTAL,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  tab: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 10.5,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  activeCapsule: {
    position: 'absolute',
    top: (NAVBAR_HEIGHT - CAPSULE_HEIGHT) / 3,
    zIndex: 1,
    borderWidth: 1,
    // shadowColor: '#000000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.2,
    // shadowRadius: 4,
    // elevation: 2,
  },
});

export default Navbar;
