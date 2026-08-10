import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { useTransferStore } from '../store/transferStore';
import { useDeviceStore } from '../store/deviceStore';
import { acceptIncomingTransfer, rejectIncomingTransfer } from '../features/transfer/TransferManager';
import { useTheme } from '../theme';
import {
  DownloadCloud,
  Check,
  X,
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music,
  File,
  Smartphone,
  Laptop,
  Monitor,
  ShieldCheck,
  Clock,
  Heart,
} from 'lucide-react-native';

export function IncomingTransferDialog() {
  const { activeIncomingRequest } = useTransferStore();
  const { favoriteDevices, toggleFavorite } = useDeviceStore();
  const { colors, isDarkMode } = useTheme();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timeoutProgress = useRef(new Animated.Value(1)).current;
  const [secondsRemaining, setSecondsRemaining] = useState(60);

  useEffect(() => {
    if (!activeIncomingRequest) return;

    // Reset countdown and animations
    timeoutProgress.setValue(1);
    setSecondsRemaining(60);

    // Pulse animation for the incoming radar beacon
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    // 60-second smooth timeout bar
    Animated.timing(timeoutProgress, {
      toValue: 0,
      duration: 60000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);

    return () => {
      pulse.stop();
      clearInterval(interval);
    };
  }, [activeIncomingRequest]);

  if (!activeIncomingRequest) {
    return null;
  }

  const { transferId, request } = activeIncomingRequest;
  const senderName = request.sender?.deviceName || 'Nearby Device';
  const fileCount = request.totalFiles || request.files?.length || 1;
  const totalSize = request.totalSize || request.files?.reduce((acc: number, f: any) => acc + (f.size || 0), 0) || 0;
  const filesList = request.files || [];

  const formatSize = (bytes: number): string => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string, mime?: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const m = (mime || '').toLowerCase();

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic'].includes(ext) || m.startsWith('image/')) {
      return <ImageIcon size={20} color="#EC4899" strokeWidth={2.2} />;
    }
    if (['mp4', 'mkv', 'mov', 'avi', 'webm'].includes(ext) || m.startsWith('video/')) {
      return <VideoIcon size={20} color="#8B5CF6" strokeWidth={2.2} />;
    }
    if (['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg'].includes(ext) || m.startsWith('audio/')) {
      return <Music size={20} color="#10B981" strokeWidth={2.2} />;
    }
    if (['pdf', 'doc', 'docx', 'txt', 'rtf', 'csv', 'xlsx', 'pptx'].includes(ext) || m.startsWith('text/') || m.includes('pdf')) {
      return <FileText size={20} color="#3B82F6" strokeWidth={2.2} />;
    }
    return <File size={20} color={colors.primary} strokeWidth={2.2} />;
  };

  const handleAccept = async () => {
    await acceptIncomingTransfer(transferId);
  };

  const handleReject = async () => {
    await rejectIncomingTransfer(transferId);
  };

  const timeoutBarWidth = timeoutProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const innerCardBg = isDarkMode ? 'rgba(0, 0, 0, 0.32)' : 'rgba(0, 0, 0, 0.045)';
  const innerCardBorder = isDarkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.09)';

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={true}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.dialogCard,
            {
              backgroundColor: colors.surfaceElevated,
              borderColor: `${colors.primary}45`,
              shadowColor: colors.primary,
            },
          ]}
        >
          {/* Header Beacon Icon */}
          <View style={styles.beaconHeader}>
            <Animated.View
              style={[
                styles.beaconGlow,
                {
                  backgroundColor: `${colors.primary}20`,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <View
              style={[
                styles.beaconCircle,
                {
                  backgroundColor: colors.primaryContainer,
                  borderColor: `${colors.primary}50`,
                },
              ]}
            >
              {request.transferType === 'clipboard' ? (
                <FileText size={28} color={colors.primary} strokeWidth={2.3} />
              ) : request.transferType === 'text' ? (
                <FileText size={28} color={colors.primary} strokeWidth={2.3} />
              ) : (
                <DownloadCloud size={28} color={colors.primary} strokeWidth={2.3} />
              )}
            </View>
          </View>

          {/* Title & Subtitle */}
          <Text style={[styles.dialogTitle, { color: colors.textPrimary }]}>
            {request.transferType === 'clipboard'
              ? 'Incoming Clipboard'
              : request.transferType === 'text'
              ? 'Incoming Text Message'
              : 'Incoming Share Request'}
          </Text>
          <Text style={[styles.dialogSubtitle, { color: colors.textSecondary }]}>
            {request.transferType === 'clipboard' || request.transferType === 'text'
              ? `${senderName} wants to share text with you`
              : 'A nearby device wants to transfer files to you'}
          </Text>

          {/* Sender Profile Box */}
          <View
            style={[
              styles.senderCard,
              {
                backgroundColor: innerCardBg,
                borderColor: innerCardBorder,
              },
            ]}
          >
            <View
              style={[
                styles.senderAvatar,
                {
                  backgroundColor: colors.primaryContainer,
                  borderColor: `${colors.primary}33`,
                },
              ]}
            >
              <Text style={styles.senderEmoji}>🐻</Text>
            </View>
            <View style={styles.senderInfo}>
              <Text style={[styles.senderLabel, { color: colors.textMuted }]}>
                FROM DEVICE
              </Text>
              <Text style={[styles.senderName, { color: colors.textPrimary }]} numberOfLines={1}>
                {senderName}
              </Text>
            </View>

            {/* Trust / Favorite Toggle Button */}
            <TouchableOpacity
              style={[
                styles.heartActionBtn,
                {
                  backgroundColor: !!favoriteDevices[request.sender.deviceId]
                    ? 'rgba(239, 68, 68, 0.16)'
                    : isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  borderColor: !!favoriteDevices[request.sender.deviceId]
                    ? 'rgba(239, 68, 68, 0.38)'
                    : innerCardBorder,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                toggleFavorite({
                  id: request.sender.deviceId,
                  name: senderName,
                  ip: '',
                  port: 53317,
                  platform: 'Android',
                  lastSeen: Date.now(),
                  isOnline: true,
                });
              }}
            >
              <Heart
                size={14}
                color={!!favoriteDevices[request.sender.deviceId] ? '#EF4444' : colors.textSecondary}
                fill={!!favoriteDevices[request.sender.deviceId] ? '#EF4444' : 'transparent'}
                strokeWidth={2.2}
              />
              <Text
                style={[
                  styles.heartActionBtnText,
                  {
                    color: !!favoriteDevices[request.sender.deviceId]
                      ? '#EF4444'
                      : colors.textSecondary,
                  },
                ]}
              >
                {!!favoriteDevices[request.sender.deviceId] ? 'Trusted' : 'Trust'}
              </Text>
            </TouchableOpacity>

            <View
              style={[
                styles.secureBadge,
                {
                  backgroundColor: `${colors.secondary}18`,
                  borderColor: `${colors.secondary}30`,
                  marginLeft: 6,
                },
              ]}
            >
              <ShieldCheck size={13} color={colors.secondary} strokeWidth={2.2} style={{ marginRight: 3 }} />
              <Text style={[styles.secureBadgeText, { color: colors.secondary }]}>
                P2P
              </Text>
            </View>
          </View>

          {/* Body: Text Preview vs Files Summary */}
          {request.transferType === 'text' || request.transferType === 'clipboard' ? (
            <View
              style={[
                styles.filesContainer,
                {
                  backgroundColor: innerCardBg,
                  borderColor: innerCardBorder,
                  padding: 14,
                },
              ]}
            >
              <View style={styles.filesSummaryRow}>
                <Text style={[styles.filesSummaryCount, { color: colors.primary }]}>
                  {request.transferType === 'clipboard' ? 'CLIPBOARD TRANSFER' : 'TEXT MESSAGE'}
                </Text>
                <View style={[styles.sizePill, { backgroundColor: `${colors.primary}18` }]}>
                  <Text style={[styles.sizePillText, { color: colors.primary }]}>
                    {formatSize(totalSize || 0)}
                  </Text>
                </View>
              </View>
              <Text
                style={{
                  fontSize: 13,
                  lineHeight: 19,
                  color: colors.textSecondary,
                  marginTop: 8,
                  fontStyle: 'italic',
                }}
              >
                🔒 Protected transfer • Content will be displayed and copied upon acceptance.
              </Text>
            </View>
          ) : (
            <View
              style={[
                styles.filesContainer,
                {
                  backgroundColor: innerCardBg,
                  borderColor: innerCardBorder,
                },
              ]}
            >
              {/* Summary Row */}
              <View style={styles.filesSummaryRow}>
                <Text style={[styles.filesSummaryCount, { color: colors.primary }]}>
                  {fileCount === 1 ? '1 FILE TO RECEIVE' : `${fileCount} FILES TO RECEIVE`}
                </Text>
                <View style={[styles.sizePill, { backgroundColor: `${colors.primary}18` }]}>
                  <Text style={[styles.sizePillText, { color: colors.primary }]}>
                    {formatSize(totalSize)}
                  </Text>
                </View>
              </View>

              {/* Scrollable File List */}
              <ScrollView
                style={styles.filesScrollView}
                contentContainerStyle={styles.filesScrollContent}
                showsVerticalScrollIndicator={filesList.length > 2}
                nestedScrollEnabled={true}
              >
                {filesList.slice(0, 5).map((f: any, idx: number) => (
                  <View
                    key={idx}
                    style={[
                      styles.fileItemRow,
                      idx < Math.min(filesList.length, 5) - 1 && {
                        borderBottomWidth: 1,
                        borderBottomColor: innerCardBorder,
                      },
                    ]}
                  >
                    <View style={styles.fileIconBox}>
                      {getFileIcon(f.name || 'file', f.mime)}
                    </View>
                    <View style={styles.fileDetailsCol}>
                      <Text style={[styles.fileNameText, { color: colors.textPrimary }]} numberOfLines={1}>
                        {f.name || 'Unnamed file'}
                      </Text>
                      <Text style={[styles.fileSizeText, { color: colors.textSecondary }]}>
                        {formatSize(f.size || 0)}
                      </Text>
                    </View>
                  </View>
                ))}

                {filesList.length > 5 && (
                  <Text style={[styles.moreFilesText, { color: colors.textMuted }]}>
                    + {filesList.length - 5} more files
                  </Text>
                )}
              </ScrollView>
            </View>
          )}

          {/* Timeout Progress Bar */}
          <View style={styles.timeoutContainer}>
            <View style={styles.timeoutHeaderRow}>
              <View style={styles.timeoutLeft}>
                <Clock size={12} color={colors.textSecondary} style={{ marginRight: 4 }} />
                <Text style={[styles.timeoutLabel, { color: colors.textSecondary }]}>
                  Auto-declines in
                </Text>
              </View>
              <Text style={[styles.timeoutSeconds, { color: secondsRemaining <= 5 ? colors.error : colors.primary }]}>
                {secondsRemaining}s
              </Text>
            </View>
            <View style={[styles.timeoutTrack, { backgroundColor: innerCardBg }]}>
              <Animated.View
                style={[
                  styles.timeoutFill,
                  {
                    width: timeoutBarWidth,
                    backgroundColor: secondsRemaining <= 5 ? colors.error : colors.primary,
                  },
                ]}
              />
            </View>
          </View>

          {/* Action Buttons Row */}
          <View style={styles.buttonRow}>
            {/* Decline Button */}
            <TouchableOpacity
              style={[
                styles.declineButton,
                {
                  backgroundColor: `${colors.error}15`,
                  borderColor: `${colors.error}35`,
                },
              ]}
              onPress={handleReject}
              activeOpacity={0.8}
            >
              <X size={18} color={colors.error} strokeWidth={2.4} style={{ marginRight: 6 }} />
              <Text style={[styles.declineButtonText, { color: colors.error }]}>
                Decline
              </Text>
            </TouchableOpacity>

            {/* Accept Button */}
            <TouchableOpacity
              style={[
                styles.acceptButton,
                {
                  backgroundColor: colors.primary,
                  shadowColor: colors.primary,
                },
              ]}
              onPress={handleAccept}
              activeOpacity={0.85}
            >
              <Check size={19} color={colors.onPrimary} strokeWidth={2.6} style={{ marginRight: 6 }} />
              <Text style={[styles.acceptButtonText, { color: colors.onPrimary }]}>
                {request.transferType === 'text' || request.transferType === 'clipboard'
                  ? 'Accept & Copy'
                  : 'Accept'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 32,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 28,
    borderWidth: 1.5,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    elevation: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
  },
  beaconHeader: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    position: 'relative',
  },
  beaconGlow: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  beaconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  dialogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  dialogSubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 18,
  },
  senderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  senderAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  senderEmoji: {
    fontSize: 22,
  },
  senderInfo: {
    flex: 1,
  },
  senderLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  senderName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  heartActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1,
    gap: 4,
  },
  heartActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  secureBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  filesContainer: {
    width: '100%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  filesSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 6,
  },
  filesSummaryCount: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  sizePill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  sizePillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  filesScrollView: {
    maxHeight: 130,
  },
  filesScrollContent: {
    paddingVertical: 2,
  },
  fileItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  fileIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  fileDetailsCol: {
    flex: 1,
  },
  fileNameText: {
    fontSize: 13.5,
    fontWeight: '600',
    marginBottom: 2,
  },
  fileSizeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreFilesText: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  timeoutContainer: {
    width: '100%',
    marginBottom: 18,
  },
  timeoutHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  timeoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeoutLabel: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  timeoutSeconds: {
    fontSize: 12,
    fontWeight: '800',
  },
  timeoutTrack: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  timeoutFill: {
    height: '100%',
    borderRadius: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  declineButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  acceptButton: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 16,
    elevation: 4,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
  },
  acceptButtonText: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
