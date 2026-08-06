import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform as RNPlatform,
} from 'react-native';
import { useDeviceStore } from '../../store/deviceStore';
import { useUiStore } from '../../store/uiStore';
import { useSettingsStore } from '../../store/settingsStore';
import { startDiscovery, stopDiscovery } from '../../features/discovery/discoveryManager';
import { RadarAnimation } from '../../components/RadarAnimation';

export function HomeScreen() {
  const { devices } = useDeviceStore();
  const { isDiscoveryActive } = useUiStore();
  const { deviceName, deviceId } = useSettingsStore();

  const deviceList = Object.values(devices);


  const handleToggleDiscovery = async () => {
    if (isDiscoveryActive) {
      await stopDiscovery();
    } else {
      await startDiscovery();
    }
  };

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

                <View style={styles.statusContainer}>
                  <View style={styles.statusIndicator} />
                  <Text style={styles.statusText}>Active</Text>
                </View>
              </View>
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
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  statusIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#10B981',
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
});
