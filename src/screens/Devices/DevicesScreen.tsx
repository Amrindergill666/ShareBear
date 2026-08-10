import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { useSettingsStore } from '../../store/settingsStore';
import { useDeviceStore, Device } from '../../store/deviceStore';
import { useTheme } from '../../theme';
import { getFreeDiskStorage } from 'react-native-device-info';
import { NativeNetworkModule } from '../../native/NetworkModule';
import { startOutgoingTransfer } from '../../features/transfer/TransferManager';
import { FilePickerModal } from '../../components/FilePickerModal';
import { DeviceProfileModal } from '../../components/DeviceProfileModal';
import DocumentPicker from 'react-native-document-picker';
import {
  Menu,
  Bell,
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  MoreVertical,
  QrCode,
  Wifi,
  CheckCircle2,
  Trash2,
  Share2,
  X,
} from 'lucide-react-native';

export function DevicesScreen() {
  const { deviceName, mascotSymbol } = useSettingsStore();
  const { devices, removeDevice } = useDeviceStore();
  const { colors } = useTheme();
  const [localIp, setLocalIp] = useState('127.0.0.1');
  const [freeStorageText, setFreeStorageText] = useState('12 GB Free');
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [menuModalVisible, setMenuModalVisible] = useState(false);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [filePickerVisible, setFilePickerVisible] = useState(false);
  const [profileModalVisible, setProfileModalVisible] = useState(false);

  const deviceList = Object.values(devices);

  useEffect(() => {
    const fetchStorageAndIp = async () => {
      try {
        const freeBytes = await getFreeDiskStorage();
        const freeGB = (freeBytes / (1024 * 1024 * 1024)).toFixed(0);
        setFreeStorageText(`${freeGB} GB Free`);
      } catch (err) {
        console.error('[DevicesScreen] Failed to get storage:', err);
      }

      try {
        const ip = await NativeNetworkModule.getLocalIpAddress();
        if (ip) setLocalIp(ip);
      } catch (err) {
        console.error('[DevicesScreen] Failed to get IP:', err);
      }
    };
    fetchStorageAndIp();
  }, []);

  const getDeviceIcon = (platformStr: string, nameStr: string) => {
    const p = (platformStr || '').toLowerCase();
    const n = (nameStr || '').toLowerCase();

    if (p === 'macos' || n.includes('macbook') || n.includes('laptop') || p === 'windows' || p === 'linux') {
      return <Laptop size={22} color={colors.primary} strokeWidth={2} />;
    }
    if (n.includes('ipad') || n.includes('tablet')) {
      return <Tablet size={22} color={colors.primary} strokeWidth={2} />;
    }
    if (n.includes('tv') || n.includes('desktop') || n.includes('pc')) {
      return <Monitor size={22} color={colors.primary} strokeWidth={2} />;
    }
    return <Smartphone size={22} color={colors.primary} strokeWidth={2} />;
  };

  const handleOpenMenu = (device: Device) => {
    setSelectedDevice(device);
    setMenuModalVisible(true);
  };

  const handleRemoveDevice = () => {
    if (!selectedDevice) return;
    removeDevice(selectedDevice.id);
    setMenuModalVisible(false);
    setSelectedDevice(null);
  };

  const handleSendFile = () => {
    setMenuModalVisible(false);
    setFilePickerVisible(true);
  };

  const handleFilesSelected = async (files: { id: string; name: string; size: number; mime: string; uri?: string }[]) => {
    if (!selectedDevice || files.length === 0) return;
    try {
      await startOutgoingTransfer(selectedDevice.ip, selectedDevice.port, files);
    } catch (err) {
      console.error('[DevicesScreen] File transfer error:', err);
    }
  };

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
        {/* Page Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={[styles.mainTitle, { color: colors.textPrimary }]}>My Devices</Text>
          <Text style={[styles.mainSubtitle, { color: colors.textSecondary }]}>
            Manage devices connected to your ShareBear account.
          </Text>
        </View>

        {/* THIS DEVICE SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>THIS DEVICE</Text>

          <View
            style={[
              styles.deviceCard,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            {/* Left Phone Icon Circle */}
            <View
              style={[
                styles.deviceIconCircle,
                {
                  backgroundColor: colors.primaryContainer,
                  borderColor: `${colors.primary}44`,
                },
              ]}
            >
              <Smartphone size={24} color={colors.primary} strokeWidth={2.2} />
            </View>

            {/* Middle Info */}
            <View style={styles.deviceInfo}>
              <Text style={[styles.deviceName, { color: colors.textPrimary }]} numberOfLines={1}>
                {deviceName || 'Pixel 8 Pro'}
              </Text>
              <View style={styles.ipRow}>
                <Wifi size={13} color={colors.secondary} style={{ marginRight: 5 }} />
                <Text style={[styles.ipText, { color: colors.textSecondary }]}>
                  IP: {localIp}
                </Text>
              </View>
            </View>

            {/* Right Status */}
            <View style={styles.rightStatus}>
              <Text style={[styles.activeStatusText, { color: colors.primary }]}>Active Now</Text>
              <Text style={[styles.storageText, { color: colors.textSecondary }]}>
                {freeStorageText}
              </Text>
            </View>
          </View>
        </View>

        {/* TRUSTED DEVICES SECTION */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>
            TRUSTED DEVICES {deviceList.length > 0 && `(${deviceList.length})`}
          </Text>

          {deviceList.length === 0 ? (
            <View
              style={[
                styles.emptyDeviceCard,
                {
                  backgroundColor: colors.cardBg,
                  borderColor: colors.cardBorder,
                },
              ]}
            >
              <Text style={[styles.emptyDeviceTitle, { color: colors.textPrimary }]}>
                No Trusted Devices Yet
              </Text>
              <Text style={[styles.emptyDeviceSubtitle, { color: colors.textSecondary }]}>
                Devices discovered nearby will appear here automatically, or tap "Add New Device" to pair a peer via QR code.
              </Text>
            </View>
          ) : (
            deviceList.map((device) => {
              const subtitle = `${device.platform || 'Device'} • ${device.ip}:${device.port}`;

              return (
                <View
                  key={device.id}
                  style={[
                    styles.deviceCard,
                    {
                      backgroundColor: colors.cardBg,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                >
                  {/* Left Device Icon Badge */}
                  <View
                    style={[
                      styles.deviceIconCircle,
                      {
                        backgroundColor: colors.surfaceElevated,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    {getDeviceIcon(device.platform, device.name)}
                  </View>

                  {/* Middle Info */}
                  <View style={styles.deviceInfo}>
                    <Text style={[styles.deviceName, { color: colors.textPrimary }]} numberOfLines={1}>
                      {device.name}
                    </Text>
                    <Text style={[styles.deviceSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                      {subtitle}
                    </Text>
                  </View>

                  {/* Right Options Button */}
                  <TouchableOpacity
                    style={styles.moreButton}
                    activeOpacity={0.7}
                    onPress={() => handleOpenMenu(device)}
                  >
                    <MoreVertical size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>

        {/* Add New Device Button */}
        <TouchableOpacity
          style={[
            styles.addDeviceButton,
            {
              backgroundColor: colors.primary,
              shadowColor: colors.primary,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => setAddModalVisible(true)}
        >
          <QrCode size={22} color={colors.onPrimary} style={styles.addIcon} strokeWidth={2.2} />
          <Text style={[styles.addDeviceText, { color: colors.onPrimary }]}>Add New Device</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Device Options Modal */}
      <Modal
        visible={menuModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuModalVisible(false)}
        >
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                {selectedDevice?.name}
              </Text>
              <TouchableOpacity onPress={() => setMenuModalVisible(false)}>
                <X size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalActionRow, { borderColor: colors.cardBorder }]}
              onPress={handleSendFile}
            >
              <Share2 size={20} color={colors.primary} />
              <Text style={[styles.modalActionText, { color: colors.textPrimary }]}>Send File</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalActionRow, { borderColor: colors.cardBorder }]}
              onPress={handleRemoveDevice}
            >
              <Trash2 size={20} color="#EF4444" />
              <Text style={[styles.modalActionText, { color: '#EF4444' }]}>Remove Device</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Device Pairing Modal */}
      <Modal
        visible={addModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setAddModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.addModalContainer,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Pair New Device</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.qrCodePlaceholder, { backgroundColor: colors.surfaceElevated, borderColor: colors.cardBorder }]}>
              <QrCode size={120} color={colors.primary} strokeWidth={1.5} />
            </View>

            <Text style={[styles.addModalInstruction, { color: colors.textSecondary }]}>
              Scan this QR code from your other device's ShareBear app to connect and trust this device instantly.
            </Text>

            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: colors.primary }]}
              activeOpacity={0.85}
              onPress={() => setAddModalVisible(false)}
            >
              <Text style={[styles.doneButtonText, { color: colors.onPrimary }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* File Selection Picker Modal */}
      <FilePickerModal
        visible={filePickerVisible}
        onClose={() => setFilePickerVisible(false)}
        onSend={handleFilesSelected}
        targetDeviceName={selectedDevice?.name}
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
  titleSection: {
    marginTop: 4,
    marginBottom: 24,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  mainSubtitle: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1.2,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 22,
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
    justifyContent: 'center',
  },
  deviceName: {
    fontSize: 16.5,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  ipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  deviceSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  rightStatus: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  activeStatusText: {
    fontSize: 12.5,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  storageText: {
    fontSize: 12,
    marginTop: 3,
    fontWeight: '500',
  },
  moreButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDeviceCard: {
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyDeviceTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptyDeviceSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  addDeviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 12,
    marginBottom: 20,
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  addIcon: {
    marginRight: 8,
  },
  addDeviceText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  modalSheet: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalActionText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 14,
  },
  addModalContainer: {
    width: '90%',
    borderRadius: 28,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  qrCodePlaceholder: {
    width: 180,
    height: 180,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 20,
  },
  addModalInstruction: {
    fontSize: 13.5,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  doneButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
});
