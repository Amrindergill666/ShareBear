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
} from 'react-native';
import { useDeviceStore, Device } from '../../store/deviceStore';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import {
  startDiscovery,
  stopDiscovery,
} from '../../features/discovery/discoveryManager';
import { RadarAnimation } from '../../components/RadarAnimation';
import { startOutgoingTransfer } from '../../features/transfer/TransferManager';
import DocumentPicker from 'react-native-document-picker';
import { NativeNetworkModule } from '../../native/NetworkModule';
import { useTransferStore } from '../../store/transferStore';
import { getFreeDiskStorage, getTotalDiskCapacity } from 'react-native-device-info';
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
  const { deviceName, deviceId } = useSettingsStore();

  const deviceList = Object.values(devices);

  // API inspection state
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [activeEndpoint, setActiveEndpoint] = useState<string>('/info');

  // Outgoing transfer request state
  const [outgoingLoading, setOutgoingLoading] = useState(false);
  const [outgoingStatus, setOutgoingStatus] = useState<string | null>(null);

  // Manual connect state
  const [manualModalVisible, setManualModalVisible] = useState(false);
  const [manualIp, setManualIp] = useState('');
  const [manualPort, setManualPort] = useState('53317');
  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);

  // Local IP address state
  const [localIp, setLocalIp] = useState<string>('');

  // Storage metric states
  const [freeStorageText, setFreeStorageText] = useState<string>('Calculating...');
  const [storageRatio, setStorageRatio] = useState<number>(0.5);

  const { transfers } = useTransferStore();
  const transferHistoryList = Object.values(transfers)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  // Fetch local IP address and storage metrics on mount
  useEffect(() => {
    const fetchIp = async () => {
      try {
        const ip = await NativeNetworkModule.getLocalIpAddress();
        setLocalIp(ip);
      } catch (err) {
        console.error('[HomeScreen] Failed to get local IP:', err);
        setLocalIp('Unknown');
      }
    };
    
    const fetchStorage = async () => {
      try {
        const freeBytes = await getFreeDiskStorage();
        const totalBytes = await getTotalDiskCapacity();

        const freeGB = (freeBytes / (1024 * 1024 * 1024)).toFixed(1);
        const totalGB = (totalBytes / (1024 * 1024 * 1024)).toFixed(1);
        setFreeStorageText(`${freeGB} GB / ${totalGB} GB`);
        
        const usedBytes = totalBytes - freeBytes;
        const ratio = totalBytes > 0 ? usedBytes / totalBytes : 0;
        setStorageRatio(ratio);
      } catch (err) {
        console.error('[HomeScreen] Failed to fetch disk storage:', err);
        setFreeStorageText('Unknown Storage');
      }
    };

    fetchIp();
    fetchStorage();
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
    try {
      // 1. Pick a real file using DocumentPicker from device storage
      const pickedFile = await DocumentPicker.pickSingle({
        type: [DocumentPicker.types.allFiles],
      });

      // 2. Open loading indicator modal
      setOutgoingLoading(true);
      setOutgoingStatus(`Requesting handshake with ${device.name}...`);

      const realFiles = [
        {
          id: 'file-' + Date.now(),
          name: pickedFile.name || 'unnamed_file',
          size: pickedFile.size || 0,
          mime: pickedFile.type || 'application/octet-stream',
        },
      ];

      // 3. Initiate the handshake request over local network
      const transferId = await startOutgoingTransfer(
        device.ip,
        device.port,
        realFiles,
      );
      setOutgoingStatus(`Handshake Accepted!\nID: ${transferId}`);

      // Auto-dismiss notification after 3s
      setTimeout(() => {
        setOutgoingLoading(false);
        setOutgoingStatus(null);
      }, 3000);
    } catch (err: any) {
      if (DocumentPicker.isCancel(err)) {
        console.log('[HomeScreen] Outgoing transfer request cancelled by user');
        return;
      }

      console.error('[HomeScreen] Outgoing transfer request failed:', err);
      setOutgoingStatus(
        `Handshake Declined:\n${err.message || 'Peer rejected request'}`,
      );

      setTimeout(() => {
        setOutgoingLoading(false);
        setOutgoingStatus(null);
      }, 4000);
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

  return (
    <View style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
          <Menu size={24} color="#BEC8C9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ShareBear</Text>
        <TouchableOpacity style={styles.headerButton} activeOpacity={0.7}>
          <Bell size={24} color="#BEC8C9" />
        </TouchableOpacity>
      </View>

      {/* Static Top Content */}
      <View style={styles.staticContent}>
        {/* Action Cards Row */}
        <View style={styles.actionCardsRow}>
          <TouchableOpacity
            style={[
              styles.actionCard,
              isDiscoveryActive && styles.actionCardScanningActive,
            ]}
            onPress={handleToggleDiscovery}
            activeOpacity={0.8}
          >
            <View style={styles.actionCardIconCircle}>
              {isDiscoveryActive ? (
                <ActivityIndicator size="small" color="#56472B" />
              ) : (
                <ArrowUp size={24} color="#56472B" />
              )}
            </View>
            <Text style={styles.actionCardText}>
              {isDiscoveryActive ? 'Scanning...' : 'Scan'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => {
              setManualError(null);
              setManualModalVisible(true);
            }}
            activeOpacity={0.8}
          >
            <View style={styles.actionCardIconCircle}>
              <ArrowDown size={24} color="#56472B" />
            </View>
            <Text style={styles.actionCardText}>Manual</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Scan QR Bar */}
        <TouchableOpacity style={styles.qrBar} activeOpacity={0.8}>
          <View style={styles.qrBarLeft}>
            <QrCode size={20} color="#CBB692" style={{ marginRight: 12 }} />
            <Text style={styles.qrBarText}>Quick Scan QR</Text>
          </View>
          <Text style={styles.qrBarChevron}>›</Text>
        </TouchableOpacity>

        {/* Phone Storage Card */}
        <View style={styles.storageCard}>
          <View style={styles.storageHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Smartphone size={16} color="#BEC8C9" style={{ marginRight: 6 }} />
              <Text style={styles.storageTitle}>Phone Storage</Text>
            </View>
            <Text style={styles.storageText}>{freeStorageText}</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${storageRatio * 100}%` }]} />
          </View>
        </View>

        {/* Discovery & Nearby Devices Section */}
        {(isDiscoveryActive || deviceList.length > 0) && (
          <View style={styles.discoverySection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Nearby Devices ({deviceList.length})
              </Text>
            </View>
            
            {isDiscoveryActive && deviceList.length === 0 && (
              <View style={styles.radarContainer}>
                <RadarAnimation active={isDiscoveryActive} />
                <Text style={styles.scanningText}>Scanning for nearby ShareBear devices...</Text>
              </View>
            )}

            {deviceList.map(device => (
              <View key={device.id} style={styles.deviceCard}>
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
                  <Text style={styles.deviceCardName}>{device.name}</Text>
                  <Text style={styles.deviceDetails}>
                    IP: {device.ip}:{device.port}
                  </Text>
                </View>

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.inspectBtn}
                    onPress={() => setSelectedDevice(device)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.inspectBtnText}>Inspect</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.sendBtn}
                    onPress={() => handleSendRequest(device)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sendBtnText}>Send Req</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Recent Activity Section */}
      <View style={styles.activitySection}>
        <Text style={styles.activitySectionTitle}>Recent Activity</Text>
        
        {transferHistoryList.length === 0 ? (
          <View style={styles.emptyActivityContainer}>
            <Text style={styles.emptyActivityText}>No recent transfer activity</Text>
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
                <View key={item.transferId} style={styles.activityItem}>
                  <View style={styles.activityIconCircle}>
                    {iconType === 'Image' && <Image size={20} color="#BEC8C9" />}
                    {iconType === 'Video' && <Video size={20} color="#BEC8C9" />}
                    {iconType === 'FileText' && <FileText size={20} color="#BEC8C9" />}
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityFileName} numberOfLines={1}>
                      {fileName}
                    </Text>
                    <Text style={styles.activityMeta}>{statusText}</Text>
                  </View>
                  {isCompleted && <CheckCircle2 size={20} color="#57B5B6" />}
                  {isFailed && <AlertCircle size={20} color="#F87171" />}
                  {!isCompleted && !isFailed && (
                    <ActivityIndicator size="small" color="#57B5B6" style={{ marginLeft: 8 }} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#051521',
    // paddingHorizontal: 10,
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
    padding: 6,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  actionCardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  actionCard: {
    backgroundColor: '#302619',
    width: '47%',
    height: 140,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(203, 182, 146, 0.15)',
  },
  actionCardScanningActive: {
    borderColor: '#CBB692',
    backgroundColor: '#4E3E28',
  },
  actionCardIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionCardText: {
    color: '#CBB692',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0D2132',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: 'rgba(63, 73, 83, 0.2)',
    marginBottom: 20,
  },
  qrBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qrBarText: {
    color: '#BEC8C9',
    fontSize: 15,
    fontWeight: '600',
  },
  qrBarChevron: {
    color: '#CBB692',
    fontSize: 20,
    fontWeight: 'bold',
  },
  storageCard: {
    backgroundColor: '#0D2132',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(63, 73, 83, 0.2)',
    marginBottom: 24,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  storageTitle: {
    color: '#BEC8C9',
    fontSize: 14,
    fontWeight: '600',
  },
  storageText: {
    color: '#BEC8C9',
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#57B5B6',
    borderRadius: 3,
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
