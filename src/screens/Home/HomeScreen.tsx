import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Platform as RNPlatform,
  TextInput,
  Image as RNImage,
} from 'react-native';
import { useDeviceStore, Device } from '../../store/deviceStore';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import {
  startDiscovery,
  stopDiscovery,
} from '../../features/discovery/discoveryManager';
import { RadarAnimation } from '../../components/RadarAnimation';
import { FilePickerModal } from '../../components/FilePickerModal';
import { DeviceProfileModal } from '../../components/DeviceProfileModal';
import { startOutgoingTransfer } from '../../features/transfer/TransferManager';
import { requestMediaPermissions } from '../../native/MediaModule';
import { getAvatarImage } from '../../utils/avatars';
import { AvatarImage, getAvatarContainerRadius } from '../../components/AvatarImage';
import DocumentPicker from 'react-native-document-picker';
import { NativeNetworkModule } from '../../native/NetworkModule';
import { useTransferStore } from '../../store/transferStore';
import { getFreeDiskStorage, getTotalDiskCapacity, getBatteryLevel } from 'react-native-device-info';
import { useTheme } from '../../theme';
import {
  Menu,
  Bell,
  ArrowUp,
  ArrowDown,
  QrCode,
  Smartphone,
  Image,
  Video,
  FileText,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  Wifi,
} from 'lucide-react-native';

const formatSize = (bytes: number): string => {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (mime: string, name: string): 'Image' | 'Video' | 'FileText' => {
  const lowercaseName = name.toLowerCase();
  if (
    mime.startsWith('image/') ||
    lowercaseName.endsWith('.png') ||
    lowercaseName.endsWith('.jpg') ||
    lowercaseName.endsWith('.jpeg') ||
    lowercaseName.endsWith('.webp') ||
    lowercaseName.endsWith('.gif')
  ) {
    return 'Image';
  } else if (
    mime.startsWith('video/') ||
    lowercaseName.endsWith('.mp4') ||
    lowercaseName.endsWith('.mkv') ||
    lowercaseName.endsWith('.avi') ||
    lowercaseName.endsWith('.mov')
  ) {
    return 'Video';
  } else {
    return 'FileText';
  }
};

export function HomeScreen() {
  const { devices } = useDeviceStore();
  const { isDiscoveryActive } = useUiStore();
  const { deviceName, deviceId, mascotSymbol } = useSettingsStore();
  const { colors, isDarkMode } = useTheme();

  const deviceList = Object.values(devices);

  // Profile modal state
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  // API inspection state
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<string>('/info');

  // Outgoing transfer request state
  const [outgoingLoading, setOutgoingLoading] = useState(false);
  const [outgoingStatus, setOutgoingStatus] = useState<string | null>(null);
  const [filePickerVisible, setFilePickerVisible] = useState(false);
  const [selectedTargetDevice, setSelectedTargetDevice] = useState<Device | null>(null);

  // Manual connect state
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualIp, setManualIp] = useState('');
  const [manualPort, setManualPort] = useState('53317');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Local IP address & Wi-Fi state
  const [localIp, setLocalIp] = useState<string>('');
  const [wifiName, setWifiName] = useState<string>('Wi-Fi');

  // Storage & Battery metric states
  const [freeStorageText, setFreeStorageText] = useState<string>('Calculating...');
  const [freeStorageGB, setFreeStorageGB] = useState<string>('12 GB Free');
  const [freeStorageNumGB, setFreeStorageNumGB] = useState<number>(12);
  const [batteryText, setBatteryText] = useState<string>('100%');
  const [batteryPct, setBatteryPct] = useState<number>(100);
  const [storageRatio, setStorageRatio] = useState<number>(0.75);

  const { transfers } = useTransferStore();
  const transferHistoryList = Object.values(transfers)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  // Fetch local IP address, Wi-Fi name, and storage metrics on mount
  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        const ip = await NativeNetworkModule.getLocalIpAddress();
        setLocalIp(ip);
      } catch (err) {
        console.error('[HomeScreen] Failed to get local IP:', err);
        setLocalIp('Unknown');
      }
      try {
        const wifi = await NativeNetworkModule.getWifiName();
        if (wifi) setWifiName(wifi);
      } catch (err) {
        console.error('[HomeScreen] Failed to get Wi-Fi name:', err);
      }
    };
    
    const fetchStorageAndBattery = async () => {
      try {
        const freeBytes = await getFreeDiskStorage();
        const totalBytes = await getTotalDiskCapacity();

        const freeGBNum = freeBytes / (1024 * 1024 * 1024);
        const freeGB = freeGBNum.toFixed(0);
        const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(1);
        setFreeStorageNumGB(freeGBNum);
        setFreeStorageText(`${freeGB} GB / ${totalGB} GB`);
        setFreeStorageGB(`${freeGB} GB Free`);
        
        const usedBytes = totalBytes - freeBytes;
        const ratio = totalBytes > 0 ? usedBytes / totalBytes : 0.75;
        setStorageRatio(ratio);
      } catch (err) {
        console.error('[HomeScreen] Failed to fetch disk storage:', err);
        setFreeStorageText('Unknown Storage');
      }

      try {
        const battery = await getBatteryLevel();
        if (battery >= 0) {
          const pct = Math.round(battery * 100);
          setBatteryPct(pct);
          setBatteryText(`${pct}%`);
        }
      } catch (err) {
        console.log('[HomeScreen] Failed to get battery level:', err);
      }
    };

    fetchNetworkInfo();
    fetchStorageAndBattery();

    const timer = setTimeout(fetchNetworkInfo, 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleToggleDiscovery = async () => {
    if (isDiscoveryActive) {
      await stopDiscovery();
    } else {
      await startDiscovery();
    }
  };

  const handleManualConnect = async () => {
    if (!manualIp.trim()) {
      setManualError('Please enter a valid IP address.');
      return;
    }
    
    const portNumber = parseInt(manualPort, 10);
    if (isNaN(portNumber) || portNumber <= 0 || portNumber > 65535) {
      setManualError('Please enter a valid Port number (1-65535).');
      return;
    }

    setManualLoading(true);
    setManualError(null);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = `http://${manualIp.trim()}:${portNumber}/info`;
      console.log(`[ManualConnect] Fetching: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      const { addOrUpdateDevice } = useDeviceStore.getState();
      addOrUpdateDevice({
        id: data.deviceId || 'MANUAL-' + Date.now(),
        name: data.deviceName || 'Manual Peer',
        ip: manualIp.trim(),
        port: portNumber,
        platform: data.platform || 'android',
        lastSeen: Date.now(),
        isOnline: true,
      });

      setManualModalVisible(false);
      setManualIp('');
      setManualError(null);
    } catch (err: any) {
      console.error('[ManualConnect] failed:', err);
      if (err.name === 'AbortError') {
        setManualError('Connection timed out. Check IP/Port & network.');
      } else {
        setManualError(err.message || 'Failed to connect. Check IP/Port & network.');
      }
    } finally {
      setManualLoading(false);
    }
  };

  const handleSendRequest = async (device: Device) => {
    await requestMediaPermissions();
    setSelectedTargetDevice(device);
    setFilePickerVisible(true);
  };

  const handleFilesSelected = async (files: { id: string; name: string; size: number; mime: string; uri?: string }[]) => {
    if (!selectedTargetDevice || files.length === 0) return;
    const device = selectedTargetDevice;

    try {
      // 1. Open loading indicator modal
      setOutgoingLoading(true);
      setOutgoingStatus(`Requesting handshake with ${device.name}...`);

      // 2. Initiate the handshake request over local network
      const transferId = await startOutgoingTransfer(
        device.ip,
        device.port,
        files,
        device.name,
      );
      setOutgoingStatus(`Handshake Accepted!\nID: ${transferId}`);

      // Auto-dismiss notification after 3s
      setTimeout(() => {
        setOutgoingLoading(false);
        setOutgoingStatus(null);
      }, 3000);
    } catch (err: any) {
      console.error('[HomeScreen] Outgoing transfer request failed:', err);
      setOutgoingStatus(
        `Handshake Declined:\n${err.message || 'Peer rejected request'}`,
      );

      setTimeout(() => {
        setOutgoingLoading(false);
        setOutgoingStatus(null);
      }, 3500);
    }
  };

  const fetchEndpoint = async (device: Device, path: string) => {
    setApiLoading(true);
    setApiResponse(null);
    setApiError(null);
    setActiveEndpoint(path);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000); // 4-second timeout

      const url = `http://${device.ip}:${device.port}${path}`;
      console.log(`[HomeScreen] Fetching: ${url}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(
          `HTTP Error ${response.status}: ${response.statusText}`,
        );
      }

      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error('[HomeScreen] Fetch failed:', err);
      if (err.name === 'AbortError') {
        setApiError('Connection timed out (4s)');
      } else {
        setApiError(err.message || 'Failed to connect to device API');
      }
    } finally {
      setApiLoading(false);
    }
  };

  // Automatically load /info when a device is selected
  useEffect(() => {
    if (selectedDevice) {
      fetchEndpoint(selectedDevice, '/info');
    } else {
      setApiResponse(null);
      setApiError(null);
      setApiLoading(false);
    }
  }, [selectedDevice]);

  const getPlatformIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'android':
        return '🤖';
      case 'ios':
      case 'macos':
        return '🍎';
      case 'windows':
        return '💻';
      case 'linux':
        return '🐧';
      default:
        return '📱';
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'android':
        return '#10B981'; // Emerald
      case 'ios':
      case 'macos':
        return '#3B82F6'; // Blue
      case 'windows':
        return '#0EA5E9'; // Sky
      case 'linux':
        return '#F59E0B'; // Amber
      default:
        return '#64748B'; // Slate
    }
  };

  // Dynamic Storage Bar Color & Value
  // Condition: < 5 GB left => Red shade, < 20 GB left => Orange shade, >= 20 GB => Normal shade
  const storagePct = Math.round(storageRatio * 100);
  const isStorageCritical = freeStorageNumGB < 5;
  const isStorageWarn = freeStorageNumGB >= 5 && freeStorageNumGB < 20;
  const storageBarColor = isStorageCritical
    ? (isDarkMode ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.28)')
    : isStorageWarn
    ? (isDarkMode ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.28)')
    : (isDarkMode ? 'rgba(226, 215, 214, 0.32)' : '#E2D7D6');
  const storageTextColor = isStorageCritical ? '#EF4444' : isStorageWarn ? '#F59E0B' : (isDarkMode ? colors.textPrimary : '#3B3B52');

  // Dynamic Battery Bar Color & Value
  // Condition: < 20% => Red shade, 20% to 50% => Orange shade, > 50% => Normal shade
  const isBatteryCritical = batteryPct < 20;
  const isBatteryWarn = batteryPct >= 20 && batteryPct <= 50;
  const batteryBarColor = isBatteryCritical
    ? (isDarkMode ? 'rgba(239, 68, 68, 0.45)' : 'rgba(239, 68, 68, 0.28)')
    : isBatteryWarn
    ? (isDarkMode ? 'rgba(245, 158, 11, 0.45)' : 'rgba(245, 158, 11, 0.28)')
    : (isDarkMode ? 'rgba(216, 222, 233, 0.35)' : '#D8DEE9');
  const batteryTextColor = isBatteryCritical ? '#EF4444' : isBatteryWarn ? '#F59E0B' : (isDarkMode ? colors.textPrimary : '#1E293B');

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
                borderWidth:0
              },
            ]}
          >
            <AvatarImage id={mascotSymbol} size={30} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Static Top Content */}
      <View style={styles.staticContent}>
        {/* Device Hero Info Card */}
        <View
          style={[
            styles.deviceInfoCard,
            {
              backgroundColor: colors.cardBg,
              borderColor: colors.cardBorder,
            },
          ]}
        >
          {/* Top Row: Icon Badge, Device Name & Status, 3-dots */}
          <View style={styles.deviceCardTop}>
            <View
              style={[
                styles.deviceIconSquircle,
                {
                  backgroundColor: colors.primaryContainer,
                  borderColor: `${colors.primary}33`,
                },
              ]}
            >
              <Smartphone size={24} color={colors.primary} strokeWidth={2.2} />
            </View>

            <View style={styles.heroDeviceDetails}>
              <Text style={[styles.deviceTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {deviceName || 'Pixel 8 Pro'}
              </Text>
              <View style={styles.heroSubRow}>
                <Wifi size={13} color={colors.secondary} style={{ marginRight: 5 }} />
                <Text style={[styles.deviceSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                  {wifiName || 'Wi-Fi'} • {RNPlatform.OS === 'android' ? `Android ${RNPlatform.Version}` : `iOS ${RNPlatform.Version}`}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.moreCircleBtn,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.cardBorder,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => setProfileModalVisible(true)}
            >
              <MoreVertical size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Bottom Row: Storage, Battery & IP Metric Boxes */}
          <View style={styles.metricsRow}>
            {/* Storage Box with Condition Fill Bar */}
            <View
              style={[
                styles.metricBox,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: isStorageCritical
                    ? 'rgba(239, 68, 68, 0.45)'
                    : isStorageWarn
                    ? 'rgba(245, 158, 11, 0.45)'
                    : colors.cardBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.metricFillBar,
                  {
                    width: `${Math.min(Math.max(storagePct, 0), 100)}%`,
                    backgroundColor: storageBarColor,
                  },
                ]}
              />
              <View style={styles.metricContent}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Storage</Text>
                <Text style={[styles.metricValue, { color: storageTextColor }]}>{freeStorageGB}</Text>
              </View>
            </View>

            {/* Battery Box with Condition Fill Bar */}
            <View
              style={[
                styles.metricBox,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: isBatteryCritical
                    ? 'rgba(239, 68, 68, 0.45)'
                    : isBatteryWarn
                    ? 'rgba(245, 158, 11, 0.45)'
                    : colors.cardBorder,
                },
              ]}
            >
              <View
                style={[
                  styles.metricFillBar,
                  {
                    width: `${Math.min(Math.max(batteryPct, 0), 100)}%`,
                    backgroundColor: batteryBarColor,
                  },
                ]}
              />
              <View style={styles.metricContent}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Battery</Text>
                <Text style={[styles.metricValue, { color: batteryTextColor }]}>{batteryText}</Text>
              </View>
            </View>

            {/* IP Address Box */}
            <View
              style={[
                styles.metricBox,
                {
                  backgroundColor: colors.surfaceElevated,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <View style={styles.metricContent}>
                <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>IP Address</Text>
                <Text
                  style={[
                    styles.metricValue,
                    { color: isDarkMode ? colors.textPrimary : '#334155', fontSize: 13.5 },
                  ]}
                  numberOfLines={1}
                >
                  {localIp || '127.0.0.1'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Discovery & Nearby Devices Section */}
        {(isDiscoveryActive || deviceList.length > 0) && (
          <View
            style={[
              styles.discoverySection,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Nearby Devices ({deviceList.length})
              </Text>
            </View>
            
            {isDiscoveryActive && deviceList.length === 0 && (
              <View style={styles.radarContainer}>
                <RadarAnimation active={isDiscoveryActive} />
                <Text style={[styles.scanningText, { color: colors.textSecondary }]}>Scanning for nearby ShareBear devices...</Text>
              </View>
            )}

            {deviceList.map(device => (
              <View
                key={device.id}
                style={[
                  styles.deviceCard,
                  {
                    backgroundColor: colors.surfaceVariant,
                    borderColor: colors.outlineVariant,
                  },
                ]}
              >
                <View
                  style={[
                    styles.platformIndicator,
                    { backgroundColor: getPlatformColor(device.platform) },
                  ]}
                >
                  <Text style={styles.platformIcon}>
                    {getPlatformIcon(device.platform)}
                  </Text>
                </View>

                <View style={styles.deviceInfo}>
                  <Text style={[styles.deviceCardName, { color: colors.textPrimary }]}>{device.name}</Text>
                  <Text style={[styles.deviceDetails, { color: colors.textSecondary }]}>
                    IP: {device.ip}:{device.port} • {wifiName || 'Wi-Fi'}
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={[
                      styles.inspectBtn,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.outline,
                      },
                    ]}
                    onPress={() => setSelectedDevice(device)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.inspectBtnText, { color: colors.textSecondary }]}>Inspect</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.sendBtn, { backgroundColor: colors.primary }]}
                    onPress={() => handleSendRequest(device)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.sendBtnText, { color: colors.onPrimary }]}>Send Req</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Recent Activity Section */}
      <View style={styles.activitySection}>
        <Text style={[styles.activitySectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
        
        {transferHistoryList.length === 0 ? (
          <View
            style={[
              styles.emptyActivityContainer,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Text style={[styles.emptyActivityText, { color: colors.textSecondary }]}>No recent transfer activity</Text>
          </View>
        ) : (
          <ScrollView
            style={styles.activityScrollView}
            contentContainerStyle={styles.activityScrollContent}
            showsVerticalScrollIndicator={false}
          >
            {transferHistoryList.map(item => {
              const isSent = item.senderId === deviceId;
              const fileName = item.files[0]?.name || 'unnamed_file';
              const fileMime = item.files[0]?.mime || '';
              const formattedSize = formatSize(item.totalBytes);
              
              const isCompleted = item.status === 'COMPLETED';
              const isFailed = item.status === 'FAILED' || item.status === 'REJECTED';
              
              const iconType = getFileIcon(fileMime, fileName);
              
              let statusText = '';
              if (isSent) {
                statusText = `Sent • ${formattedSize}`;
              } else {
                statusText = `Received from ${item.senderName} • ${formattedSize}`;
              }

              return (
                <View
                  key={item.transferId}
                  style={[
                    styles.activityItem,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  <View style={[styles.activityIconCircle, { backgroundColor: colors.surfaceVariant, borderColor: colors.cardBorder, borderWidth: 1 }]}>
                    {iconType === 'Image' && <Image size={20} color={colors.textSecondary} />}
                    {iconType === 'Video' && <Video size={20} color={colors.textSecondary} />}
                    {iconType === 'FileText' && <FileText size={20} color={colors.textSecondary} />}
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={[styles.activityFileName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {fileName}
                    </Text>
                    <Text style={[styles.activityMeta, { color: colors.textSecondary }]}>{statusText}</Text>
                  </View>
                  {isCompleted && <CheckCircle2 size={20} color={colors.secondary} />}
                  {isFailed && <AlertCircle size={20} color={colors.error} />}
                  {!isCompleted && !isFailed && (
                    <ActivityIndicator size="small" color={colors.secondary} style={{ marginLeft: 8 }} />
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* API Inspection Modal */}
      {selectedDevice && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={selectedDevice !== null}
          onRequestClose={() => setSelectedDevice(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>{selectedDevice.name}</Text>
                  <Text style={styles.modalSubtitle}>
                    http://{selectedDevice.ip}:{selectedDevice.port}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setSelectedDevice(null)}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.endpointsContainer}>
                {['/info', '/ping', '/health', '/capabilities'].map(path => (
                  <TouchableOpacity
                    key={path}
                    style={[
                      styles.endpointTab,
                      activeEndpoint === path && styles.endpointTabActive,
                    ]}
                    onPress={() => fetchEndpoint(selectedDevice, path)}
                  >
                    <Text
                      style={[
                        styles.endpointTabText,
                        activeEndpoint === path && styles.endpointTabTextActive,
                      ]}
                    >
                      {path}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.responseContainer}>
                <View style={styles.responseHeaderRow}>
                  <Text style={styles.responseHeaderLabel}>Response Body</Text>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={() =>
                      fetchEndpoint(selectedDevice, activeEndpoint)
                    }
                    disabled={apiLoading}
                  >
                    <Text style={styles.refreshButtonText}>🔄 Retry</Text>
                  </TouchableOpacity>
                </View>

                {apiLoading ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>
                      Calling peer endpoint...
                    </Text>
                  </View>
                ) : apiError ? (
                  <ScrollView style={styles.errorScroll}>
                    <Text style={styles.errorTextTitle}>
                      ⚠️ Connection Error
                    </Text>
                    <Text style={styles.errorTextDesc}>{apiError}</Text>
                  </ScrollView>
                ) : (
                  <ScrollView style={styles.jsonScroll}>
                    <Text style={styles.jsonText}>{apiResponse || '{}'}</Text>
                  </ScrollView>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Outgoing Handshake Status Modal Dialog */}
      <Modal transparent={true} visible={outgoingLoading} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.statusDialogCard}>
            <Text style={styles.statusDialogHeader}>Outgoing Handshake</Text>
            {outgoingStatus && outgoingStatus.includes('Accepted') ? (
              <Text style={styles.statusIcon}>✅</Text>
            ) : outgoingStatus && outgoingStatus.includes('Declined') ? (
              <Text style={styles.statusIcon}>❌</Text>
            ) : (
              <ActivityIndicator
                size="large"
                color="#3B82F6"
                style={{ marginVertical: 16 }}
              />
            )}
            <Text style={styles.statusDialogMessage}>{outgoingStatus}</Text>
          </View>
        </View>
      </Modal>

    {/* Manual Connect Modal Dialog */}
    <Modal
      animationType="slide"
      transparent={true}
      visible={manualModalVisible}
      onRequestClose={() => setManualModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitle}>Connect Manually</Text>
              <Text style={styles.modalSubtitle}>Enter peer LAN IP and Port</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setManualModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>IP Address</Text>
            <TextInput
              style={styles.textInput}
              value={manualIp}
              onChangeText={setManualIp}
              placeholder="e.g. 192.168.1.5 or 10.0.2.2"
              placeholderTextColor="#475569"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <Text style={[styles.inputLabel, { marginTop: 16 }]}>Port</Text>
            <TextInput
              style={styles.textInput}
              value={manualPort}
              onChangeText={setManualPort}
              placeholder="53317"
              placeholderTextColor="#475569"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          {manualError && (
            <View style={styles.manualErrorContainer}>
              <Text style={styles.manualErrorText}>{manualError}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.actionButton, styles.connectButton, manualLoading && styles.connectButtonDisabled]}
            onPress={handleManualConnect}
            disabled={manualLoading}
          >
            {manualLoading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.actionButtonText}>Connect Device</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>

      {/* File Selection Picker Modal */}
      <FilePickerModal
        visible={filePickerVisible}
        onClose={() => setFilePickerVisible(false)}
        onSend={handleFilesSelected}
        targetDeviceName={selectedTargetDevice?.name}
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
  staticContent: {
    paddingHorizontal: 20,
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
  },
  headerProfileImage: {
    width: 32,
    height: 32,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  deviceInfoCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  deviceCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  deviceIconSquircle: {
    width: 48,
    height: 48,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  heroDeviceDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  deviceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  heroSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceSubtitle: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  moreCircleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricBox: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.2,
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
  },
  metricFillBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
  },
  metricContent: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'center',
    zIndex: 2,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14.5,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  activitySection: {
    flex: 1,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  activitySectionTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  activityScrollView: {
    flex: 1,
  },
  activityScrollContent: {
    paddingBottom: 110,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0A1B28',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(63, 73, 83, 0.1)',
  },
  activityIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#142E44',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityFileName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 3,
  },
  activityMeta: {
    color: '#BEC8C9',
    fontSize: 12,
  },
  discoverySection: {
    marginBottom: 24,
    backgroundColor: '#0D2132',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(203, 182, 146, 0.1)',
  },
  sectionHeader: {
    marginBottom: 12,
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  scanningText: {
    color: '#BEC8C9',
    fontSize: 13,
    marginTop: 12,
  },
  emptyActivityContainer: {
    backgroundColor: '#0D2132',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(63, 73, 83, 0.1)',
  },
  emptyActivityText: {
    color: '#BEC8C9',
    fontSize: 14,
    textAlign: 'center',
  },
  headerCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#3B82F6',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  deviceId: {
    fontSize: 11,
    color: '#64748B',
    fontFamily: RNPlatform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  badge: {
    backgroundColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
  },
  radarSection: {
    alignItems: 'center',
    marginVertical: 12,
  },
  radarStatus: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 12,
    fontWeight: '500',
  },
  listContainer: {
    flex: 1,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
  },
  deviceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  platformIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  platformIcon: {
    fontSize: 20,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceCardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 2,
  },
  deviceDetails: {
    fontSize: 12,
    color: '#64748B',
  },
  cardActions: {
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 6,
    marginLeft: 8,
  },
  inspectBtn: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 0.5,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    alignItems: 'center',
  },
  inspectBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  sendBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    alignItems: 'center',
  },
  sendBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 16,
    flexDirection: 'row',
  },
  actionButton: {
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  actionButtonActive: {
    backgroundColor: '#F43F5E',
    shadowColor: '#F43F5E',
  },
  actionButtonInactive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  manualButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  inputContainer: {
    width: '100%',
    marginVertical: 16,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#94A3B8',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    color: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  manualErrorContainer: {
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    borderRadius: 10,
    padding: 12,
    width: '100%',
    marginBottom: 16,
  },
  manualErrorText: {
    color: '#F43F5E',
    fontSize: 13,
    textAlign: 'center',
  },
  connectButton: {
    backgroundColor: '#3B82F6',
    width: '100%',
    marginTop: 8,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxHeight: '80%',
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 4,
    fontFamily: RNPlatform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: 'bold',
  },
  endpointsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  endpointTab: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    width: '48%',
    alignItems: 'center',
  },
  endpointTabActive: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  endpointTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: 'bold',
    fontFamily: RNPlatform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  endpointTabTextActive: {
    color: '#FFFFFF',
  },
  responseContainer: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    height: 240,
    borderWidth: 1,
    borderColor: '#334155',
  },
  responseHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    paddingBottom: 8,
    marginBottom: 10,
  },
  responseHeaderLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  refreshButton: {
    backgroundColor: '#1E293B',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  refreshButtonText: {
    fontSize: 10,
    color: '#E2E8F0',
    fontWeight: 'bold',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 10,
  },
  errorScroll: {
    flex: 1,
  },
  errorTextTitle: {
    fontSize: 14,
    color: '#F43F5E',
    fontWeight: 'bold',
    marginBottom: 6,
  },
  errorTextDesc: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
  },
  jsonScroll: {
    flex: 1,
  },
  jsonText: {
    fontSize: 12,
    fontFamily: RNPlatform.OS === 'ios' ? 'Courier New' : 'monospace',
    color: '#10B981',
  },

  // Outgoing Handshake Status Card Styles
  statusDialogCard: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 24,
    width: '80%',
    maxWidth: 300,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
  },
  statusDialogHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  statusIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  statusDialogMessage: {
    fontSize: 14,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
});
