import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { useDeviceStore, Device } from '../store/deviceStore';
import { useTheme } from '../theme';
import {
  Heart,
  Laptop,
  Smartphone,
  Tablet,
  Monitor,
  Wifi,
  Search,
  X,
  ShieldCheck,
  Send,
  Trash2,
} from 'lucide-react-native';

interface FavoriteDevicesModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDevice: (device: Device) => void;
  currentWifiName?: string;
}

export function FavoriteDevicesModal({
  visible,
  onClose,
  onSelectDevice,
  currentWifiName,
}: FavoriteDevicesModalProps) {
  const { favoriteDevices, toggleFavorite } = useDeviceStore();
  const { colors, isDarkMode } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  if (!visible) {
    return null;
  }

  const favoriteList = Object.values(favoriteDevices);

  const filteredList = favoriteList.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return d.name.toLowerCase().includes(q) || d.ip.includes(q);
  });

  const getDeviceIcon = (platform: string, name: string) => {
    const p = (platform || '').toLowerCase();
    const n = (name || '').toLowerCase();

    if (p.includes('mac') || p.includes('win') || p.includes('linux') || n.includes('pc') || n.includes('laptop') || n.includes('macbook')) {
      return <Laptop size={22} color={colors.primary} strokeWidth={2.2} />;
    }
    if (p.includes('pad') || n.includes('ipad') || n.includes('tab')) {
      return <Tablet size={22} color={colors.primary} strokeWidth={2.2} />;
    }
    if (p.includes('tv') || n.includes('tv')) {
      return <Monitor size={22} color={colors.primary} strokeWidth={2.2} />;
    }
    return <Smartphone size={22} color={colors.primary} strokeWidth={2.2} />;
  };

  const innerCardBg = isDarkMode ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.04)';
  const innerCardBorder = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)';

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: `${colors.primary}40`,
              shadowColor: colors.primary,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View
                style={[
                  styles.heartHeaderBadge,
                  {
                    backgroundColor: 'rgba(239, 68, 68, 0.16)',
                    borderColor: 'rgba(239, 68, 68, 0.35)',
                  },
                ]}
              >
                <Heart size={20} color="#EF4444" fill="#EF4444" strokeWidth={2.2} />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Favorite Devices
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  {favoriteList.length} trusted {favoriteList.length === 1 ? 'device' : 'devices'} saved
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.closeBtn, { backgroundColor: innerCardBg }]}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Search Bar (if > 2 devices) */}
          {favoriteList.length > 2 && (
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: innerCardBg,
                  borderColor: innerCardBorder,
                },
              ]}
            >
              <Search size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search favorite devices..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={15} color={colors.textMuted} />
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Device List */}
          <ScrollView
            style={styles.deviceListScroll}
            contentContainerStyle={styles.deviceListContent}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            {favoriteList.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <View
                  style={[
                    styles.emptyMascotCircle,
                    {
                      backgroundColor: `${colors.primary}18`,
                      borderColor: `${colors.primary}35`,
                    },
                  ]}
                >
                  <Heart size={32} color="#EF4444" fill="#EF4444" strokeWidth={2} />
                </View>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  No Favorite Devices
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  Tap the heart icon on any nearby device to mark it as a trusted favorite for instant sharing.
                </Text>
              </View>
            ) : filteredList.length === 0 ? (
              <View style={styles.emptyStateContainer}>
                <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                  No Matches Found
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  No favorite devices matched "{searchQuery}".
                </Text>
              </View>
            ) : (
              filteredList.map((device) => {
                const isOnline = !!device.isOnline;

                return (
                  <TouchableOpacity
                    key={device.id}
                    style={[
                      styles.deviceCard,
                      {
                        backgroundColor: innerCardBg,
                        borderColor: innerCardBorder,
                      },
                    ]}
                    activeOpacity={0.75}
                    onPress={() => {
                      onSelectDevice(device);
                      onClose();
                    }}
                  >
                    {/* Device Icon Avatar */}
                    <View
                      style={[
                        styles.deviceAvatar,
                        {
                          backgroundColor: colors.surfaceElevated,
                          borderColor: innerCardBorder,
                        },
                      ]}
                    >
                      {getDeviceIcon(device.platform, device.name)}
                      {/* Online dot indicator */}
                      <View
                        style={[
                          styles.onlineDot,
                          {
                            backgroundColor: isOnline ? '#10B981' : colors.textMuted,
                            borderColor: colors.surfaceElevated,
                          },
                        ]}
                      />
                    </View>

                    {/* Device Info */}
                    <View style={styles.deviceInfoCol}>
                      <View style={styles.deviceNameRow}>
                        <Text
                          style={[styles.deviceName, { color: colors.textPrimary }]}
                          numberOfLines={1}
                        >
                          {device.name}
                        </Text>
                        <View
                          style={[
                            styles.trustedBadge,
                            {
                              backgroundColor: 'rgba(239, 68, 68, 0.14)',
                              borderColor: 'rgba(239, 68, 68, 0.28)',
                            },
                          ]}
                        >
                          <ShieldCheck size={11} color="#EF4444" style={{ marginRight: 3 }} />
                          <Text style={styles.trustedBadgeText}>Trusted</Text>
                        </View>
                      </View>

                      {/* Network Badges */}
                      <View style={styles.badgeRow}>
                        <View
                          style={[
                            styles.miniPill,
                            {
                              backgroundColor: `${colors.secondary}16`,
                              borderColor: `${colors.secondary}28`,
                            },
                          ]}
                        >
                          <Wifi size={10} color={colors.secondary} style={{ marginRight: 3 }} />
                          <Text style={[styles.miniPillText, { color: colors.secondary }]}>
                            {device.ip}:{device.port || 53317}
                          </Text>
                        </View>

                        <View
                          style={[
                            styles.statusMiniPill,
                            {
                              backgroundColor: isOnline ? 'rgba(16, 185, 129, 0.14)' : innerCardBg,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusMiniPillText,
                              { color: isOnline ? '#10B981' : colors.textMuted },
                            ]}
                          >
                            {isOnline ? 'Online' : 'Saved'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {/* Quick Send Action Icon */}
                    <View style={styles.actionButtonsCol}>
                      <View
                        style={[
                          styles.sendIconCircle,
                          {
                            backgroundColor: colors.primary,
                          },
                        ]}
                      >
                        <Send size={14} color={colors.onPrimary} strokeWidth={2.4} />
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Footer Close Button */}
          <TouchableOpacity
            style={[
              styles.dismissButton,
              {
                backgroundColor: innerCardBg,
                borderColor: innerCardBorder,
              },
            ]}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={[styles.dismissButtonText, { color: colors.textSecondary }]}>
              Close
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    maxHeight: '85%',
    borderRadius: 26,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 18,
    elevation: 14,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  heartHeaderBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13.5,
    padding: 0,
    margin: 0,
  },
  deviceListScroll: {
    maxHeight: 340,
    marginBottom: 14,
  },
  deviceListContent: {
    gap: 10,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
  },
  deviceAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginRight: 12,
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  deviceInfoCol: {
    flex: 1,
  },
  deviceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  deviceName: {
    fontSize: 14.5,
    fontWeight: '700',
    flex: 1,
  },
  trustedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 0.8,
    marginLeft: 6,
  },
  trustedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 0.8,
  },
  miniPillText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  statusMiniPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusMiniPillText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  actionButtonsCol: {
    marginLeft: 10,
  },
  sendIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
  },
  emptyMascotCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    textAlign: 'center',
  },
  dismissButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
  },
  dismissButtonText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});
