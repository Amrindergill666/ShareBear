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
} from 'react-native';
import { useDeviceStore, Device } from '../../store/deviceStore';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { startDiscovery, stopDiscovery } from '../../features/discovery/discoveryManager';
import { RadarAnimation } from '../../components/RadarAnimation';

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

  const handleToggleDiscovery = async () => {
    if (isDiscoveryActive) {
      await stopDiscovery();
    } else {
      await startDiscovery();
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
      {/* Header Info Panel */}
      <View style={styles.headerCard}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerLabel}>Local Device Profile</Text>
          <Text style={styles.deviceName}>{deviceName || 'ShareBear Device'}</Text>
          <Text style={styles.deviceId}>ID: {deviceId || 'First scan will generate ID'}</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {RNPlatform.OS === 'android' ? 'Android' : 'iOS'}
          </Text>
        </View>
      </View>

      {/* Radar Section */}
      <View style={styles.radarSection}>
        <RadarAnimation active={isDiscoveryActive} />
        <Text style={styles.radarStatus}>
          {isDiscoveryActive ? 'Scanning for nearby devices...' : 'Discovery is inactive'}
        </Text>
      </View>

      {/* Nearby Devices Section */}
      <View style={styles.listContainer}>
        <Text style={styles.sectionTitle}>
          Nearby Devices ({deviceList.length})
        </Text>

        {deviceList.length === 0 ? (
          <ScrollView
            contentContainerStyle={styles.emptyContainer}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.emptyText}>
              {isDiscoveryActive
                ? 'Looking for other ShareBear devices on your local network...'
                : 'Turn on discovery to find other devices on your LAN.'}
            </Text>
            {isDiscoveryActive && (
              <ActivityIndicator
                size="small"
                color="#3B82F6"
                style={{ marginTop: 16 }}
              />
            )}
          </ScrollView>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {deviceList.map((device) => (
              <TouchableOpacity
                key={device.id}
                style={styles.deviceCard}
                onPress={() => setSelectedDevice(device)}
                activeOpacity={0.7}
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
                  <Text style={styles.deviceCardName}>{device.name}</Text>
                  <Text style={styles.deviceDetails}>
                    IP: {device.ip}:{device.port}
                  </Text>
                </View>

                <View style={styles.inspectBadge}>
                  <Text style={styles.inspectText}>Inspect API</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Action Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            isDiscoveryActive ? styles.actionButtonActive : styles.actionButtonInactive,
          ]}
          onPress={handleToggleDiscovery}
        >
          <Text style={styles.actionButtonText}>
            {isDiscoveryActive ? 'Stop Discovery' : 'Start Discovery'}
          </Text>
        </TouchableOpacity>
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
              {/* Header */}
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

              {/* Endpoint Tabs */}
              <View style={styles.endpointsContainer}>
                {['/info', '/ping', '/health', '/capabilities'].map((path) => (
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

              {/* Response Code Block */}
              <View style={styles.responseContainer}>
                <View style={styles.responseHeaderRow}>
                  <Text style={styles.responseHeaderLabel}>Response Body</Text>
                  <TouchableOpacity
                    style={styles.refreshButton}
                    onPress={() => fetchEndpoint(selectedDevice, activeEndpoint)}
                    disabled={apiLoading}
                  >
                    <Text style={styles.refreshButtonText}>🔄 Retry</Text>
                  </TouchableOpacity>
                </View>

                {apiLoading ? (
                  <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color="#3B82F6" />
                    <Text style={styles.loadingText}>Calling peer endpoint...</Text>
                  </View>
                ) : apiError ? (
                  <ScrollView style={styles.errorScroll}>
                    <Text style={styles.errorTextTitle}>⚠️ Connection Error</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 20,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 16,
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
  inspectBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderWidth: 0.5,
    borderColor: 'rgba(59, 130, 246, 0.3)',
  },
  inspectText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  footer: {
    marginTop: 16,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
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
});
