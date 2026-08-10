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
  TextInput,
  Modal,
  Image as RNImage,
  ActivityIndicator,
} from 'react-native';
import { useDeviceStore, Device } from '../../store/deviceStore';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import {
  startDiscovery,
  stopDiscovery,
} from '../../features/discovery/discoveryManager';
import { startOutgoingTransfer } from '../../features/transfer/TransferManager';
import { FilePickerModal } from '../../components/FilePickerModal';
import { DeviceProfileModal } from '../../components/DeviceProfileModal';
import { getSystemClipboardText } from '../../utils/clipboard';
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
  Radio,
  FileText,
  Folder,
  AlignLeft,
  Clipboard,
  RefreshCw,
  Heart,
  Settings,
  X,
  Send,
  Plus,
  Paperclip,
  Trash2,
  Video as VideoIcon,
  Image as ImageIcon,
} from 'lucide-react-native';

export interface SelectedFileItem {
  id: string;
  name: string;
  size: number;
  mime: string;
  uri?: string;
  type?: 'photo' | 'video' | 'doc' | 'music';
}

export function NearbyScreen() {
  const { devices } = useDeviceStore();
  const { isDiscoveryActive } = useUiStore();
  const { deviceName, mascotSymbol } = useSettingsStore();
  const { colors } = useTheme();

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [filePickerVisible, setFilePickerVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [addDrawerVisible, setAddDrawerVisible] = useState(false);
  const [selectedTargetDevice, setSelectedTargetDevice] = useState<Device | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<SelectedFileItem[]>([]);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Quick text send modal state
  const [textModalVisible, setTextModalVisible] = useState(false);
  const [textMessage, setTextMessage] = useState('');

  const deviceList = Object.values(devices);

  // Concentric radar wave animations
  const wave1 = useRef(new Animated.Value(0)).current;
  const wave2 = useRef(new Animated.Value(0)).current;
  const wave3 = useRef(new Animated.Value(0)).current;
  const pulseDot = useRef(new Animated.Value(0.4)).current;
  const refreshSpin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Auto-start discovery when navigating to Nearby screen if inactive
    if (!isDiscoveryActive) {
      startDiscovery().catch((err) => console.warn('[NearbyScreen] Start discovery error:', err));
    }
  }, []);

  useEffect(() => {
    if (isDiscoveryActive && deviceList.length === 0) {
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
  }, [isDiscoveryActive, deviceList.length]);

  const handleToggleDiscovery = async () => {
    if (isDiscoveryActive) {
      await stopDiscovery();
    } else {
      await startDiscovery();
    }
  };

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);

    Animated.timing(refreshSpin, {
      toValue: 1,
      duration: 700,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      refreshSpin.setValue(0);
    });

    try {
      await stopDiscovery();
      await startDiscovery();
    } catch (err) {
      console.warn('[NearbyScreen] Refresh error:', err);
    } finally {
      setTimeout(() => {
        setIsRefreshing(false);
      }, 500);
    }
  };

  const toggleFavorite = (deviceId: string) => {
    setFavorites((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  const handleDevicePress = async (device: Device) => {
    if (selectedFiles.length > 0) {
      // Direct send current selection
      try {
        await startOutgoingTransfer(device.ip, device.port, selectedFiles);
      } catch (err) {
        console.error('[NearbyScreen] Transfer error:', err);
      }
    } else {
      setSelectedTargetDevice(device);
      setFilePickerVisible(true);
    }
  };

  const handleActionCardPress = async (action: 'file' | 'folder' | 'text' | 'paste') => {
    if (action === 'file') {
      setFilePickerVisible(true);
    } else if (action === 'folder') {
      try {
        const result = await DocumentPicker.pick({
          allowMultiSelection: true,
          type: [DocumentPicker.types.allFiles],
        });
        if (result && result.length > 0) {
          const filesToAdd: SelectedFileItem[] = result.map((file, idx) => ({
            id: `file-${Date.now()}-${idx}`,
            name: file.name || 'folder_item',
            size: file.size || 0,
            mime: file.type || 'application/octet-stream',
            uri: file.uri,
          }));
          setSelectedFiles((prev) => [...prev, ...filesToAdd]);
        }
      } catch (err) {
        if (!DocumentPicker.isCancel(err)) {
          console.error('[NearbyScreen] Folder pick error:', err);
        }
      }
    } else if (action === 'paste') {
      try {
        const clipText = await getSystemClipboardText();
        if (clipText && clipText.trim().length > 0) {
          const textFile: SelectedFileItem = {
            id: `paste-${Date.now()}`,
            name: `clipboard_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.txt`,
            size: clipText.length,
            mime: 'text/plain',
            type: 'doc',
          };
          setSelectedFiles((prev) => [...prev, textFile]);
        } else {
          // If clipboard is empty, open text modal
          setTextModalVisible(true);
        }
      } catch (err) {
        console.warn('[NearbyScreen] Paste error:', err);
        setTextModalVisible(true);
      }
    } else if (action === 'text') {
      setTextModalVisible(true);
    }
  };

  const handleSendText = () => {
    if (!textMessage.trim()) return;
    const textFile: SelectedFileItem = {
      id: `text-${Date.now()}`,
      name: `message_${new Date().toISOString().slice(11, 19).replace(/:/g, '-')}.txt`,
      size: textMessage.length,
      mime: 'text/plain',
    };
    setSelectedFiles((prev) => [...prev, textFile]);
    setTextModalVisible(false);
    setTextMessage('');
  };

  const handleRemoveItem = (id: string) => {
    setSelectedFiles((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      if (updated.length === 0) {
        setEditModalVisible(false);
      }
      return updated;
    });
  };

  const handleClearAllSelected = () => {
    setSelectedFiles([]);
    setEditModalVisible(false);
  };

  const handleFilesSelected = (
    files: { id: string; name: string; size: number; mime: string; uri?: string }[]
  ) => {
    // Append newly picked files to the selection batch
    setSelectedFiles((prev) => [...prev, ...(files as SelectedFileItem[])]);
    if (selectedTargetDevice) {
      startOutgoingTransfer(selectedTargetDevice.ip, selectedTargetDevice.port, files).catch(
        (err) => console.error('[NearbyScreen] Transfer error:', err)
      );
    }
  };

  const totalSelectedSize = selectedFiles.reduce((acc, f) => acc + (f.size || 0), 0);

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 KB';
    if (bytes >= 1024 * 1024 * 1024) {
      return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
    }
    if (bytes >= 1024 * 1024) {
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  const getDeviceIcon = (platform: string, name: string) => {
    const p = platform.toLowerCase();
    const n = name.toLowerCase();

    if (p === 'macos' || n.includes('macbook') || n.includes('laptop') || p === 'windows' || p === 'linux') {
      return <Laptop size={28} color={colors.textPrimary} strokeWidth={1.8} />;
    }
    if (n.includes('ipad') || n.includes('tablet')) {
      return <Tablet size={28} color={colors.textPrimary} strokeWidth={1.8} />;
    }
    if (n.includes('tv') || n.includes('desktop')) {
      return <Monitor size={28} color={colors.textPrimary} strokeWidth={1.8} />;
    }
    return <Smartphone size={28} color={colors.textPrimary} strokeWidth={1.8} />;
  };

  const getPlatformLabel = (platform: string, name: string) => {
    const p = platform.toLowerCase();
    const n = name.toLowerCase();
    if (p === 'linux' || n.includes('linux') || n.includes('buntu')) return 'Linux';
    if (p === 'macos' || n.includes('mac') || n.includes('mbp')) return 'macOS';
    if (p === 'ios' || n.includes('iphone') || n.includes('ipad')) return 'iPhone';
    if (p === 'windows' || n.includes('windows') || n.includes('pc')) return 'Windows';
    return 'Android';
  };

  const getIpTag = (ip: string) => {
    const parts = ip.split('.');
    return `#${parts[parts.length - 1] || '0'}`;
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

  const spinInterpolate = refreshSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const displayedDevices = showFavoritesOnly
    ? deviceList.filter((d) => favorites[d.id])
    : deviceList;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
          <Menu size={24} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>ShareBear</Text>
        <TouchableOpacity
          style={styles.headerButton}
          activeOpacity={0.7}
          onPress={() => setProfileModalVisible(true)}
        >
          <View
            style={[
              styles.headerProfileBadge,
              {
                backgroundColor: colors.primaryContainer,
                borderColor: `${colors.primary}44`,
              },
            ]}
          >
            <Text style={styles.headerProfileEmoji}>{mascotSymbol || '🐻'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* CONDITIONAL RENDERING: */}
        {/* 1. If NO devices found: Show Radar Animation Hero */}
        {deviceList.length === 0 ? (
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

            {/* Central Mascot Badge */}
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
                <Text style={styles.centerDeviceIcon}>{mascotSymbol || '🐻'}</Text>
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
        ) : selectedFiles.length > 0 ? (
          /* 2. If files ARE selected: Show Selection Summary Tray */
          <View
            style={[
              styles.selectionCard,
              {
                backgroundColor: colors.surfaceElevated,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Title & Stats */}
            <Text style={[styles.selectionTitle, { color: colors.textPrimary }]}>Selection</Text>
            <Text style={[styles.selectionStats, { color: colors.textSecondary }]}>
              Files: {selectedFiles.length}
            </Text>
            <Text style={[styles.selectionStats, { color: colors.textSecondary }]}>
              Size: {formatSize(totalSelectedSize)}
            </Text>

            {/* Horizontal Mini Thumbnail Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.thumbnailStrip}
            >
              {selectedFiles.map((file, idx) => {
                const isImage = (file.mime?.startsWith('image/') || file.type === 'photo') && !!file.uri;

                return (
                  <View
                    key={file.id || `sel-${idx}`}
                    style={[
                      styles.miniThumbnailBox,
                      {
                        backgroundColor: colors.primaryContainer,
                        borderColor: `${colors.primary}33`,
                      },
                    ]}
                  >
                    {isImage ? (
                      <RNImage
                        source={{ uri: file.uri }}
                        style={styles.miniThumbnailImage}
                        resizeMode="cover"
                      />
                    ) : file.mime?.startsWith('video/') ? (
                      <VideoIcon size={20} color={colors.primary} />
                    ) : file.mime === 'text/plain' ? (
                      <AlignLeft size={20} color={colors.primary} />
                    ) : (
                      <Paperclip size={18} color={colors.primary} />
                    )}
                  </View>
                );
              })}
            </ScrollView>

            {/* Bottom Actions: Edit & + Add */}
            <View style={styles.selectionActionsRow}>
              <TouchableOpacity
                style={styles.editBtn}
                activeOpacity={0.7}
                onPress={() => setEditModalVisible(true)}
              >
                <Text style={[styles.editBtnText, { color: colors.textSecondary }]}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.addMoreBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
                onPress={() => setAddDrawerVisible(true)}
              >
                <Plus size={16} color={colors.onPrimary} strokeWidth={2.5} style={{ marginRight: 4 }} />
                <Text style={[styles.addMoreBtnText, { color: colors.onPrimary }]}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* 3. If NO files selected yet: Show Quick Action Cards Row */
          <View style={styles.actionGridRow}>
            {/* File Card */}
            <TouchableOpacity
              style={[
                styles.actionItemCard,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.cardBorder,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => handleActionCardPress('file')}
            >
              <View style={styles.actionIconContainer}>
                <FileText size={32} color={colors.primary} strokeWidth={2.2} />
              </View>
              <Text style={[styles.actionItemLabel, { color: colors.textPrimary }]}>File</Text>
            </TouchableOpacity>

            {/* Folder Card */}
            <TouchableOpacity
              style={[
                styles.actionItemCard,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.cardBorder,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => handleActionCardPress('folder')}
            >
              <View style={styles.actionIconContainer}>
                <Folder size={32} color={colors.primary} strokeWidth={2.2} />
              </View>
              <Text style={[styles.actionItemLabel, { color: colors.textPrimary }]}>Folder</Text>
            </TouchableOpacity>

            {/* Text Card */}
            <TouchableOpacity
              style={[
                styles.actionItemCard,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.cardBorder,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => handleActionCardPress('text')}
            >
              <View style={styles.actionIconContainer}>
                <AlignLeft size={32} color={colors.primary} strokeWidth={2.2} />
              </View>
              <Text style={[styles.actionItemLabel, { color: colors.textPrimary }]}>Text</Text>
            </TouchableOpacity>

            {/* Paste Card */}
            <TouchableOpacity
              style={[
                styles.actionItemCard,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.cardBorder,
                },
              ]}
              activeOpacity={0.8}
              onPress={() => handleActionCardPress('paste')}
            >
              <View style={styles.actionIconContainer}>
                <Clipboard size={32} color={colors.primary} strokeWidth={2.2} />
              </View>
              <Text style={[styles.actionItemLabel, { color: colors.textPrimary }]}>Paste</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Nearby Devices Section Header Row */}
        <View style={styles.sectionHeaderBar}>
          <Text style={[styles.sectionHeading, { color: colors.textPrimary }]}>
            Nearby devices {deviceList.length > 0 && `(${deviceList.length})`}
          </Text>

          {/* Action Icons: Refresh, Scan, Favorites, Settings */}
          <View style={styles.headerActionsRow}>
            {/* Refresh Button with Spin Animation */}
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: colors.surfaceElevated }]}
              activeOpacity={0.7}
              onPress={handleRefresh}
            >
              <Animated.View style={{ transform: [{ rotate: spinInterpolate }] }}>
                <RefreshCw size={17} color={colors.textPrimary} strokeWidth={2.2} />
              </Animated.View>
            </TouchableOpacity>

            {/* Broadcast / Radar Scan Toggle */}
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: isDiscoveryActive ? colors.primaryContainer : colors.surfaceElevated,
                },
              ]}
              activeOpacity={0.7}
              onPress={handleToggleDiscovery}
            >
              <Radio
                size={17}
                color={isDiscoveryActive ? colors.primary : colors.textPrimary}
                strokeWidth={2.2}
              />
            </TouchableOpacity>

            {/* Favorites Filter Button */}
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                {
                  backgroundColor: showFavoritesOnly ? colors.primaryContainer : colors.surfaceElevated,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => setShowFavoritesOnly(!showFavoritesOnly)}
            >
              <Heart
                size={17}
                color={showFavoritesOnly ? '#EF4444' : colors.textPrimary}
                fill={showFavoritesOnly ? '#EF4444' : 'transparent'}
                strokeWidth={2.2}
              />
            </TouchableOpacity>

            {/* Settings Button */}
            <TouchableOpacity
              style={[styles.headerActionBtn, { backgroundColor: colors.surfaceElevated }]}
              activeOpacity={0.7}
            >
              <Settings size={17} color={colors.textPrimary} strokeWidth={2.2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Devices List Cards */}
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
                : 'Tap the status pill or scan button above to start scanning.'}
            </Text>
          </View>
        ) : (
          displayedDevices.map((device) => {
            const isFav = !!favorites[device.id];
            const platformLabel = getPlatformLabel(device.platform, device.name);
            const ipTag = getIpTag(device.ip);

            return (
              <TouchableOpacity
                key={device.id}
                style={[
                  styles.deviceListCard,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.cardBorder,
                  },
                ]}
                activeOpacity={0.75}
                onPress={() => handleDevicePress(device)}
              >
                {/* Left Device Icon */}
                <View style={styles.deviceIconWrapper}>
                  {getDeviceIcon(device.platform, device.name)}
                </View>

                {/* Middle Device Name & Badges */}
                <View style={styles.deviceInfoCol}>
                  <Text style={[styles.deviceNameTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                    {device.name}
                  </Text>
                  <View style={styles.badgeRow}>
                    {/* IP Last Octet Badge */}
                    <View style={[styles.tagBadge, { backgroundColor: `${colors.secondary}20` }]}>
                      <Text style={[styles.tagBadgeText, { color: colors.secondary }]}>{ipTag}</Text>
                    </View>

                    {/* Platform Badge */}
                    <View style={[styles.tagBadge, { backgroundColor: `${colors.primary}20` }]}>
                      <Text style={[styles.tagBadgeText, { color: colors.primary }]}>{platformLabel}</Text>
                    </View>
                  </View>
                </View>

                {/* Right Favorite Heart Icon */}
                <TouchableOpacity
                  style={styles.heartBtn}
                  activeOpacity={0.7}
                  onPress={() => toggleFavorite(device.id)}
                >
                  <Heart
                    size={22}
                    color={isFav ? '#EF4444' : colors.textSecondary}
                    fill={isFav ? '#EF4444' : 'transparent'}
                    strokeWidth={2}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}

        {/* Footer Guidance Note */}
        <View style={styles.footerNote}>
          <View style={[styles.footerIconCircle, { borderColor: `${colors.textSecondary}33` }]}>
            <Radio size={22} color={colors.textSecondary} strokeWidth={1.8} />
          </View>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Make sure the other device has ShareBear open and Nearby Share enabled.
          </Text>
        </View>
      </ScrollView>

      {/* Add More Content Bottom Drawer Modal */}
      <Modal
        visible={addDrawerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setAddDrawerVisible(false)}
      >
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={() => setAddDrawerVisible(false)}
        >
          <TouchableOpacity
            style={[
              styles.drawerSheet,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
            activeOpacity={1}
          >
            {/* Grab Handle */}
            <View style={[styles.drawerHandle, { backgroundColor: colors.cardBorder || '#475569' }]} />

            {/* Drawer Header */}
            <View style={styles.drawerHeader}>
              <Text style={[styles.drawerTitle, { color: colors.textPrimary }]}>Add to Selection</Text>
              <TouchableOpacity onPress={() => setAddDrawerVisible(false)} activeOpacity={0.7}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* 4 Action Cards in Drawer */}
            <View style={styles.actionGridRow}>
              {/* File Card */}
              <TouchableOpacity
                style={[
                  styles.actionItemCard,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.cardBorder,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setAddDrawerVisible(false);
                  setTimeout(() => setFilePickerVisible(true), 150);
                }}
              >
                <View style={styles.actionIconContainer}>
                  <FileText size={32} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={[styles.actionItemLabel, { color: colors.textPrimary }]}>File</Text>
              </TouchableOpacity>

              {/* Folder Card */}
              <TouchableOpacity
                style={[
                  styles.actionItemCard,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.cardBorder,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setAddDrawerVisible(false);
                  handleActionCardPress('folder');
                }}
              >
                <View style={styles.actionIconContainer}>
                  <Folder size={32} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={[styles.actionItemLabel, { color: colors.textPrimary }]}>Folder</Text>
              </TouchableOpacity>

              {/* Text Card */}
              <TouchableOpacity
                style={[
                  styles.actionItemCard,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.cardBorder,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setAddDrawerVisible(false);
                  setTextModalVisible(true);
                }}
              >
                <View style={styles.actionIconContainer}>
                  <AlignLeft size={32} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={[styles.actionItemLabel, { color: colors.textPrimary }]}>Text</Text>
              </TouchableOpacity>

              {/* Paste Card */}
              <TouchableOpacity
                style={[
                  styles.actionItemCard,
                  {
                    backgroundColor: colors.surfaceElevated,
                    borderColor: colors.cardBorder,
                  },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  setAddDrawerVisible(false);
                  handleActionCardPress('paste');
                }}
              >
                <View style={styles.actionIconContainer}>
                  <Clipboard size={32} color={colors.primary} strokeWidth={2.2} />
                </View>
                <Text style={[styles.actionItemLabel, { color: colors.textPrimary }]}>Paste</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Edit Selection Modal (Deselect / Remove Files) */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.editModalContainer,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.editModalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.editModalTitle, { color: colors.textPrimary }]}>Edit Selection</Text>
                <Text style={[styles.editModalSubtitle, { color: colors.textSecondary }]}>
                  {selectedFiles.length} {selectedFiles.length === 1 ? 'file' : 'files'} • {formatSize(totalSelectedSize)}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                {selectedFiles.length > 0 && (
                  <TouchableOpacity onPress={handleClearAllSelected} activeOpacity={0.7}>
                    <Text style={[styles.clearAllText, { color: '#EF4444' }]}>Clear All</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.closeModalBtn}
                  onPress={() => setEditModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <X size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            {/* List of Selected Files with Deselect/Remove Action */}
            <ScrollView
              style={styles.editListScroll}
              contentContainerStyle={styles.editListContent}
              showsVerticalScrollIndicator={false}
            >
              {selectedFiles.map((file, idx) => {
                const isImage = (file.mime?.startsWith('image/') || file.type === 'photo') && !!file.uri;

                return (
                  <View
                    key={file.id || `edit-${idx}`}
                    style={[
                      styles.editFileRow,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    {/* Thumbnail / Icon */}
                    <View
                      style={[
                        styles.editThumbnailBox,
                        {
                          backgroundColor: colors.primaryContainer,
                          borderColor: `${colors.primary}33`,
                        },
                      ]}
                    >
                      {isImage ? (
                        <RNImage
                          source={{ uri: file.uri }}
                          style={styles.miniThumbnailImage}
                          resizeMode="cover"
                        />
                      ) : file.mime?.startsWith('video/') ? (
                        <VideoIcon size={22} color={colors.primary} />
                      ) : file.mime === 'text/plain' ? (
                        <AlignLeft size={22} color={colors.primary} />
                      ) : (
                        <Paperclip size={20} color={colors.primary} />
                      )}
                    </View>

                    {/* File Meta Info */}
                    <View style={styles.editFileInfo}>
                      <Text style={[styles.editFileName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {file.name}
                      </Text>
                      <Text style={[styles.editFileSize, { color: colors.textSecondary }]}>
                        {formatSize(file.size)}
                      </Text>
                    </View>

                    {/* Deselect / Remove Button */}
                    <TouchableOpacity
                      style={styles.removeFileBtn}
                      activeOpacity={0.7}
                      onPress={() => handleRemoveItem(file.id)}
                    >
                      <Trash2 size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>

            {/* Done Button */}
            <TouchableOpacity
              style={[styles.doneEditBtn, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={[styles.doneEditBtnText, { color: colors.onPrimary }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Quick Text Input Modal */}
      <Modal
        visible={textModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setTextModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.textModalContainer,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.textModalHeader}>
              <Text style={[styles.textModalTitle, { color: colors.textPrimary }]}>Add Text Message</Text>
              <TouchableOpacity onPress={() => setTextModalVisible(false)}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.textInputArea,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.cardBorder,
                  color: colors.textPrimary,
                },
              ]}
              placeholder="Type or paste your text here..."
              placeholderTextColor={colors.textSecondary}
              multiline
              value={textMessage}
              onChangeText={setTextMessage}
            />

            <View style={styles.textModalActions}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.cardBorder }]}
                onPress={() => setTextModalVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.sendTextBtn,
                  {
                    backgroundColor: textMessage.trim() ? colors.primary : colors.surfaceElevated,
                  },
                ]}
                disabled={!textMessage.trim()}
                onPress={handleSendText}
              >
                <Text style={[styles.sendTextBtnText, { color: colors.onPrimary }]}>Add to Selection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* File Selection Picker Modal */}
      <FilePickerModal
        visible={filePickerVisible}
        onClose={() => setFilePickerVisible(false)}
        onSend={handleFilesSelected}
        targetDeviceName={selectedTargetDevice?.name || (deviceList[0] && deviceList[0].name)}
      />

      {/* Device Profile & Appearance Modal */}
      <DeviceProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
      />
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
    padding: 4,
    borderRadius: 8,
  },
  headerProfileBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
  },
  headerProfileEmoji: {
    fontSize: 18,
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
  selectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    marginTop: 4,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  selectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  selectionStats: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  thumbnailStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 14,
  },
  miniThumbnailBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  miniThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  selectionActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
  },
  editBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 18,
    elevation: 2,
  },
  addMoreBtnText: {
    fontSize: 13.5,
    fontWeight: 'bold',
  },
  actionGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 20,
    marginTop: 4,
  },
  actionItemCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
  },
  actionIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionItemLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    marginTop: 6,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  headerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceListCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  deviceIconWrapper: {
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deviceInfoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  deviceNameTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tagBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  heartBtn: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 290,
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
    bottom: 6,
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
  emptyCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
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
    marginTop: 20,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  drawerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  drawerSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'android' ? 28 : 40,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  drawerHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  drawerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  textModalContainer: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
  },
  textModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  textModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  textInputArea: {
    height: 120,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    fontSize: 15,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  textModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  cancelBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  sendTextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  sendTextBtnText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  editModalContainer: {
    width: '100%',
    maxHeight: '75%',
    borderRadius: 26,
    borderWidth: 1,
    padding: 20,
  },
  editModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  editModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  editModalSubtitle: {
    fontSize: 12.5,
    marginTop: 2,
    fontWeight: '500',
  },
  clearAllText: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  closeModalBtn: {
    padding: 4,
  },
  editListScroll: {
    maxHeight: 320,
  },
  editListContent: {
    gap: 10,
    paddingBottom: 10,
  },
  editFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  editThumbnailBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginRight: 12,
  },
  editFileInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  editFileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  editFileSize: {
    fontSize: 12,
  },
  removeFileBtn: {
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  doneEditBtn: {
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  doneEditBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
