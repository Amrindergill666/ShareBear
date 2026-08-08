import { View, StyleSheet, useWindowDimensions, Text, TouchableOpacity, Animated } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useUiStore } from '../store/uiStore';
import {
  House,
  Clock,
  SmartphoneNfc,
  MonitorSpeaker,
} from 'lucide-react-native';

const Navbar = ({ safeAreaInsets }) => {
  const { width, height } = useWindowDimensions();
  const { activeScreen, setActiveScreen } = useUiStore();

  const activeIconColor = '#CBB692';
  const iconColor = '#BEC8C9';

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
      screen: 'Server',
      icon: SmartphoneNfc,
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

  // Animation for the sliding active capsule background
  const [slideAnim] = useState(new Animated.Value(safeActiveIndex));

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: safeActiveIndex,
      useNativeDriver: false,
      tension: 60,
      friction: 9,
    }).start();
  }, [safeActiveIndex]);

  // Interpolate slide value to a percentage left offset centered with the tabs
  const leftPosition = slideAnim.interpolate({
    inputRange: [0, 1, 2, 3],
    outputRange: ['3.5%', '28.5%', '53.5%', '78.5%'],
  });

  return (
    <View
      style={[
        styles.main,
        {
          width: width,
          height: 72,
          bottom: Math.max(safeAreaInsets.bottom, 16),
        },
      ]}
    >
      <View style={styles.inner}>
        {/* Animated Capsule Background behind the active icon */}
        <Animated.View
          style={[
            styles.activebar,
            {
              left: leftPosition,
              backgroundColor: '#56472B',
            },
          ]}
        />

        {bars.map((item, index) => {
          const isActive = activeScreen === item.screen;
          return (
            <TouchableOpacity
              key={index}
              style={styles.tab}
              activeOpacity={0.85}
              onPressIn={() => setActiveScreen(item.screen)}
            >
              <View style={styles.iconContainer}>
                <item.icon
                  size={24}
                  color={isActive ? activeIconColor : iconColor}
                />
              </View>
              <Text
                style={[
                  styles.tabText,
                  isActive ? styles.tabTextActive : styles.tabTextInactive,
                ]}
              >
                {item.name}
              </Text>
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
  },
  inner: {
    backgroundColor: 'rgba(18, 33, 46, 0.85)',
    width: '88%',
    height: '100%',
    borderRadius: 36,
    borderColor: 'rgba(63, 73, 73, 0.3)',
    borderWidth: 1.5,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
    height: '100%',
    zIndex: 2,
  },
  iconContainer: {
    height: 38,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontSize: 12,
    marginTop: 1,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#F8FAFC',
  },
  tabTextInactive: {
    color: '#BEC8C9',
  },
  activebar: {
    position: 'absolute',
    height: 38,
    borderRadius: 19,
    width: '18%',
    top: 8, // Aligns perfectly with the iconContainer's vertical start
    zIndex: 1,
  },
});

export default Navbar;
