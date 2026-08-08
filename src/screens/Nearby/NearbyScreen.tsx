import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useDeviceStore, Device } from '../../store/deviceStore';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import {
  startDiscovery,
  stopDiscovery,
} from '../../features/discovery/discoveryManager';
import { startOutgoingTransfer } from '../../features/transfer/TransferManager';
import DocumentPicker from 'react-native-document-picker';
import { useTheme } from '../../theme';
import {
  Menu,
  Bell,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Wifi,
  ArrowRight,
  Radio,
  Disc,
} from 'lucide-react-native';

export function NearbyScreen() {
  const { devices } = useDeviceStore();
  const { isDiscoveryActive } = useUiStore();
  const { deviceName } = useSettingsStore();
  const { colors } = useTheme();

  const deviceList = Object.values(devices);

  // Concentric radar wave animations
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const pulseDot = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    // Auto-start discovery when navigating to Nearby screen if inactive
    if (!isDiscoveryActive) {
      startDiscovery().catch(err => console.warn('[NearbyScreen] Start discovery error:', err));
    }
  }, []);

  useEffect(() => {
    if (isDiscoveryActive) {
      const createWave = (animVal: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(animVal, {
              toValue: 1,
              duration: 3200,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ])
        );
      };

      const dotLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseDot, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseDot, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );

      const anim1 = createWave(wave1, 0);
      const anim2 = createWave(wave2, 1050);
      const anim3 = createWave(wave3, 2100);

      anim1.start();
      anim2.start();
      anim3.start();
      dotLoop.start();

      return () => {
        anim1.stop();
        anim2.stop();
        anim3.stop();
        dotLoop.stop();
        wave1.setValue(0);
        wave2.setValue(0);
        wave3.setValue(0);
        pulseDot.setValue(0.4);
      };
    } else {
      wave1.setValue(0);
      wave2.setValue(0);
      wave3.setValue(0);
      pulseDot.setValue(0.4);
      return undefined;
    }
  }, [isDiscoveryActive]);

  const handleToggleDiscovery = async () => {
    if (isDiscoveryActive) {
      await stopDiscovery();
    } else {
      await startDiscovery();
    }
  };

  const handleDevicePress = async (device: Device) => {
    try {
      const result = await DocumentPicker.pick({
        allowMultiSelection: true,
        type: [DocumentPicker.types.allFiles],
      });

      if (result && result.length > 0) {
        const filesToTransfer = result.map((file, idx) => ({
          id: `file-${Date.now()}-${idx}`,
          name: file.name || 'unnamed_file',
          size: file.size || 0,
          mime: file.type || 'application/octet-stream',
          uri: file.uri,
        }));

        await startOutgoingTransfer(device.ip, device.port, filesToTransfer);
      }
    } catch (err) {
      if (DocumentPicker.isCancel(err)) {
        console.log('[NearbyScreen] User cancelled document picker');
      } else {
        console.error('[NearbyScreen] Document picker error:', err);
      }
    }
  };

  const getDeviceIcon = (platform: string, name: string) => {
    const p = platform.toLowerCase();
    const n = name.toLowerCase();

    if (p === 'macos' || n.includes('macbook') || n.includes('laptop') || p === 'windows' || p === 'linux') {
      return <Laptop size={22} color={colors.primary} strokeWidth={2} />;
    }
    if (n.includes('ipad') || n.includes('tablet')) {
      return <Tablet size={22} color={colors.primary} strokeWidth={2} />;
    }
    if (n.includes('tv') || n.includes('desktop')) {
      return <Monitor size={22} color={colors.primary} strokeWidth={2} />;
    }
    return <Smartphone size={22} color={colors.primary} strokeWidth={2} />;
  };

  const getWaveStyle = (anim: Animated.Value) => {
    const scale = anim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.65, 2.3],
    });
    const opacity = anim.interpolate({
      inputRange: [0, 0.4, 0.8, 1],
      outputRange: [0.55, 0.35, 0.15, 0],
    });
    return {
      transform: [{ scale }],
      opacity,
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
          <Menu size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>ShareBear</Text>
        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
          <Bell size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Radar Hero Area */}
        <View style={styles.radarSection}>
          {/* Concentric Animated Radar Waves */}
          {isDiscoveryActive && (
            <>
              <Animated.View
                style={[
                  styles.radarWave,
                  { borderColor: colors.primary, backgroundColor: `${colors.primary}12` },
                  getWaveStyle(wave1),
                ]}
              />
              <Animated.View
                style={[
                  styles.radarWave,
                  { borderColor: colors.primary, backgroundColor: `${colors.primary}08` },
                  getWaveStyle(wave2),
                ]}
              />
              <Animated.View
                style={[
                  styles.radarWave,
                  { borderColor: colors.primary, backgroundColor: `${colors.primary}05` },
                  getWaveStyle(wave3),
                ]}
              />
            </>
          )}

          {/* Static Background Rings */}
          <View style={[styles.staticRing, styles.staticRingOuter, { borderColor: `${colors.outlineVariant}50` }]} />
          <View style={[styles.staticRing, styles.staticRingInner, { borderColor: `${colors.outlineVariant}70` }]} />

          {/* Central Device Card Illustration */}
          <View
            style={[
              styles.centerDeviceBadge,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: `${colors.primary}44`,
                shadowColor: colors.primary,
              },
            ]}
          >
            <View style={[styles.centerDeviceScreen, { backgroundColor: `${colors.secondary}22` }]}>
              <Text style={styles.centerDeviceIcon}>🐻</Text>
              <Text style={[styles.centerDeviceSub, { color: colors.textSecondary }]} numberOfLines={1}>
                {deviceName || 'ShareBear'}
              </Text>
            </View>
          </View>

          {/* Scanning Status Pill */}
          <TouchableOpacity
            style={[
              styles.statusPill,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.cardBorder,
              },
            ]}
            activeOpacity={0.8}
            onPress={handleToggleDiscovery}
          >
            <Animated.View
              style={[
                styles.pulseDot,
                {
                  backgroundColor: isDiscoveryActive ? colors.secondary : colors.textMuted,
                  opacity: isDiscoveryActive ? pulseDot : 1,
                },
              ]}
            />
            <Text style={[styles.statusPillText, { color: colors.textPrimary }]}>
              {isDiscoveryActive ? 'Scanning for devices...' : 'Tap to start scanning'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* People Nearby Section */}
        <View style={styles.sectionContainer}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            People Nearby {deviceList.length > 0 && `(${deviceList.length})`}
          </Text>

          {deviceList.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.emptyCardTitle, { color: colors.textPrimary }]}>
                {isDiscoveryActive ? 'Searching for devices nearby...' : 'Discovery is paused'}
              </Text>
              <Text style={[styles.emptyCardSubtitle, { color: colors.textSecondary }]}>
                {isDiscoveryActive
                  ? 'Devices with ShareBear open will appear here automatically.'
                  : 'Tap the status pill above to resume scanning.'}
              </Text>
            </View>
          ) : (
            deviceList.map((device) => {
              return (
                <TouchableOpacity
                  key={device.id}
                  style={[
                    styles.deviceCard,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  activeOpacity={0.75}
                  onPress={() => handleDevicePress(device)}
                >
                  {/* Left Device Icon Circle */}
                  <View
                    style={[
                      styles.deviceIconCircle,
                      {
                        backgroundColor: colors.primaryContainer,
                        borderColor: `${colors.primary}33`,
                      },
                    ]}
                  >
                    {getDeviceIcon(device.platform, device.name)}
                  </View>

                  {/* Middle Device Info */}
                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceNameText, { color: colors.textPrimary }]} numberOfLines={1}>
                      {device.name}
                    </Text>
                    <View style={styles.signalRow}>
                      <Wifi size={13} color={colors.secondary} style={{ marginRight: 5 }} />
                      <Text style={[styles.signalText, { color: colors.textSecondary }]}>
                        Strong signal • {device.ip}
                      </Text>
                    </View>
                  </View>

                  {/* Right Arrow Icon */}
                  <View style={styles.arrowContainer}>
                    <ArrowRight size={20} color={colors.textSecondary} strokeWidth={2} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Footer Guidance Note */}
        <View style={styles.footerNote}>
          <View style={[styles.footerIconCircle, { borderColor: `${colors.textSecondary}33` }]}>
            <Radio size={24} color={colors.textSecondary} strokeWidth={1.8} />
          </View>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Make sure the other device has ShareBear open and Nearby Share enabled.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 4,
  },
  headerButton: {
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  radarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 300,
    position: 'relative',
    marginVertical: 10,
  },
  staticRing: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
  },
  staticRingOuter: {
    width: 280,
    height: 280,
  },
  staticRingInner: {
    width: 190,
    height: 190,
  },
  radarWave: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
  },
  centerDeviceBadge: {
    width: 100,
    height: 68,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    zIndex: 3,
  },
  centerDeviceScreen: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  centerDeviceIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  centerDeviceSub: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusPill: {
    position: 'absolute',
    bottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    zIndex: 4,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusPillText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  sectionContainer: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  deviceIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceNameText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalText: {
    fontSize: 13,
    fontWeight: '500',
  },
  arrowContainer: {
    paddingLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyCardSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  footerNote: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 12,
  },
  footerIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  footerText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    fontWeight: '500',
  },
});
