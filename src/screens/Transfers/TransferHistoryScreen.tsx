import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image as RNImage,
} from 'react-native';
import { useTransferStore } from '../../store/transferStore';
import { useSettingsStore } from '../../store/settingsStore';
import { TransferRepository } from '../../features/transfer/TransferRepository';
import { Transfer } from '../../features/transfer/models';
import { DeviceProfileModal } from '../../components/DeviceProfileModal';
import { useTheme } from '../../theme';
import { getAvatarImage } from '../../utils/avatars';
import { AvatarImage, getAvatarContainerRadius } from '../../components/AvatarImage';
import {
  Menu,
  Bell,
  Search,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  FolderArchive,
  Music,
  File,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
} from 'lucide-react-native';

type FilterType = 'ALL' | 'SENT' | 'RECEIVED';

export function TransferHistoryScreen() {
  const { transfers, setTransfers } = useTransferStore();
  const { deviceId, mascotSymbol } = useSettingsStore();
  const { colors } = useTheme();

  const [profileModalVisible, setProfileModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('ALL');

  const formatSize = (bytes: number): string => {
    if (bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getGroupTitle = (timestamp: number): string => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return 'Today';
    }
    if (
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear()
    ) {
      return 'Yesterday';
    }
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getFileIcon = (fileName: string, mime: string = '') => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (['zip', 'rar', '7z', 'tar', 'gz', 'bz2'].includes(ext)) {
      return {
        icon: <FolderArchive size={22} color={colors.secondary} />,
        bgColor: `${colors.secondary}22`,
      };
    }
    if (
      ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'heic'].includes(ext) ||
      mime.startsWith('image/')
    ) {
      return {
        icon: <ImageIcon size={22} color={colors.secondary} />,
        bgColor: `${colors.secondary}22`,
      };
    }
    if (
      ['mp4', 'mkv', 'mov', 'avi', 'webm', '3gp'].includes(ext) ||
      mime.startsWith('video/')
    ) {
      return {
        icon: <VideoIcon size={22} color={colors.primary} />,
        bgColor: `${colors.primary}22`,
      };
    }
    if (
      ['mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg'].includes(ext) ||
      mime.startsWith('audio/')
    ) {
      return {
        icon: <Music size={22} color={colors.tertiary} />,
        bgColor: `${colors.tertiary}22`,
      };
    }
    if (
      ['pdf', 'doc', 'docx', 'txt', 'rtf', 'csv', 'xlsx', 'json', 'md', 'xml'].includes(ext) ||
      mime.startsWith('text/')
    ) {
      return {
        icon: <FileText size={22} color={colors.textSecondary} />,
        bgColor: colors.surfaceVariant,
      };
    }
    return {
      icon: <File size={22} color={colors.textSecondary} />,
      bgColor: colors.surfaceVariant,
    };
  };

  const handleClearHistory = () => {
    TransferRepository.clearHistory();
    setTransfers({});
  };

  // Filter & Group transfers
  const groupedTransfers = useMemo(() => {
    const list = Object.values(transfers).sort((a, b) => b.createdAt - a.createdAt);

    const filtered = list.filter((item) => {
      const isOutgoing =
        item.transferId.startsWith('TR-OUT-') || item.senderId === deviceId;

      // Filter Tab Check
      if (activeFilter === 'SENT' && !isOutgoing) return false;
      if (activeFilter === 'RECEIVED' && isOutgoing) return false;

      // Search Query Check
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const hasMatchingFile = item.files.some((f) =>
          f.name.toLowerCase().includes(query)
        );
        const hasMatchingSender = item.senderName?.toLowerCase().includes(query);
        const hasMatchingId = item.transferId.toLowerCase().includes(query);

        if (!hasMatchingFile && !hasMatchingSender && !hasMatchingId) {
          return false;
        }
      }

      return true;
    });

    // Group by Date label
    const groups: { [key: string]: Transfer[] } = {};
    for (const item of filtered) {
      const groupKey = getGroupTitle(item.createdAt);
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
    }

    return groups;
  }, [transfers, activeFilter, searchQuery, deviceId]);

  const groupKeys = Object.keys(groupedTransfers);
  const totalTransfersCount = Object.keys(transfers).length;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header */}
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
                borderWidth: 0,
              },
            ]}
          >
            <AvatarImage id={mascotSymbol} size={28} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View
        style={[
          styles.searchBarContainer,
          {
            backgroundColor: colors.cardBg,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <Search size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.textPrimary }]}
          placeholder="Search history..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.clearSearchBtn}
          >
            <X size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {(['ALL', 'SENT', 'RECEIVED'] as FilterType[]).map((tab) => {
          const isActive = activeFilter === tab;
          const label = tab === 'ALL' ? 'All' : tab === 'SENT' ? 'Sent' : 'Received';
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? colors.primary : colors.cardBg,
                  borderColor: isActive ? colors.primary : colors.cardBorder,
                },
              ]}
              onPress={() => setActiveFilter(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isActive ? colors.onPrimary : colors.textSecondary,
                    fontWeight: isActive ? 'bold' : '500',
                  },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Main List Area */}
      {groupKeys.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.emptyIconCircle,
              {
                backgroundColor: colors.cardBg,
                borderColor: colors.cardBorder,
              },
            ]}
          >
            <Search size={32} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
            {totalTransfersCount === 0
              ? 'No transfers recorded yet'
              : 'No matching transfers'}
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
            {totalTransfersCount === 0
              ? 'Incoming and outgoing file request logs will appear here.'
              : 'Try searching for another filename or clear the filter.'}
          </Text>
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {groupKeys.map((groupKey) => (
            <View key={groupKey} style={styles.groupSection}>
              <Text style={[styles.groupTitle, { color: colors.textSecondary }]}>{groupKey}</Text>
              {groupedTransfers[groupKey].map((transfer) => {
                const isOutgoing =
                  transfer.transferId.startsWith('TR-OUT-') ||
                  transfer.senderId === deviceId;
                const firstFile = transfer.files[0];
                const fileName = firstFile?.name || 'Unknown File';
                const fileMime = firstFile?.mime || '';
                const { icon, bgColor } = getFileIcon(fileName, fileMime);

                const isCompleted =
                  transfer.status === 'COMPLETED' || transfer.status === 'ACCEPTED';
                const isFailed =
                  transfer.status === 'FAILED' || transfer.status === 'REJECTED';

                const targetPeer = isOutgoing
                  ? `Sent to ${transfer.receiverId ? transfer.receiverId : 'Peer'}`
                  : `Received from ${transfer.senderName || 'Peer'}`;

                return (
                  <View
                    key={transfer.transferId}
                    style={[
                      styles.card,
                      {
                        backgroundColor: colors.cardBg,
                        borderColor: colors.cardBorder,
                      },
                    ]}
                  >
                    {/* File Icon */}
                    <View style={[styles.fileIconContainer, { backgroundColor: bgColor, borderColor: colors.cardBorder, borderWidth: 1 }]}>
                      {icon}
                    </View>

                    {/* Transfer Info */}
                    <View style={styles.cardContent}>
                      <Text style={[styles.fileName, { color: colors.textPrimary }]} numberOfLines={1}>
                        {fileName}
                      </Text>
                      <Text style={[styles.subDetails, { color: colors.textSecondary }]} numberOfLines={1}>
                        {targetPeer}  •  {formatSize(transfer.totalBytes)}
                      </Text>
                    </View>

                    {/* Status & Timestamp */}
                    <View style={styles.cardRight}>
                      {isCompleted ? (
                        <CheckCircle2 size={20} color={colors.secondary} />
                      ) : isFailed ? (
                        <AlertCircle size={20} color={colors.error} />
                      ) : (
                        <ActivityIndicator size="small" color={colors.secondary} />
                      )}

                      <Text
                        style={[
                          styles.timeText,
                          { color: isFailed ? colors.error : colors.textSecondary },
                        ]}
                      >
                        {isFailed ? 'Failed' : formatTime(transfer.createdAt)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>
      )}

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
  },
  headerProfileImage: {
    width: 28,
    height: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.3,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    height: 50,
    marginBottom: 16,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  groupSection: {
    marginBottom: 20,
  },
  groupTitle: {
    color: '#BEC8C9',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D2132',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(63, 73, 83, 0.25)',
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 14,
    marginRight: 10,
    justifyContent: 'center',
  },
  fileName: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subDetails: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '500',
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  timeText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  failedTimeText: {
    color: '#F87171',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingBottom: 110,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0D2132',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(63, 73, 83, 0.25)',
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 19,
  },
});
